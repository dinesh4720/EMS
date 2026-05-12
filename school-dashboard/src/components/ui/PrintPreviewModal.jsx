import { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Printer, Download, RotateCw } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";

/*
 * PrintPreviewModal — REVAMP-105.
 *
 * Wraps any printable content in an off-screen iframe so users see an exact
 * A4 (or Letter / Legal) preview before sending to the printer. The iframe
 * approach guarantees the embedded print stylesheet is honoured exactly —
 * no host-document Tailwind utilities leak in, no browser chrome appears in
 * the preview, and `window.print()` is scoped to the iframe (no app sidebar
 * / topbar in the output).
 *
 * Stylesheets from the host document are cloned into the iframe head so
 * Tailwind classes used inside the printable component continue to work.
 *
 * ESC closes via the underlying Modal/ModalBase focus trap.
 */

const PAPER_SIZES_MM = {
  A4: { w: 210, h: 297 },
  Letter: { w: 215.9, h: 279.4 },
  Legal: { w: 215.9, h: 355.6 },
};

const PREVIEW_SCALE = 0.5;

export default function PrintPreviewModal({
  isOpen,
  onClose,
  title = "Print preview",
  children,
  defaultOrientation = "portrait",
  defaultPaperSize = "A4",
  documentTitle,
  onAfterPrint,
  onDownload,
}) {
  const iframeRef = useRef(null);
  const [iframeBody, setIframeBody] = useState(null);
  const [orientation, setOrientation] = useState(defaultOrientation);
  const [paperSize, setPaperSize] = useState(defaultPaperSize);

  const dims = PAPER_SIZES_MM[paperSize] || PAPER_SIZES_MM.A4;
  const pageW = orientation === "portrait" ? dims.w : dims.h;
  const pageH = orientation === "portrait" ? dims.h : dims.w;

  // Reset orientation/size when the modal opens so each invocation starts clean.
  useEffect(() => {
    if (isOpen) {
      setOrientation(defaultOrientation);
      setPaperSize(defaultPaperSize);
    } else {
      setIframeBody(null);
    }
  }, [isOpen, defaultOrientation, defaultPaperSize]);

  // Initialise / re-initialise iframe whenever it (re)mounts or page params change.
  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    const iframe = iframeRef.current;
    if (!iframe) return undefined;

    const init = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      // Reset the iframe document.
      doc.open();
      doc.write(
        `<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>`
      );
      doc.close();

      // Mirror host stylesheets so Tailwind utilities resolve inside the iframe.
      document
        .querySelectorAll('link[rel="stylesheet"], style')
        .forEach((node) => {
          try {
            doc.head.appendChild(node.cloneNode(true));
          } catch {
            /* cross-origin stylesheets cannot be cloned — skip silently */
          }
        });

      // @page rule + body sizing pin the preview to a single, exact sheet.
      const pageStyle = doc.createElement("style");
      pageStyle.textContent = `
        @page { size: ${paperSize} ${orientation}; margin: 0; }
        html, body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          color: #1a1a1a;
          width: ${pageW}mm;
          min-height: ${pageH}mm;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .ds-print-page {
          width: ${pageW}mm;
          min-height: ${pageH}mm;
          background: #ffffff;
          box-sizing: border-box;
        }
        @media print {
          html, body { width: ${pageW}mm; }
          .ds-print-page { page-break-after: auto; }
        }
      `;
      doc.head.appendChild(pageStyle);

      if (documentTitle) doc.title = documentTitle;

      setIframeBody(doc.body);
    };

    iframe.addEventListener("load", init);
    // srcDoc-less iframes are already 'complete' on first paint in modern
    // browsers — initialise immediately rather than wait for a load event
    // that may never fire.
    if (
      iframe.contentDocument &&
      iframe.contentDocument.readyState === "complete"
    ) {
      init();
    }
    return () => iframe.removeEventListener("load", init);
  }, [isOpen, paperSize, orientation, pageW, pageH, documentTitle]);

  const triggerIframePrint = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      if (onAfterPrint) onAfterPrint();
    } catch {
      /* swallow — browser print failures surface their own UI */
    }
  }, [onAfterPrint]);

  const handlePrint = useCallback(() => {
    triggerIframePrint();
  }, [triggerIframePrint]);

  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
      return;
    }
    // No bespoke PDF writer wired in — fall back to the browser's native
    // "Save as PDF" destination in the print dialog.
    triggerIframePrint();
  }, [onDownload, triggerIframePrint]);

  const toggleOrientation = useCallback(() => {
    setOrientation((cur) => (cur === "portrait" ? "landscape" : "portrait"));
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
      ariaLabel="Print preview"
      footer={
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            width: "100%",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCw size={14} />}
              onClick={toggleOrientation}
              aria-label="Toggle orientation"
            >
              {orientation === "portrait" ? "Portrait" : "Landscape"}
            </Button>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              aria-label="Paper size"
              style={{
                height: 32,
                padding: "0 10px",
                borderRadius: 8,
                border: "1px solid var(--color-border-strong)",
                background: "var(--color-bg-tertiary)",
                color: "var(--color-text-primary)",
                fontSize: 13,
              }}
            >
              {Object.keys(PAPER_SIZES_MM).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={14} />}
              onClick={handleDownload}
            >
              Download PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Printer size={14} />}
              onClick={handlePrint}
            >
              Print
            </Button>
          </div>
        </div>
      }
    >
      <div
        style={{
          background: "var(--color-bg-tertiary, #f3f4f6)",
          padding: 16,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          maxHeight: "70vh",
          overflow: "auto",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: `${pageW * PREVIEW_SCALE}mm`,
            height: `${pageH * PREVIEW_SCALE}mm`,
            position: "relative",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            background: "white",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <iframe
            ref={iframeRef}
            title="Print preview frame"
            // Sandbox keeps the cloned page isolated; allow-same-origin is
            // required so we can manipulate contentDocument from React, and
            // allow-modals is required for window.print() to open the dialog.
            sandbox="allow-same-origin allow-modals"
            style={{
              width: `${pageW}mm`,
              height: `${pageH}mm`,
              border: "0",
              transform: `scale(${PREVIEW_SCALE})`,
              transformOrigin: "top left",
              background: "white",
              display: "block",
            }}
          />
          {iframeBody &&
            createPortal(<div className="ds-print-page">{children}</div>, iframeBody)}
        </div>
      </div>
    </Modal>
  );
}

PrintPreviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  defaultOrientation: PropTypes.oneOf(["portrait", "landscape"]),
  defaultPaperSize: PropTypes.oneOf(["A4", "Letter", "Legal"]),
  documentTitle: PropTypes.string,
  onAfterPrint: PropTypes.func,
  onDownload: PropTypes.func,
};
