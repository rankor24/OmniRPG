import React, { useState, useRef, useEffect } from 'react';
import { EyeIcon } from './icons';

interface FileUploadProps {
  label: string;
  onFileUpload: (base64: string) => void;
  currentImage: string;
  sfwMode: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, onFileUpload, currentImage, sfwMode }) => {
  const [preview, setPreview] = useState<string>(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Sync preview state with prop to avoid stale UI.
    // This is crucial if the parent component's state can be reset externally.
    if (currentImage !== preview) {
      setPreview(currentImage);
    }
    // We only want this effect to run when the prop `currentImage` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        onFileUpload(base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const isUrl = (str: string) => str.startsWith('http');

  return (
    <div className="flex items-center gap-4">
      {preview && (
        sfwMode ? (
          <div className="w-20 h-20 rounded-md bg-secondary flex items-center justify-center">
            <EyeIcon className="w-10 h-10 text-text-secondary" />
          </div>
        ) : (
          <img 
            src={isUrl(preview) ? preview : preview} 
            alt="Preview" 
            className="w-20 h-20 rounded-md object-cover bg-secondary"
          />
        )
      )}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/gif"
          className="block w-full text-sm text-text-secondary
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-accent file:text-primary
            hover:file:bg-accent-hover"
        />
      </div>
    </div>
  );
};

export default FileUpload;
