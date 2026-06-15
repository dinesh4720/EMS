import { useRef } from "react";
import { Users, Check } from "lucide-react";
import { ComposerField, ComposerAvatar } from "../ComposerPrimitives";

export default function PersonalInfoSection({
  form,
  set,
  errors,
  registerField,
  picturePreviewUrl,
  initials,
  sectionStatusIndex,
}) {
  const fileInputRef = useRef(null);

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set("picture", file);
  };

  return (
    <section id="composer-section-identity" className="section">
      <div className="section__head">
        <div>
          <div className="section__title">Identity</div>
          <div className="section__hint">
            How they show up across rosters and chat.
          </div>
        </div>
        {sectionStatusIndex.done && (
          <span className="chip chip--ok">
            <Check size={9} strokeWidth={2.5} aria-hidden /> Looks good
          </span>
        )}
      </div>

      <div className="avatar-up" style={{ marginBottom: 14 }}>
        <ComposerAvatar
          previewUrl={picturePreviewUrl}
          initials={initials || "?"}
          name={`${form.firstName} ${form.lastName}`.trim()}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minWidth: 0,
          }}
        >
          <span style={{ fontWeight: 520 }}>Profile photo</span>
          <span className="subtle" style={{ fontSize: 12 }}>
            JPG or PNG · square · max 2 MB. Initials are used if none.
          </span>
          <div className="row gap-2" style={{ marginTop: 4 }}>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload
            </button>
            <button
              type="button"
              className="btn btn--sm btn--ghost subtle"
              onClick={() => set("picture", null)}
            >
              Use initials
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onPickFile}
          />
        </div>
      </div>

      <div className="fgrid">
        <ComposerField
          label="First name"
          required
          name="firstName"
          error={errors.firstName}
          registerField={registerField}
        >
          <input
            className={`input ${errors.firstName ? "input--err" : ""}`}
            value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            aria-invalid={errors.firstName ? "true" : undefined}
          />
        </ComposerField>
        <ComposerField
          label="Last name"
          required
          name="lastName"
          error={errors.lastName}
          registerField={registerField}
        >
          <input
            className={`input ${errors.lastName ? "input--err" : ""}`}
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            aria-invalid={errors.lastName ? "true" : undefined}
          />
        </ComposerField>
        <ComposerField
          label="Staff code"
          hint="Auto-suggested · next free in series"
        >
          <div className="field__icon-wrap">
            <Users size={12} className="field__icon" aria-hidden />
            <input
              className="input input--with-icon input--with-suffix mono tnum"
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder="EMP016"
            />
            <span className="field__suffix">EMP</span>
          </div>
        </ComposerField>
        <ComposerField label="Display name" hint="Shown to parents · optional">
          <input
            className="input"
            value={form.displayName}
            onChange={(e) => set("displayName", e.target.value)}
            placeholder={`${form.firstName} ${form.lastName}`.trim() || "Anika Rao"}
          />
        </ComposerField>
      </div>
    </section>
  );
}
