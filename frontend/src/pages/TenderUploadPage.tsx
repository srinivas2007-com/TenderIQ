import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { LoadingSteps } from '../components/common/LoadingSteps';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export const TenderUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [processStatus, setProcessStatus] = useState<string>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const validateFile = (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please upload a valid PDF tender document.');
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 50MB limit.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (fileToUpload: File) => {
    setUploading(true);
    setErrorMessage(null);
    setProcessStatus('uploading');
    setCurrentStep(1);

    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      // Step interval simulation synchronized with server processing
      const stepTimer1 = setTimeout(() => { setCurrentStep(2); setProcessStatus('extracting'); }, 1200);
      const stepTimer2 = setTimeout(() => { setCurrentStep(3); setProcessStatus('analyzing'); }, 2800);
      const stepTimer3 = setTimeout(() => { setCurrentStep(4); setProcessStatus('comparing'); }, 4200);

      const result = await api.uploadTender(formData);

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      setCurrentStep(5);
      setProcessStatus('completed');

      setTimeout(() => {
        navigate(`/tenders/${result.id}`);
      }, 900);
    } catch (err: any) {
      setProcessStatus('failed');
      setErrorMessage(err.message || 'Unable to process the tender document.');
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Upload Tender Document</h2>
        <p className="text-xs text-slate-500">
          Upload any Indian government tender, GeM bid, or PWD RFP document to execute automated eligibility matching
        </p>
      </div>

      {uploading ? (
        <LoadingSteps
          currentStep={currentStep}
          status={processStatus}
          errorMessage={errorMessage || undefined}
        />
      ) : (
        <div className="space-y-6">
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Upload or Processing Notice</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-brand-600 bg-brand-50/50'
                : 'border-slate-300 hover:border-slate-400 bg-white'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mx-auto mb-4">
              <UploadCloud className="w-7 h-7 text-brand-600" />
            </div>

            <h3 className="text-sm font-bold text-slate-900">
              {selectedFile ? selectedFile.name : 'Choose a tender PDF file or drag and drop here'}
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              Supports standard text-based and scanned PDFs up to 50MB
            </p>

            {selectedFile && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded text-xs text-slate-700 font-medium">
                <FileText className="w-4 h-4 text-brand-600" />
                <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}
          </div>

          {/* Action button */}
          {selectedFile && (
            <div className="flex justify-end">
              <button
                onClick={() => handleSubmit(selectedFile)}
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-6 py-3 rounded shadow-sm transition-colors"
              >
                Start Bid Analysis
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
