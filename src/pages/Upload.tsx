import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  GraduationCap,
  BookOpen,
  UserCircle,
  Upload as UploadIcon,
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, title: 'College', icon: Building2 },
  { id: 2, title: 'Academic', icon: GraduationCap },
  { id: 3, title: 'Subject', icon: BookOpen },
  { id: 4, title: 'Role', icon: UserCircle },
  { id: 5, title: 'Upload', icon: UploadIcon },
];

const BRANCHES = [
  'Computer Science (CSE)',
  'Electronics & Communication (ECE)',
  'Mechanical Engineering (MECH)',
  'Civil Engineering (CIVIL)',
  'Electrical Engineering (EE)',
  'Information Technology (IT)',
  'Chemical Engineering (CHEM)',
  'Biotechnology',
  'Other',
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const ACADEMIC_YEARS = ['2024-2025', '2023-2024', '2022-2023', '2021-2022'];

interface FormData {
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
  file: File | null;
}

export default function Upload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    collegeName: profile?.college_name || '',
    collegeAddress: profile?.college_address || '',
    institutionDetails: '',
    branch: '',
    yearOfStudy: '',
    academicYear: '',
    subjectName: '',
    chapter: '',
    description: '',
    uploadRole: profile?.role || 'student',
    file: null,
  });

  const updateFormData = (field: keyof FormData, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return Boolean(formData.collegeName && formData.collegeAddress);
      case 2:
        return Boolean(formData.branch && formData.yearOfStudy && formData.academicYear);
      case 3:
        return Boolean(formData.subjectName && formData.chapter);
      case 4:
        return Boolean(formData.uploadRole);
      case 5:
        return Boolean(formData.file);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    } else {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields before proceeding.',
        variant: 'destructive',
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF file.',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 50MB.',
          variant: 'destructive',
        });
        return;
      }
      updateFormData('file', file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.file) {
      toast({
        title: 'No file selected',
        description: 'Please select a PDF file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 200);

    // TODO: Implement actual file upload to Supabase Storage
    // and save metadata to database
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    clearInterval(interval);
    setUploadProgress(100);

    toast({
      title: 'Upload successful!',
      description: 'Your PDF has been uploaded. AI summary is being generated.',
    });

    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-display font-semibold mb-2">College Information</h2>
              <p className="text-muted-foreground">
                Enter your institution details for proper classification.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="collegeName">College Name *</Label>
                <Input
                  id="collegeName"
                  placeholder="e.g., MIT, Stanford University"
                  value={formData.collegeName}
                  onChange={(e) => updateFormData('collegeName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collegeAddress">College Address *</Label>
                <Input
                  id="collegeAddress"
                  placeholder="City, State, Country"
                  value={formData.collegeAddress}
                  onChange={(e) => updateFormData('collegeAddress', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institutionDetails">Additional Details (Optional)</Label>
                <Textarea
                  id="institutionDetails"
                  placeholder="Any additional institution information..."
                  value={formData.institutionDetails}
                  onChange={(e) => updateFormData('institutionDetails', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-display font-semibold mb-2">Academic Classification</h2>
              <p className="text-muted-foreground">
                Select the academic details for this resource.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Branch / Stream *</Label>
                <Select
                  value={formData.branch}
                  onValueChange={(value) => updateFormData('branch', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year of Study *</Label>
                <Select
                  value={formData.yearOfStudy}
                  onValueChange={(value) => updateFormData('yearOfStudy', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic Year *</Label>
                <Select
                  value={formData.academicYear}
                  onValueChange={(value) => updateFormData('academicYear', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACADEMIC_YEARS.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-display font-semibold mb-2">Subject Details</h2>
              <p className="text-muted-foreground">
                Provide information about the subject and topic.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subjectName">Subject Name *</Label>
                <Input
                  id="subjectName"
                  placeholder="e.g., Data Structures, Thermodynamics"
                  value={formData.subjectName}
                  onChange={(e) => updateFormData('subjectName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chapter">Chapter / Unit / Topic *</Label>
                <Input
                  id="chapter"
                  placeholder="e.g., Unit 3 - Binary Trees"
                  value={formData.chapter}
                  onChange={(e) => updateFormData('chapter', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the content..."
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-display font-semibold mb-2">Upload Role</h2>
              <p className="text-muted-foreground">
                Select your role for this upload. This affects verification status.
              </p>
            </div>
            <RadioGroup
              value={formData.uploadRole}
              onValueChange={(value) => updateFormData('uploadRole', value as 'student' | 'lecturer' | 'owner')}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 p-4 rounded-xl border border-border hover:border-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="student" id="student" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="student" className="cursor-pointer font-medium">
                    Student
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload as a student resource. Won't receive verified badge.
                  </p>
                </div>
                <span className="role-badge role-badge-student">Student</span>
              </div>
              <div className="flex items-start space-x-3 p-4 rounded-xl border border-border hover:border-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="lecturer" id="lecturer" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="lecturer" className="cursor-pointer font-medium">
                    Lecturer
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload as a lecturer. Content will be automatically verified.
                  </p>
                </div>
                <span className="role-badge role-badge-lecturer">Verified</span>
              </div>
              <div className="flex items-start space-x-3 p-4 rounded-xl border border-border hover:border-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="owner" id="owner" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="owner" className="cursor-pointer font-medium">
                    Owner / Admin
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload as institution owner. Content marked as official.
                  </p>
                </div>
                <span className="role-badge role-badge-owner">Official</span>
              </div>
            </RadioGroup>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-display font-semibold mb-2">Upload PDF</h2>
              <p className="text-muted-foreground">
                Select your PDF file. Maximum size: 50MB.
              </p>
            </div>
            
            {!isUploading ? (
              <div className="space-y-4">
                <label
                  htmlFor="file-upload"
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
                    formData.file
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50 hover:bg-muted/50"
                  )}
                >
                  {formData.file ? (
                    <div className="flex flex-col items-center">
                      <div className="p-3 rounded-xl bg-accent/10 mb-3">
                        <FileText className="h-8 w-8 text-accent" />
                      </div>
                      <p className="font-medium text-foreground">{formData.file.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(formData.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="p-3 rounded-xl bg-muted mb-3">
                        <UploadIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="font-medium">Click to upload or drag and drop</p>
                      <p className="text-sm text-muted-foreground mt-1">PDF only (max 50MB)</p>
                    </div>
                  )}
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {formData.file && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFormData('file', null)}
                  >
                    Remove file
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4 py-8">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
                  <p className="font-medium mb-2">Uploading your PDF...</p>
                  <p className="text-sm text-muted-foreground">Please wait while we process your file</p>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-center text-sm text-muted-foreground">{uploadProgress}% complete</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="container max-w-3xl py-8 lg:py-12">
        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "step-indicator",
                      currentStep === step.id && "step-indicator-active",
                      currentStep > step.id && "step-indicator-completed",
                      currentStep < step.id && "step-indicator-pending"
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs mt-2 hidden sm:block",
                      currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-8 sm:w-16 lg:w-24 mx-2",
                      currentStep > step.id ? "bg-success" : "bg-border"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-6 lg:p-8">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={currentStep === 1 ? () => navigate('/') : handlePrevious}
              disabled={isUploading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </Button>

            {currentStep < 5 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!formData.file || isUploading}
                className="glow-accent"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Upload PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
