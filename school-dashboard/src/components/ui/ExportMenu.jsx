import { memo, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Download, FileText, FileSpreadsheet, FileType2, Printer } from "lucide-react";
import DropdownMenu from "./DropdownMenu";
import Button from "./Button";
import toast from "./toast";
import { escapeHtml } from "../../utils/sanitize";

/**
 * ExportMenu — REVAMP-106 standard export dropdown.
 *
 * Wraps DropdownMenu with consistent CSV / Excel / PDF / Print options.
 * Caller passes already-filtered rows and a column descriptor; the menu
 * handles file generation, progress toast, safe escaping, and downloads.
 *
 * Column shape: { key, label, accessor?(row), format?(value, row) }
 * - `accessor(row)` overrides the value lookup when omitted, uses row[key]
 * - `format(value, row)` runs after accessor and should return a primitive
 *
 * For server-driven exports (large datasets), override the action via
 * `onExport({ format, rows, columns, filename })`. The handler is awaited
 * and wrapped in `toast.promise` automatically.
 */

const DATE_FNS = () => new Date().toISOString().slice(0, 10);

/** Filename: `base-YYYY-MM-DD.ext` with `tabular-nums` rendering when shown. */
export function formatExportFilename(base, ext) {
  const safe = String(base || "export").replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `${safe}-${DATE_FNS()}.${ext}`;
}

/**
 * Sanitize a CSV cell to prevent CSV formula injection in spreadsheet apps.
 * Values starting with =, +, -, @, \t, or \r get a leading single-quote.
 * Double quotes are escaped per RFC 4180.
 */
