import React, { useCallback, useState, useRef } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { FileData } from '../types';

interface FileUploadProps {
  onFilesUpload: (files: FileData[]) => void;
  isAnalyzing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUpload, isAnalyzing }) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = {
    'text/plain': ['.txt'],
    'text/markdown': ['.md'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  };

  const validateFile = (file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const validExtensions = Object.values(acceptedTypes).flat();
    
    if (!validExtensions.includes(extension)) {
      return `Invalid file type. Accepted: ${validExtensions.join(', ')}`;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return 'File size must be less than 10MB';
    }
    
    return null;
  };

  const processFile = (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          content,
          type: file.type || 'text/plain',
          size: file.size,
          uploadedAt: new Date()
        });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFiles = useCallback(async (fileList: FileList) => {
    setError(null);
    const newFiles: FileData[] = [];
    const errors: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
        continue;
      }

      try {
        const fileData = await processFile(file);
        newFiles.push(fileData);
      } catch (err) {
        errors.push(`${file.name}: Failed to process file`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesUpload(updatedFiles);
    }
  }, [files, onFilesUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (isAnalyzing) return;
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [handleFiles, isAnalyzing]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = useCallback((fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesUpload(updatedFiles);
    setError(null); // Clear any existing errors when removing files
  }, [files, onFilesUpload]);

  const clearAllFiles = useCallback(() => {
    // Clear all state
    setFiles([]);
    setError(null);
    setDragActive(false);
    
    // Reset file input completely
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.files = null;
    }
    
    // Clear all file inputs on the page
    const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    fileInputs.forEach(input => {
      input.value = '';
      input.files = null;
    });
    
    // Notify parent component
    onFilesUpload([]);
    
    // Force re-render by updating a dummy state
    setTimeout(() => {
      setDragActive(false);
    }, 0);
  }, [onFilesUpload]);

  // Expose clearAllFiles function to parent component
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    clearAllFiles
  }));

  // Handle clear files from parent
  React.useEffect(() => {
    const handleClearFiles = () => {
      clearAllFiles();
    };

    // Listen for custom clear event
    window.addEventListener('clearFiles', handleClearFiles);
    
    return () => {
      window.removeEventListener('clearFiles', handleClearFiles);
    };
  }, [clearAllFiles]);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          if (!isAnalyzing) setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400'
        } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={Object.keys(acceptedTypes).join(',')}
          onChange={handleFileInput}
          disabled={isAnalyzing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
            <Upload className={`w-8 h-8 ${dragActive ? 'text-blue-500' : 'text-slate-400'}`} />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {dragActive ? 'Drop files here' : 'Upload files for analysis'}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Drag and drop files or click to browse
            </p>
            
            <div className="text-xs text-slate-500">
              <p>Supported formats: {Object.values(acceptedTypes).flat().join(', ')}</p>
              <p>Maximum file size: 10MB per file</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-red-800">Upload Errors</h4>
            <pre className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{error}</pre>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-slate-900">
            Uploaded Files ({files.length})
          </h3>
          
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <File className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB • {file.uploadedAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeFile(file.id)}
                  disabled={isAnalyzing}
                  className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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