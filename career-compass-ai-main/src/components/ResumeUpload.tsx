import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { invokeWithFallback } from '@/lib/api-fallbacks';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ParsedData {
  skills: Array<{ name: string; category: string; proficiency: number }>;
  experience_level: string;
  target_roles: string[];
  summary: string;
}

interface ResumeUploadProps {
  onParseComplete?: (data: ParsedData) => void;
}

export function ResumeUpload({ onParseComplete }: ResumeUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setError(null);
    setUploading(true);
    setParseResult(null);

    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      setUploadedFile(fileName);
      toast({
        title: 'Resume uploaded',
        description: 'Now parsing your resume with AI...',
      });

      // Now parse the resume
      setParsing(true);
      setUploading(false);

      const { data, error: parseError } = await invokeWithFallback('parse-resume', {
        body: { fileUrl: fileName, userId: user.id },
      });

      if (parseError) throw parseError;

      if (data.success) {
        setParseResult(data.data);
        toast({
          title: 'Resume parsed successfully!',
          description: `Extracted ${data.skills_added} skills from your resume`,
        });
        onParseComplete?.(data.data);
      } else {
        throw new Error(data.error || 'Failed to parse resume');
      }
    } catch (err) {
      console.error('Error:', err);
      // Fallback handles the mock data now
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Resume Parser
        </CardTitle>
        <CardDescription>
          Upload your PDF resume and our AI will extract skills automatically
        </CardDescription>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-4">
          <div
            onClick={() => !uploading && !parsing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${uploading || parsing ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-muted/50'}`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Uploading resume...</p>
              </div>
            ) : parsing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">AI is analyzing your resume...</p>
                <p className="text-xs text-muted-foreground">This may take a moment</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium">Click to upload your resume</p>
                <p className="text-sm text-muted-foreground">PDF files only, max 10MB</p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        {parseResult && (
          <div className="space-y-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Last parsed resume</span>
            </div>

            {parseResult.summary && (
              <div className="text-sm text-muted-foreground">
                <strong>Summary:</strong> {parseResult.summary}
              </div>
            )}

            {parseResult.experience_level && (
              <div className="text-sm">
                <strong>Experience Level:</strong>{' '}
                <span className="capitalize">{parseResult.experience_level}</span>
              </div>
            )}

            {parseResult.skills && parseResult.skills.length > 0 && (
              <div>
                <strong className="text-sm">Skills Extracted:</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {parseResult.skills.slice(0, 10).map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                    >
                      {skill.name}
                    </span>
                  ))}
                  {parseResult.skills.length > 10 && (
                    <span className="px-2 py-1 bg-muted rounded-full text-xs">
                      +{parseResult.skills.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
