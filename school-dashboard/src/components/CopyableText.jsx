import { useState } from "react";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function CopyableText({ text, children, className = "" }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success("Copied to clipboard", { duration: 1500 });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy");
        }
    };

    return (
        <div className={`group/copy relative inline-flex items-center gap-1 ${className}`}>
            {children}
            <button
                onClick={handleCopy}
                className="opacity-0 group-hover/copy:opacity-100 transition-opacity p-1 hover:bg-default-200 rounded"
                title="Copy to clipboard"
            >
                {copied ? (
                    <Check size={12} className="text-success" />
                ) : (
                    <Copy size={12} className="text-default-400" />
                )}
            </button>
        </div>
    );
}
