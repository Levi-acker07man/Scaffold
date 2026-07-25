"use client";

import { useState } from "react";

export default function StudyRoomPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

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
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-text">Study Room</h1>
        <p className="text-text-dim mt-1">Upload your documents and let's start learning.</p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full relative flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed transition-all ${
            isDragging
              ? "border-accent-base bg-accent-bg"
              : "border-clay-border bg-input-bg hover:bg-black/[0.02] hover:border-black/20"
          }`}
          style={{ minHeight: "300px" }}
        >
          {file ? (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent-bg flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-base)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text mb-1">{file.name}</h3>
              <p className="text-sm text-text-dim">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              
              <button
                onClick={() => setFile(null)}
                className="mt-6 px-4 py-2 rounded-xl text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
              >
                Remove File
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-base">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-text mb-2">
                Upload Document
              </h3>
              <p className="text-text-dim text-center mb-6 max-w-sm">
                Drag and drop your PDF, Word document, or text file here, or click to browse.
              </p>
              <label className="cta-button max-w-[200px] text-center cursor-pointer">
                <span>Browse Files</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileInput}
                  accept=".pdf,.doc,.docx,.txt"
                />
              </label>
            </>
          )}
        </div>
        
        {file && (
          <button className="cta-button mt-8 max-w-[300px]">
            Start Studying
          </button>
        )}
      </div>
    </div>
  );
}
