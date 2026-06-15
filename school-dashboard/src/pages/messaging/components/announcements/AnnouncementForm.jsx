import { useState, useEffect, useRef, useMemo } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import {
  Send,
  Clock,
  X,
  FileText,
  Bold,
  Italic,
  List,
  Link2,
  Paperclip,
} from 'lucide-react';
import { announcementsApi, uploadApi } from '../../../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import logger from '../../../../utils/logger';
import { announcementSchema } from '../../../../validators/formSchemas';
import useZodForm from '../../../../hooks/useZodForm';

const AUDIENCE_OPTIONS = [
  { key: 'all', label: 'Whole School' },
  { key: 'staff', label: 'Staff' },
  { key: 'students', label: 'Students' },
  { key: 'parents', label: 'Parents' },
];

const CHANNEL_OPTIONS = [
  { key: 'inapp', label: 'In-App' },
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
  { key: 'whatsapp', label: 'WhatsApp' },
];

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB ceiling for safety

const buildDefaults = (editData) => ({
  title: editData?.title || '',
  content: editData?.content || '',
  recipients: editData?.recipients?.length ? editData.recipients : [{ type: 'all' }],
  channels: editData?.channels?.length ? editData.channels : ['inapp'],
  scheduledFor: editData?.scheduledFor || null,
  attachments: editData?.attachments || [],
});

