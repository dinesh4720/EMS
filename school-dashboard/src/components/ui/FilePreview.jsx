import { useState, useEffect } from 'react';
import { FileText, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@heroui/react';

/**
 * FilePreview — renders a PDF inside an iframe with proper loading and error states.
 * Falls back to a descriptive error card (not a blank white box) when the URL is broken.
 */
export default function FilePreview({ url, fileName, className = '' }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

  useEffect(() => {
    if (!url) {
      setStatus('error');
      return;
    }

    setStatus('loading');

    // Validate URL with a HEAD request before handing it to the iframe.
    // This prevents the silent blank-white-box failure.
    const controller = new AbortController();
    fetch(url, { method: 'HEAD', signal: controller.signal })
      .then((res) => {
        if (res.ok) {
          setStatus('ready');
        } else {
          setStatus('error');
        }
      })
      .catch(() => {
        // Network error or aborted — show error state
        if (!controller.signal.aborted) {
          setStatus('error');
        }
      });

    return () => controller.abort();
  }, [url]);

  const isPdf =
    fileName?.toLowerCase().endsWith('.pdf') ||
    url?.toLowerCase().includes('.pdf') ||
    url?.toLowerCase().includes('application/pdf');

  if (status === 'loading') {
    return (
      <div className={`flex items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 ${className}`}>
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">Loading preview…</p>
        </div>
      </div>
    );
  }

  if (status === 'error' || !url) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 ${className}`}>
        <div className="flex flex-col items-center gap-3 p-8 text-center max-w-xs">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
            <AlertTriangle size={22} className="text-red-500 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1">
              Unable to load preview
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {fileName ? `"${fileName}" could not be loaded.` : 'The file URL is broken or unavailable.'}
            </p>
          </div>
          {url && (
            <Button
              size="sm"
              variant="flat"
              startContent={<ExternalLink size={14} />}
              onPress={() => window.open(url, '_blank', 'noopener,noreferrer')}
            >
              Open in new tab
            </Button>
          )}
        </div>
      </div>
    );
  }

  // status === 'ready'
  if (isPdf) {
    return (
      <div className={`relative rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800 ${className}`}>
        <iframe
          src={url}
          title={fileName || 'PDF Preview'}
          className="w-full h-full border-0"
          onError={() => setStatus('error')}
        />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-900/80 rounded-lg shadow-sm hover:bg-white dark:hover:bg-zinc-900 transition-colors"
          title="Open in new tab"
        >
          <ExternalLink size={14} className="text-gray-600 dark:text-zinc-400" />
        </a>
      </div>
    );
  }

  // Non-PDF file — show a card with open/download options
  return (
    <div className={`flex items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 ${className}`}>
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="w-14 h-14 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center shadow-sm">
          <FileText size={28} className="text-gray-500 dark:text-zinc-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1 truncate max-w-[200px]">
            {fileName || 'File'}
          </p>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Preview not available for this file type
          </p>
        </div>
        <Button
          size="sm"
          variant="flat"
          startContent={<ExternalLink size={14} />}
          onPress={() => window.open(url, '_blank', 'noopener,noreferrer')}
        >
          Open file
        </Button>
      </div>
    </div>
  );
}
