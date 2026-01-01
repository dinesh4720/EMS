import { Card, CardBody, Progress, Button } from "@heroui/react";
import { FileText, X, CheckCircle, RefreshCcw, Trash2 } from "lucide-react";

const FileUploadItem = ({ file, onRemove, onChange }) => {
    const isCompleted = file.progress === 100;

    // Calculate size string
    const sizeString = `${(file.size * (file.progress / 100)).toFixed(1)} MB of ${file.size} MB`;

    return (
        <Card className="w-full max-w-md shadow-sm border border-default-200 mb-3 bg-white">
            <CardBody className="p-4">
                <div className="flex gap-4 items-start">
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                        <div className="w-10 h-12 bg-default-100 rounded-lg flex items-center justify-center border border-default-200">
                            {/* Simplified PDF/File Icon */}
                            <div className="relative">
                                <FileText className="text-default-500" size={24} />
                                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded">PDF</div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-default-900 truncate pr-2">{file.name}</span>
                            <span className={`text-sm font-medium ${isCompleted ? 'text-success-500' : 'text-default-500'}`}>
                                {isCompleted ? (
                                    <div className="flex items-center gap-1">
                                        <CheckCircle size={14} className="text-success-500" />
                                        <span>Completed</span>
                                    </div>
                                ) : (
                                    `${file.progress}%`
                                )}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2">
                            <Progress
                                aria-label="Upload progress"
                                value={file.progress}
                                className="max-w-full"
                                size="sm"
                                color={isCompleted ? "success" : "danger"} // Red for progress (based on image), Green for success
                                classNames={{
                                    indicator: isCompleted ? "bg-success-500" : "bg-red-500",
                                    track: "bg-default-100"
                                }}
                            />
                        </div>

                        {/* Footer / Status */}
                        <div className="flex justify-between items-center mt-2">
                            {!isCompleted ? (
                                <span className="text-xs text-default-500">{sizeString}</span>
                            ) : (
                                <div className="flex-grow">
                                    <span className="text-xs text-default-500">{file.size} MB of {file.size} MB</span>
                                </div>
                            )}

                            {isCompleted && (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        className="h-7 min-w-16 bg-default-100 text-default-600 font-medium"
                                        onPress={() => onChange && onChange(file.id)}
                                    >
                                        Change
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="danger"
                                        className="h-7 min-w-16 bg-red-50 text-red-500 font-medium"
                                        onPress={() => onRemove && onRemove(file.id)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export const FileUploadContainer = ({ uploads = [], onRemove, onChange, className }) => {
    if (!uploads.length) return null;

    return (
        <div className={`fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-md animate-slide-in-top ${className}`}>
            {uploads.map((upload) => (
                <FileUploadItem key={upload.id} file={upload} onRemove={onRemove} onChange={onChange} />
            ))}
        </div>
    );
};

export const UnifiedUploadProgress = ({ uploads = [], onClose }) => {
    if (!uploads.length) return null;

    const total = uploads.length;
    const completed = uploads.filter(u => u.status === 'completed').length;
    const current = uploads.find(u => u.status === 'uploading') || uploads[uploads.length - 1]; // Fallback to last file for display if all done
    const isAllCompleted = completed === total && total > 0;

    // Calculate overall overall progress
    // If specific per-file progress is available (0-100), we average it.
    // (Completed Files * 100 + Current File Progress) / Total Files
    let overallProgress = (completed / total) * 100;

    if (current && current.status === 'uploading') {
        // contribution of current file
        overallProgress += (current.progress / total);
    }

    // Cap at 100
    overallProgress = Math.min(overallProgress, 100);

    return (
        <div className="fixed top-6 right-6 z-[9999] w-full max-w-sm animate-slide-in-top">
            <Card className="shadow-xl border border-default-100 bg-white/90 backdrop-blur-md dark:bg-zinc-900/90">
                <CardBody className="p-4">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-3 items-center">
                            <div className={`p-2 rounded-full ${isAllCompleted ? 'bg-success-100 text-success-600' : 'bg-primary-100 text-primary-600'}`}>
                                {isAllCompleted ? <CheckCircle size={18} /> : <FileText size={18} />}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm text-default-900">
                                    {isAllCompleted ? "Uploads Completed" : `Uploading ${Math.min(completed + 1, total)} of ${total} files`}
                                </span>
                                <span className="text-xs text-default-500 truncate max-w-[180px]">
                                    {current ? current.name : "Preparing..."}
                                </span>
                            </div>
                        </div>
                        {isAllCompleted && (
                            <Button isIconOnly size="sm" variant="light" onPress={onClose} className="-mr-2 -mt-2">
                                <X size={16} />
                            </Button>
                        )}
                    </div>

                    <Progress
                        aria-label="Upload progress"
                        value={overallProgress}
                        size="sm"
                        radius="full"
                        color={isAllCompleted ? "success" : "primary"}
                        classNames={{
                            indicator: isAllCompleted ? "bg-success-500" : "bg-primary-500",
                            track: "bg-default-100"
                        }}
                    />

                    <div className="flex justify-between items-center mt-2 text-xs text-default-400">
                        <span>{Math.round(overallProgress)}%</span>
                        <span>{isAllCompleted ? "Done" : `${(overallProgress * (total / 100)).toFixed(1)}/${total}`}</span>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default FileUploadItem;
