export default function CheckboxCell({ label, checked, indeterminate, onChange }) {
  return (
    <input
      type="checkbox"
      className="sg-tbl-checkbox"
      aria-label={label}
      checked={!!checked}
      onChange={(e) => onChange?.(e.target.checked)}
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate && !checked;
      }}
    />
  );
}
