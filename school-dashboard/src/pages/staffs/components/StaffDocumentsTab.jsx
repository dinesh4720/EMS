/**
 * StaffDocumentsTab - Minimal gray styling matching StudentDashboard
 */
import { Upload, FileText, Eye, Download, Share2, Trash2, FolderPlus, FileCheck } from "lucide-react";
import { Button, Progress } from "@heroui/react";
import toast from "react-hot-toast";

export default function StaffDocumentsTab({
  documents,
  activeUploads,
  documentInputRef,
  onDocumentUpload,
  onDeleteDocument
}) {
  const getDocumentType = (doc) => {
    if (doc.type?.includes('ID') || doc.type === 'ID Proof') return 'ID Proof';
    if (doc.type?.includes('Qualification') || doc.type === 'Qualification') return 'Qualification';
    return 'Custom';
  };

  return (
    <div className="space-y-5">
      <input
        type="file"
        ref={documentInputRef}
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={onDocumentUpload}
      />

      {/* Document Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Total Documents</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <FileCheck size={16} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">ID Proofs</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{documents.filter(d => getDocumentType(d) === 'ID Proof').length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Qualifications</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{documents.filter(d => getDocumentType(d) === 'Qualification').length}</p>
        </div>
      </div>

      {/* Active Uploads */}
      {activeUploads.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Upload size={16} className="text-gray-600" /></div>
              <div><h3 className="font-medium text-gray-900 text-sm">Uploading Files</h3><p className="text-xs text-gray-500">{activeUploads.length} file(s) in progress</p></div>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {activeUploads.map((upload) => (
              <div key={upload.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <FileText size={14} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">{upload.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{upload.progress}%</span>
                </div>
                <Progress
                  aria-label="Upload progress"
                  value={upload.progress}
                  className="h-1"
                  classNames={{ track: "bg-gray-200", indicator: "bg-gray-600" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Document Library</h3>
            <p className="text-xs text-gray-500 mt-0.5">All uploaded documents</p>
          </div>
          <Button size="sm" className="bg-gray-900 text-white" startContent={<Upload size={14} />} onPress={() => documentInputRef.current?.click()}>
            Upload
          </Button>
        </div>

        {documents.length === 0 ? (
          <div
            className="text-center py-12 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => documentInputRef.current?.click()}
          >
            <div className="inline-flex p-4 bg-gray-100 rounded-lg mb-4">
              <FolderPlus size={32} className="text-gray-400" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">No documents uploaded yet</h4>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-4">
              Upload certificates, ID proofs, or other essential documents.
            </p>
            <Button size="sm" variant="flat" className="bg-gray-100 text-gray-700" startContent={<Upload size={14} />} onPress={() => documentInputRef.current?.click()}>
              Browse Files
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {documents.map((doc) => {
              const docType = getDocumentType(doc);

              return (
                <div
                  key={doc._id || doc.name}
                  className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center">
                      <FileText size={14} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">{docType}</span>
                        <span className="text-xs text-gray-400">
                          {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'Just now'}
                          {doc.size && ` • ${doc.size}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => window.open(doc.url, '_blank')}
                      title="View"
                    >
                      <Eye size={14} className="text-gray-400" />
                    </button>
                    <a
                      href={doc.url}
                      download={doc.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Download"
                    >
                      <Download size={14} className="text-gray-400" />
                    </a>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => toast.success("Shared via internal messaging")}
                      title="Share"
                    >
                      <Share2 size={14} className="text-gray-400" />
                    </button>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => onDeleteDocument(doc._id || doc.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
