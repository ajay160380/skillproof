import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { uploadResume } from '../services/resumeService';
import { Loader } from './Loader';

interface Props {
  onUploadSuccess: () => void;
}

export function ResumeUploader({ onUploadSuccess }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(file.type)) {
      toast.error('Only PDF and DOCX files are allowed.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be under 5MB.');
      return;
    }

    try {
      setIsUploading(true);
      await uploadResume(file);
      toast.success('Resume uploaded successfully!');
      onUploadSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload resume.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
        isDragging
          ? 'border-verification bg-verification/5 shadow-[0_0_30px_rgba(11,110,79,0.15)] scale-[1.02]'
          : 'border-white/50 bg-white/40 backdrop-blur-md hover:bg-white/60 hover:border-verification/40 hover:shadow-lg'
      }`}
    >
      <input
        type="file"
        id="resume-upload"
        className="hidden"
        accept=".pdf,.docx"
        onChange={handleChange}
        disabled={isUploading}
      />
      
      <div className="flex flex-col items-center gap-3">
        {isUploading ? (
          <Loader text="Uploading & Analyzing..." size="sm" />
        ) : (
          <>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 bg-white/60 shadow-sm border border-white`}>
              <span className="text-2xl">📄</span>
            </div>
            
            <div>
              <h3 className="font-serif text-lg text-ink font-bold mb-1">
                Upload your resume
              </h3>
          <p className="font-mono text-[10px] text-data uppercase tracking-wider mb-4">
            PDF or DOCX • Max 5MB
          </p>
        </div>

        <label
          htmlFor="resume-upload"
          className={`px-6 py-2 rounded-lg font-mono text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer shadow-sm ${
            isUploading
              ? 'bg-structure/20 text-data pointer-events-none'
              : 'bg-ink text-white hover:bg-ink/80 hover:shadow-lg hover:-translate-y-0.5'
          }`}
        >
          Browse Files
        </label>
        {!isUploading && (
          <p className="font-mono text-[10px] text-data uppercase tracking-wider mt-2">
            or drag and drop here
          </p>
        )}
        {isUploading ? null : null} 
      </>
      )}
      </div>
    </div>
  );
}
