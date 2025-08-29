import React, { useState } from 'react';
import { Upload, File, X, FileText } from 'lucide-react';

const FileUpload = ({ onUpload, files }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (fileList) => {
    const newFiles = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const fileData = {
            id: Date.now() + i,
            name: file.name,
            content: e.target.result,
            size: file.size
          };
          
          const updatedFiles = [...files, fileData];
          onUpload(updatedFiles);
        };
        reader.readAsText(file);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (fileId) => {
    const updated = files.filter(f => f.id !== fileId);
    onUpload(updated);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Upload Documents</h2>
        
        <div
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            dragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <input
            type="file"
            multiple
            accept=".txt,.doc,.docx"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Upload Text Documents
          </h3>
          <p className="text-slate-600 mb-4">
            Drag and drop files here or click to browse
          </p>
          <p className="text-xs text-slate-500">
            Supports .txt, .doc, .docx files • Maximum 10MB per file
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Uploaded Files ({files.length})
          </h3>
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB • {file.content.split(' ').length} words
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors duration-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;