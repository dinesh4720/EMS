import { useRef, useState } from "react";
import { Button, Chip, Tooltip } from "@heroui/react";
import { FileText, Upload, FolderPlus, AlertTriangle, Eye, Download, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { uploadApi } from "../../../services/api";

const getAuthToken = () => {
  const storedUser = sessionStorage.getItem('app_user');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      return userData.token;
    } catch (err) {
      console.error('Failed to parse user data:', err);
      return null;
    }
  }
  return null;
};

export default function StudentDocuments({
  studentId,
  documents,
  activeUploads,
  onDocumentsChange,
  onActiveUploadsChange
}) {
  const documentInputRef = useRef(null);

  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files && files.length > 0) {

      // Initialize uploads state
      const newUploads = files.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'pending' // pending, uploading, completed, error
      }));

      onActiveUploadsChange(prev => [...prev, ...newUploads]);

      try {
        let successCount = 0;
        let failCount = 0;

        // Upload each file
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const uploadId = newUploads[i].id;

          // Update Status to Uploading
          onActiveUploadsChange(prev => prev.map(u =>
            u.id === uploadId ? { ...u, status: 'uploading', progress: 5 } : u
          ));

          // Simulate progress for UX
          const progressInterval = setInterval(() => {
            onActiveUploadsChange(prev => prev.map(u =>
              u.id === uploadId && u.progress < 90 ? { ...u, progress: u.progress + 10 } : u
            ));
          }, 200);

          try {
            // Upload to backend/Cloudinary
            const response = await uploadApi.uploadFile(file);

            clearInterval(progressInterval);

            // Format file size
            const formatFileSize = (bytes) => {
              if (bytes < 1024) return bytes + ' B';
              if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
              return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
            };

            // Construct new doc object
            const newDoc = {
              name: file.name,
              type: file.type,
              url: response.url,
              size: formatFileSize(file.size),
              uploadDate: new Date().toISOString()
            };

            // Use dedicated document endpoint to append to array
            const token = getAuthToken();
            const headers = {
              'Content-Type': 'application/json',
            };
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            const response2 = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${studentId}/documents`, {
              method: 'POST',
              headers,
              body: JSON.stringify(newDoc)
            });

            if (!response2.ok) {
              const error = await response2.json();
              throw new Error(error.error || 'Failed to save document');
            }

            const result = await response2.json();
            console.log('📄 Document saved to backend, received:', result);
            console.log('📄 All documents from server:', result.documents);

            // Update local state with all documents from server
            onDocumentsChange(result.documents || []);
            console.log('📄 Local state updated with', result.documents?.length || 0, 'documents');

            // Mark completed
            onActiveUploadsChange(prev => prev.map(u =>
              u.id === uploadId ? { ...u, status: 'completed', progress: 100 } : u
            ));

            successCount++;
          } catch (error) {
            clearInterval(progressInterval);
            console.error(`Upload error for ${file.name}:`, error);
            // Mark error
            onActiveUploadsChange(prev => prev.map(u =>
              u.id === uploadId ? { ...u, status: 'error', progress: 0 } : u
            ));
            failCount++;
          }
        }

        // Auto-close after a few seconds if all success
        if (failCount === 0) {
          setTimeout(() => {
            onActiveUploads([]); // Clear uploads
            toast.success("All documents uploaded successfully");
          }, 3000);
        } else {
          toast.error(`Uploaded ${successCount}, Failed ${failCount}`);
        }

      } catch (error) {
        console.error("Batch upload error:", error);
        toast.error("Upload failed");
      } finally {
        e.target.value = null; // Reset input
      }
    }
  };

  const handleDeleteDocument = async (docId) => {
    console.log('🗑️ Attempting to delete document:', docId);
    console.log('🗑️ Current documents:', documents);

    // Find the index of the document to delete
    // Handle both doc.id and fallback doc-{index} format
    let docIndex = documents.findIndex(d => d.id === docId);

    console.log('🗑️ Found document at index:', docIndex);

    // If not found by id, try to extract index from doc-{index} format
    if (docIndex === -1 && docId.startsWith('doc-')) {
      docIndex = parseInt(docId.replace('doc-', ''));
      console.log('🗑️ Using fallback index:', docIndex);
    }

    if (docIndex === -1 || docIndex >= documents.length) {
      console.error('🗑️ Document not found or invalid index');
      toast.error("Document not found");
      return;
    }

    const loadingToast = toast.loading("Deleting document...");

    try {
      const deleteUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${studentId}/documents/${docIndex}`;
      console.log('🗑️ DELETE request to:', deleteUrl);

      const token = getAuthToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Call the backend DELETE endpoint with the document index
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers
      });

      console.log('🗑️ DELETE response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('🗑️ DELETE error response:', error);
        throw new Error(error.error || 'Failed to delete document');
      }

      const result = await response.json();
      console.log('🗑️ DELETE success, remaining documents:', result.documents?.length);

      // Update local state with the documents array from server
      onDocumentsChange(result.documents || []);
      toast.success("Document deleted successfully", { id: loadingToast });
    } catch (error) {
      console.error("🗑️ Delete error:", error);
      toast.error("Failed to delete document: " + (error.message || "Unknown error"), { id: loadingToast });
    }
  };

  const handleCleanupCorruptedDocuments = async () => {
    console.log('🔧 Current documents before fix:', documents);
    const loadingToast = toast.loading("Fixing documents...");

    try {
      const token = getAuthToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Call the fix-documents endpoint which removes corrupted docs and adds IDs
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/students/${studentId}/fix-documents`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fix documents');
      }

      const result = await response.json();
      console.log('✅ Fixed documents from server:', result.documents);

      // Update local state with fixed documents
      onDocumentsChange(result.documents || []);
      toast.success("Documents fixed successfully", { id: loadingToast });
    } catch (error) {
      console.error("Fix error:", error);
      toast.error("Failed to fix documents: " + (error.message || "Unknown error"), { id: loadingToast });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Documents Section */}
      <input
        type="file"
        ref={documentInputRef}
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={handleDocumentUpload}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{documents.length} documents</span>
        </div>
        <div className="flex gap-2">
          {documents.some(doc => !doc.url || !doc.name || !doc.id) && (
            <Button
              size="sm"
              color="warning"
              variant="flat"
              startContent={<AlertTriangle size={16} />}
              onPress={handleCleanupCorruptedDocuments}
            >
              Fix Documents
            </Button>
          )}
          <Button size="sm" color="primary" startContent={<Upload size={16} />} onPress={() => documentInputRef.current?.click()}>Upload Document</Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group" onClick={() => documentInputRef.current?.click()}>
          <div className="inline-flex p-4 bg-white rounded-full mb-4 ring-1 ring-gray-200 shadow-sm group-hover:scale-110 transition-transform">
            <FolderPlus size={32} className="text-gray-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">No documents uploaded yet</h4>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">Upload birth certificate, transfer certificate, or other essential documents.</p>
          <Button className="mt-4" size="sm" variant="bordered" onPress={() => documentInputRef.current?.click()}>Browse Files</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, index) => {
            // Check if document has valid data
            const isFrontBack = doc.front && doc.back;
            const isCorrupted = !doc.url && !isFrontBack;
            const docId = doc.id || `doc-${index}`;

            return (
              <div key={docId} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${isCorrupted ? 'border-red-200 bg-red-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isCorrupted ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                    {isCorrupted ? <AlertTriangle size={20} /> : <FileText size={20} />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isCorrupted ? 'text-red-700' : 'text-gray-900'}`}>
                      {doc.name || 'Corrupted Document'}
                      {isFrontBack && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Front & Back</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isCorrupted ? 'Invalid file - please delete' : `${doc.date || 'Unknown date'} • ${doc.size || 'Unknown size'}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* View buttons for front/back documents */}
                  {isFrontBack ? (
                    <>
                      <Tooltip content="View front">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            console.log('👁️ Opening front document:', doc.front.url);
                            window.open(doc.front.url, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <Eye size={16} className="text-gray-500" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="View back">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            console.log('👁️ Opening back document:', doc.back.url);
                            window.open(doc.back.url, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <Eye size={16} className="text-gray-500" />
                        </Button>
                      </Tooltip>
                    </>
                  ) : !isCorrupted && doc.url && (
                    <>
                      <Tooltip content="View document">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            console.log('👁️ Opening document:', doc.url);

                            // Check if it's a data URL (base64)
                            if (doc.url.startsWith('data:')) {
                              // Convert data URL to Blob and create object URL
                              fetch(doc.url)
                                .then(res => res.blob())
                                .then(blob => {
                                  const objectUrl = URL.createObjectURL(blob);
                                  window.open(objectUrl, '_blank', 'noopener,noreferrer');
                                  // Clean up after a delay
                                  setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
                                })
                                .catch(err => {
                                  console.error('Error opening document:', err);
                                  toast.error('Failed to open document');
                                });
                            } else {
                              // For Cloudinary URLs, add fl_attachment flag for PDFs to force download/view
                              let viewUrl = doc.url;
                              if (doc.url.includes('cloudinary.com') && doc.name?.toLowerCase().endsWith('.pdf')) {
                                // Insert fl_attachment:false to force inline viewing
                                viewUrl = doc.url.replace('/upload/', '/upload/fl_attachment:false/');
                              }
                              window.open(viewUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                        >
                          <Eye size={16} className="text-gray-500" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Download document">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          as="a"
                          href={doc.url}
                          download={doc.name}
                          target="_blank"
                        >
                          <Download size={16} className="text-gray-500" />
                        </Button>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip content="Delete document">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => handleDeleteDocument(docId)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
