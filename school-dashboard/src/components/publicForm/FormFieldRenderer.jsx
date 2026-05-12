import { Input, Textarea, Select, Checkbox } from '../ui';

export default function FormFieldRenderer({ field, value, error, onChange, t }) {
  const handle = (next) => onChange(field.id, next);
  const placeholder = field.placeholder || `Enter ${field.label.toLowerCase()}`;

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <Input
          label={field.label}
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => handle(e.target.value)}
          required={field.required}
          error={error}
          description={field.description}
          type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
        />
      );

    case 'number':
      return (
        <Input
          label={field.label}
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => handle(e.target.value)}
          required={field.required}
          error={error}
          description={field.description}
          type="number"
        />
      );

    case 'date':
      return (
        <Input
          label={field.label}
          value={value || ''}
          onChange={(e) => handle(e.target.value)}
          required={field.required}
          error={error}
          description={field.description}
          type="date"
        />
      );

    case 'textarea':
      return (
        <Textarea
          label={field.label}
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => handle(e.target.value)}
          required={field.required}
          error={error}
          description={field.description}
          rows={3}
        />
      );

    case 'dropdown':
    case 'select': {
      const options = (field.options || []).map((option) => {
        const optValue = typeof option === 'string' ? option : option.value;
        const optLabel = typeof option === 'string' ? option : option.label;
        return { value: optValue, label: optLabel };
      });
      return (
        <Select
          label={field.label}
          value={value || ''}
          onChange={(e) => handle(e.target.value)}
          required={field.required}
          error={error}
          description={field.description}
          placeholder={t('pages.selectAnOption') || 'Select an option'}
          options={options}
        />
      );
    }

    case 'checkbox':
      return (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
          <Checkbox
            label={field.label}
            description={field.description}
            checked={!!value}
            onChange={(e) => handle(e.target.checked)}
            required={field.required}
            error={error}
          />
        </div>
      );

    default:
      return null;
  }
}