export function sanitizeCsvCell(value) {
  const str = value === null || value === undefined ? "" : String(value);
  const guarded = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${guarded.replace(/"/g, '""')}"`;
}

function readCell(row, col) {
  const raw = col.accessor ? col.accessor(row) : row?.[col.key];
  return col.format ? col.format(raw, row) : raw;
}

export function buildCsv(rows, columns) {
  const header = columns.map((c) => sanitizeCsvCell(c.label ?? c.key)).join(",");
  const body = rows
    .map((row) => columns.map((c) => sanitizeCsvCell(readCell(row, c))).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

/** UTF-8 BOM so Excel opens non-ASCII characters correctly. */
const UTF8_BOM = "\uFEFF";

/**
 * Build a self-contained HTML document for Print / PDF / Excel.
 * Uses safe HTML escaping on every cell. Web-safe font stack is embedded
 * so the print window renders consistently even when the host page styles
 * are not inherited (PDF font embedding bug-fix).
 */
function buildHtmlDocument({ title, rows, columns, mode }) {
  const head = columns
    .map((c) => `<th>${escapeHtml(c.label ?? c.key)}</th>`)
    .join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${columns
          .map((c) => `<td>${escapeHtml(readCell(row, c) ?? "")}</td>`)
          .join("")}</tr>`
    )
    .join("");

  const generated = new Date().toLocaleString();
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  html,body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif; color:#111827; margin:0; padding:24px; }
  h1 { font-size: 18px; font-weight: 600; margin: 0 0 4px; }
  .meta { font-size: 11px; color:#6b7280; margin-bottom: 16px; font-variant-numeric: tabular-nums; }
  table { width:100%; border-collapse: collapse; font-size: 12px; }
  thead th { background:#f3f4f6; text-align:left; padding:8px 10px; border:1px solid #e5e7eb; font-weight:600; color:#374151; }
  tbody td { padding:8px 10px; border:1px solid #e5e7eb; vertical-align: top; }
  tbody tr:nth-child(even) td { background:#fafafa; }
  @media print { body { padding: 0; } .no-print { display:none; } }
</style>
</head><body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">Generated ${escapeHtml(generated)} · ${rows.length} record${
    rows.length === 1 ? "" : "s"
  }</p>
  <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
  ${
    mode === "print" || mode === "pdf"
      ? '<script>window.addEventListener("load",()=>setTimeout(()=>window.print(),250));</script>'
      : ""
  }
</body></html>`;
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke after the click microtask so Safari completes the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function openWindow(html, { fallbackError }) {
  const win = window.open("", "_blank", "noopener,width=1024,height=768");
  if (!win) {
    toast.error(fallbackError || "Pop-up blocked. Allow pop-ups to continue.");
    return null;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  return win;
}

const DEFAULT_FORMATS = ["csv", "excel", "pdf", "print"];
const ICONS = {
  csv: <FileText size={16} aria-hidden />,
  excel: <FileSpreadsheet size={16} aria-hidden />,
  pdf: <FileType2 size={16} aria-hidden />,
  print: <Printer size={16} aria-hidden />,
};
const LABELS = {
  csv: "Export CSV",
  excel: "Export Excel",
  pdf: "Export PDF",
  print: "Print",
};
const TOAST_LABELS = {
  csv: "CSV",
  excel: "Excel",
  pdf: "PDF",
  print: "Print preview",
};

async function runBuiltInExport({ format, rows, columns, filename, title }) {
  if (!rows.length) throw new Error("Nothing to export");
  if (format === "csv") {
    const csv = buildCsv(rows, columns);
    triggerBlobDownload(
      new Blob([UTF8_BOM + csv], { type: "text/csv;charset=utf-8" }),
      formatExportFilename(filename, "csv")
    );
    return;
  }
  if (format === "excel") {
    const html = buildHtmlDocument({ title, rows, columns, mode: "excel" });
    triggerBlobDownload(
      new Blob([html], {
        type: "application/vnd.ms-excel;charset=utf-8",
      }),
      formatExportFilename(filename, "xls")
    );
    return;
  }
  // pdf + print share the same template; only the toast wording differs.
  const html = buildHtmlDocument({
    title,
    rows,
    columns,
    mode: format === "pdf" ? "pdf" : "print",
  });
  const win = openWindow(html, {
    fallbackError: "Pop-up blocked. Allow pop-ups to print/export.",
  });
  if (!win) throw new Error("Pop-up blocked");
}

const ExportMenu = memo(function ExportMenu({
  rows = [],
  columns = [],
  filename = "export",
  title,
  formats = DEFAULT_FORMATS,
  onExport,
  trigger,
  disabled,
  buttonLabel = "Export",
  size = "sm",
  ariaLabel = "Export options",
  placement = "bottom-end",
}) {
  const resolvedTitle = title || filename || "Export";
  const isEmpty = !rows.length && !onExport;

  const handle = useCallback(
    async (format) => {
      const task = onExport
        ? Promise.resolve(
            onExport({
              format,
              rows,
              columns,
              filename: formatExportFilename(filename, format === "excel" ? "xls" : format),
            })
          )
        : runBuiltInExport({
            format,
            rows,
            columns,
            filename,
            title: resolvedTitle,
          });

      toast.promise(task, {
        loading: `Preparing ${TOAST_LABELS[format] || format}…`,
        success:
          format === "print"
            ? "Print preview opened"
            : `${TOAST_LABELS[format] || format} ready`,
        error: (err) => err?.message || `Failed to export ${format}`,
      });

      try {
        await task;
      } catch {
        /* error already surfaced via toast.promise */
      }
    },
    [columns, filename, onExport, resolvedTitle, rows]
  );

  const items = useMemo(
    () =>
      formats
        .filter((f) => DEFAULT_FORMATS.includes(f))
        .map((f) => ({
          key: f,
          label: LABELS[f],
          icon: ICONS[f],
          isDisabled: isEmpty,
          onClick: () => handle(f),
        })),
    [formats, handle, isEmpty]
  );

  const triggerNode = trigger || (
    <Button
      variant="outline"
      size={size}
      icon={<Download size={16} aria-hidden />}
      disabled={disabled || isEmpty}
      aria-label={ariaLabel}
    >
      {buttonLabel}
    </Button>
  );

  return (
    <DropdownMenu
      ariaLabel={ariaLabel}
      placement={placement}
      isDisabled={disabled || isEmpty}
      trigger={triggerNode}
      items={items}
    />
  );
});

ExportMenu.displayName = "ExportMenu";

ExportMenu.propTypes = {
  rows: PropTypes.array,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.string,
      accessor: PropTypes.func,
      format: PropTypes.func,
    })
  ),
  filename: PropTypes.string,
  title: PropTypes.string,
  formats: PropTypes.arrayOf(PropTypes.oneOf(DEFAULT_FORMATS)),
  onExport: PropTypes.func,
  trigger: PropTypes.node,
  disabled: PropTypes.bool,
  buttonLabel: PropTypes.node,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  ariaLabel: PropTypes.string,
  placement: PropTypes.string,
};

export default ExportMenu;
