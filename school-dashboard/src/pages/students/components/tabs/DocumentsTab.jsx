import StudentDocuments from "../StudentDocuments";

/**
 * DocumentsTab - Tab wrapper for StudentDocuments component
 */
export default function DocumentsTab({
  studentId,
  documents,
  activeUploads,
  onDocumentsChange,
  onActiveUploadsChange
}) {
  return (
    <div className="animate-fade-in">
      <StudentDocuments
        studentId={studentId}
        documents={documents}
        activeUploads={activeUploads}
        onDocumentsChange={onDocumentsChange}
        onActiveUploadsChange={onActiveUploadsChange}
      />
    </div>
  );
}
