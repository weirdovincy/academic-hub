import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePdfTextExtractor } from './usePdfTextExtractor';
import { usePdfSummarizer } from './usePdfSummarizer';

interface UploadFormData {
  collegeName: string;
  collegeAddress: string;
  institutionDetails: string;
  branch: string;
  yearOfStudy: string;
  academicYear: string;
  subjectName: string;
  chapter: string;
  description: string;
  uploadRole: 'student' | 'lecturer' | 'owner';
  file: File;
}

interface UploadResult {
  pdfId: string;
  fileUrl: string;
  summary: string | null;
  summaryGeneratedAt: string | null;
}

type UploadStage = 'idle' | 'extracting' | 'uploading' | 'summarizing' | 'saving' | 'complete' | 'error';

export function usePdfUpload() {
  const { user, profile } = useAuth();
  const { extractText, isExtracting, progress: extractProgress } = usePdfTextExtractor();
  const { summarize, isSummarizing } = usePdfSummarizer();
  
  const [stage, setStage] = useState<UploadStage>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (formData: UploadFormData): Promise<UploadResult> => {
    if (!user) {
      throw new Error('You must be logged in to upload');
    }

    setError(null);
    setStage('extracting');
    setUploadProgress(0);

    try {
      // Step 1: Extract text from PDF
      console.log('Extracting text from PDF...');
      const { text: pdfText, pageCount } = await extractText(formData.file);
      console.log(`Extracted ${pdfText.length} characters from ${pageCount} pages`);

      // Step 2: Upload file to Supabase Storage
      setStage('uploading');
      setUploadProgress(10);

      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${formData.collegeName.toLowerCase().replace(/\s+/g, '-')}/${formData.branch.toLowerCase().replace(/\s+/g, '-')}/${formData.yearOfStudy.toLowerCase().replace(/\s+/g, '-')}/${formData.subjectName.toLowerCase().replace(/\s+/g, '-')}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, formData.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setUploadProgress(40);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('pdfs')
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;

      // Step 3: Generate AI summary
      setStage('summarizing');
      setUploadProgress(50);

      let summary: string | null = null;
      let summaryGeneratedAt: string | null = null;

      try {
        const summaryResult = await summarize(pdfText, formData.file.name);
        summary = summaryResult.summary;
        summaryGeneratedAt = summaryResult.generatedAt;
        console.log('Summary generated successfully');
      } catch (summaryError) {
        console.warn('Failed to generate summary:', summaryError);
        // Continue without summary - we'll mark it for later generation
      }

      setUploadProgress(80);

      // Step 4: Save metadata to database
      setStage('saving');

      const isVerified = formData.uploadRole === 'lecturer' || formData.uploadRole === 'owner';

      const { data: pdfData, error: insertError } = await supabase
        .from('pdfs')
        .insert({
          user_id: user.id,
          file_name: formData.file.name,
          file_url: fileUrl,
          file_size: formData.file.size,
          college_name: formData.collegeName,
          college_address: formData.collegeAddress,
          institution_details: formData.institutionDetails || null,
          branch: formData.branch,
          year_of_study: formData.yearOfStudy,
          academic_year: formData.academicYear,
          subject_name: formData.subjectName,
          chapter: formData.chapter,
          description: formData.description || null,
          upload_role: formData.uploadRole,
          is_verified: isVerified,
          verified_at: isVerified ? new Date().toISOString() : null,
          ai_summary: summary,
          summary_generated_at: summaryGeneratedAt,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to save PDF metadata: ${insertError.message}`);
      }

      // Step 5: Award points to user (5 points per upload)
      if (profile) {
        const newPoints = (profile.points || 0) + 5;
        await supabase
          .from('profiles')
          .update({ points: newPoints })
          .eq('id', user.id);
      }

      setUploadProgress(100);
      setStage('complete');

      return {
        pdfId: pdfData.id,
        fileUrl,
        summary,
        summaryGeneratedAt,
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setStage('error');
      throw new Error(errorMessage);
    }
  }, [user, profile, extractText, summarize]);

  return {
    upload,
    stage,
    uploadProgress,
    extractProgress,
    isExtracting,
    isSummarizing,
    error,
    reset: useCallback(() => {
      setStage('idle');
      setUploadProgress(0);
      setError(null);
    }, []),
  };
}
