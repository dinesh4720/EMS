import { useState, useRef } from 'react';

export function useChatFileUpload() {
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);

  return {
    uploadingFile, setUploadingFile,
    uploadProgress, setUploadProgress,
    selectedFile, setSelectedFile,
    filePreview, setFilePreview,
    fileInputRef,
  };
}