export default function AnnouncementForm({
  isOpen,
  onClose,
  onSave,
  editData = null,
}) {
  const { t } = useTranslation();
  const contentRef = useRef(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const defaultValues = useMemo(() => buildDefaults(editData), [editData]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    errors,
    onInvalid,
  } = useZodForm(announcementSchema, { defaultValues });
  // Local handler wraps onInvalid so it also surfaces a toast for the modal.
  const onInvalidWithToast = (formErrors) => {
    onInvalid(formErrors);
    const first = Object.values(formErrors)[0]?.message;
    if (first) toast.error(first);
  };

  useEffect(() => {
    if (isOpen) reset(buildDefaults(editData));
  }, [editData, isOpen, reset]);

  const wrapSelection = (before, after = before) => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const value = getValues('content') || '';
    const selected = value.slice(start, end) || 'text';
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    setValue('content', next, { shouldValidate: true, shouldDirty: true });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const insertAtCursor = (text) => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart ?? (getValues('content') || '').length;
    const value = getValues('content') || '';
    const prefix = start > 0 && value[start - 1] !== '\n' ? '\n' : '';
    const next = `${value.slice(0, start)}${prefix}${text}${value.slice(start)}`;
    setValue('content', next, { shouldValidate: true, shouldDirty: true });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error(`File exceeds ${Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))}MB limit`);
      return;
    }
    setUploadingFile(true);
    setUploadProgress(0);
    try {
      const response = await uploadApi.uploadFile(file);
      for (let i = 0; i <= 100; i += 25) {
        // light progress animation for UX
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 40));
        setUploadProgress(i);
      }
      const current = getValues('attachments') || [];
      setValue(
        'attachments',
        [
          ...current,
          { name: file.name, url: response.url, type: file.type, size: file.size },
        ],
        { shouldValidate: true, shouldDirty: true }
      );
      toast.success(t('toast.success.fileUploadedSuccessfully'));
    } catch (err) {
      logger.error('Error uploading file:', err);
      toast.error(t('toast.error.failedToUploadFile'));
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  const removeAttachment = (index) => {
    const current = getValues('attachments') || [];
    setValue(
      'attachments',
      current.filter((_, i) => i !== index),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  const handleClose = () => {
    reset(buildDefaults(editData));
    setUploadProgress(0);
    setUploadingFile(false);
    onClose();
  };

  const submitMode = async (mode, formValues) => {
    const isScheduled = mode === 'schedule' && Boolean(formValues.scheduledFor);
    const payload = {
      ...formValues,
      status: mode === 'send' ? 'sent' : isScheduled ? 'scheduled' : 'draft',
    };
    if (isScheduled) payload.scheduledFor = new Date(formValues.scheduledFor);

    if (mode === 'send') {
      let id = editData?._id;
      if (!id) {
        const created = await announcementsApi.create({ ...payload, status: 'sent' });
        id = created._id;
      }
      const result = await announcementsApi.send(id);
      if (result?.status === 'partial') {
        toast(`Sent partially — ${result.sent} delivered, ${result.failed} failed`, { icon: '⚠️' });
      } else {
        toast.success(t('toast.success.announcementSentSuccessfully'));
      }
    } else if (editData?._id) {
      await announcementsApi.update(editData._id, payload);
      toast.success(t('toast.success.announcementUpdatedSuccessfully'));
    } else {
      await announcementsApi.create(payload);
      toast.success(isScheduled ? 'Announcement scheduled' : 'Draft saved');
    }
  };

  const handleSubmitForm = async (mode) => {
    setLoading(true);
    let succeeded = false;
    try {
      await handleSubmit(
        async (values) => {
          await submitMode(mode, values);
          succeeded = true;
        },
        onInvalidWithToast
      )();
      if (succeeded) {
        onSave();
        handleClose();
      }
    } catch (err) {
      logger.error('Error saving announcement:', err);
      toast.error(err.message || 'Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  // Read live values for chip rendering (avoids stale closures in toggles).
  const watchedRecipients = useWatch({ control, name: 'recipients' }) || [];
  const watchedChannels = useWatch({ control, name: 'channels' }) || [];
  const watchedScheduledFor = useWatch({ control, name: 'scheduledFor' });
  const watchedAttachments = useWatch({ control, name: 'attachments' }) || [];

  if (!isOpen) return null;

  return (
    <div className="frosted-overlay__backdrop" role="dialog" aria-modal="true">
      <div className="frosted-overlay" style={{ width: 'min(820px, calc(100vw - 48px))' }}>
        <button
          type="button"
          className="frosted-overlay__close"
          onClick={handleClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="announce-overlay__hero">
          <h3 className="announce-overlay__title">
            {editData ? 'Edit announcement' : 'New announcement'}
          </h3>
          <p className="announce-overlay__subtitle">
            Compose your message, choose audiences and channels, then schedule or send.
          </p>
        </div>

        <div className="frosted-overlay__body announce-form">
          {/* Title */}
          <div className="announce-form__field">
            <label htmlFor="ann-title" className="announce-form__label">Title</label>
            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <input
                  id="ann-title"
                  type="text"
                  className="announce-form__input"
                  placeholder="Enter announcement title"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  aria-invalid={errors.title ? 'true' : undefined}
                  ref={field.ref}
                />
              )}
            />
            {errors.title && <span className="announce-form__error">{errors.title.message}</span>}
          </div>

          {/* Content with rich-text toolbar */}
          <div className="announce-form__field">
            <label htmlFor="ann-content" className="announce-form__label">Content</label>
            <div className="announce-form__editor">
              <div className="announce-form__toolbar" role="toolbar" aria-label="Formatting">
                <button type="button" className="iconbtn" onClick={() => wrapSelection('**')} aria-label="Bold" title="Bold">
                  <Bold size={13} />
                </button>
                <button type="button" className="iconbtn" onClick={() => wrapSelection('_')} aria-label="Italic" title="Italic">
                  <Italic size={13} />
                </button>
                <button type="button" className="iconbtn" onClick={() => insertAtCursor('- ')} aria-label="Bullet list" title="Bullet list">
                  <List size={13} />
                </button>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={() => wrapSelection('[', '](https://)')}
                  aria-label="Insert link"
                  title="Insert link"
                >
                  <Link2 size={13} />
                </button>
                <span className="subtle" style={{ marginLeft: 'auto', fontSize: 11 }}>
                  Markdown supported
                </span>
              </div>
              <Controller
                control={control}
                name="content"
                render={({ field }) => (
                  <textarea
                    id="ann-content"
                    ref={(el) => {
                      contentRef.current = el;
                      field.ref(el);
                    }}
                    className="announce-form__textarea"
                    placeholder="Enter announcement content"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    rows={7}
                    aria-invalid={errors.content ? 'true' : undefined}
                  />
                )}
              />
            </div>
            {errors.content && <span className="announce-form__error">{errors.content.message}</span>}
          </div>

          {/* Recipients */}
          <div className="announce-form__field">
            <span className="announce-form__label">Audience</span>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              {AUDIENCE_OPTIONS.map((opt) => {
                const active = opt.key === 'all'
                  ? watchedRecipients.some((r) => r.type === 'all')
                  : watchedRecipients.some((r) => r.type === opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      if (opt.key === 'all') {
                        setValue('recipients', [{ type: 'all' }], { shouldValidate: true, shouldDirty: true });
                        return;
                      }
                      const without = watchedRecipients.filter((r) => r.type !== 'all');
                      const exists = without.find((r) => r.type === opt.key);
                      const next = exists
                        ? without.filter((r) => r.type !== opt.key)
                        : [...without, { type: opt.key }];
                      setValue('recipients', next.length ? next : [{ type: 'all' }], { shouldValidate: true, shouldDirty: true });
                    }}
                    className={`chip ${active ? 'chip--accent' : ''}`}
                    style={{ height: 26, padding: '0 10px', fontSize: 12, cursor: 'pointer' }}
                    aria-pressed={active}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {errors.recipients && <span className="announce-form__error">{errors.recipients.message}</span>}
          </div>

          {/* Channels */}
          <div className="announce-form__field">
            <span className="announce-form__label">Send via</span>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              {CHANNEL_OPTIONS.map((opt) => {
                const active = watchedChannels.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      const next = watchedChannels.includes(opt.key)
                        ? watchedChannels.filter((c) => c !== opt.key)
                        : [...watchedChannels, opt.key];
                      setValue('channels', next, { shouldValidate: true, shouldDirty: true });
                    }}
                    className={`chip ${active ? 'chip--accent' : ''}`}
                    style={{ height: 26, padding: '0 10px', fontSize: 12, cursor: 'pointer' }}
                    aria-pressed={active}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {errors.channels && <span className="announce-form__error">{errors.channels.message}</span>}
          </div>

          {/* Schedule */}
          <div className="announce-form__field">
            <label className="row gap-2" style={{ alignItems: 'center', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={watchedScheduledFor !== null}
                onChange={(e) =>
                  setValue(
                    'scheduledFor',
                    e.target.checked ? '' : null,
                    { shouldValidate: true, shouldDirty: true }
                  )
                }
              />
              <Clock size={13} aria-hidden /> Schedule for later
            </label>
            {watchedScheduledFor !== null && (
              <>
                <Controller
                  control={control}
                  name="scheduledFor"
                  render={({ field }) => (
                    <input
                      type="datetime-local"
                      className="announce-form__input"
                      style={{ maxWidth: 260 }}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      onBlur={field.onBlur}
                      aria-invalid={errors.scheduledFor ? 'true' : undefined}
                    />
                  )}
                />
                {errors.scheduledFor && <span className="announce-form__error">{errors.scheduledFor.message}</span>}
              </>
            )}
          </div>

          {/* Attachments */}
          <div className="announce-form__field">
            <span className="announce-form__label">Attachments</span>
            <div className="col gap-2" style={{ width: '100%' }}>
              {(watchedAttachments).map((att, index) => (
                <div
                  key={`${att.url || att.name}-${index}`}
                  className="row gap-2"
                  style={{
                    padding: '8px 10px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                >
                  <FileText size={14} className="subtle" aria-hidden />
                  <span style={{ flex: 1, fontSize: 12, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {att.name}
                  </span>
                  <button
                    type="button"
                    className="iconbtn"
                    style={{ width: 24, height: 24 }}
                    onClick={() => removeAttachment(index)}
                    aria-label={`Remove ${att.name}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div className="row gap-2" style={{ alignItems: 'center' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={(e) => {
                    handleFileUpload(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                  disabled={uploadingFile}
                />
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                >
                  <Paperclip size={12} aria-hidden />
                  {uploadingFile ? `Uploading ${uploadProgress}%` : 'Add attachment'}
                </button>
                <span className="faint" style={{ fontSize: 11 }}>
                  Max {Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))}MB per file
                </span>
              </div>
              {uploadingFile && (
                <div
                  style={{
                    height: 4,
                    background: 'var(--surface-2)',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      background: 'var(--accent)',
                      transition: 'width 120ms',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="frosted-overlay__footer">
          <button type="button" className="btn" onClick={handleClose} disabled={loading}>
            Cancel
          </button>
          <div className="row gap-2">
            <button
              type="button"
              className="btn"
              onClick={() => handleSubmitForm('schedule')}
              disabled={loading}
            >
              <Clock size={13} aria-hidden />
              {watchedScheduledFor ? 'Schedule' : (editData ? 'Update draft' : 'Save draft')}
            </button>
            <button
              type="button"
              className="btn btn--accent"
              onClick={() => handleSubmitForm('send')}
              disabled={loading}
            >
              <Send size={13} aria-hidden />
              Send now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
