import React, { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./onboarding.css";
import { useApp } from "../../context/AppContext";
import { settingsApi } from "../../services/api";
import { safeSetItem } from "../../utils/safeStorage";
import {
  useOnboardingState,
  STEP_META,
  DONE_KEY,
  clearOnboardingDraft,
} from "./useOnboardingState";
import { launchOnboarding } from "./onboardingLaunch";
import {
  WelcomeStep, ProfileStep, SessionStep, TimingsStep, ClassesStep, SubjectsStep, ReviewStep,
} from "./OnboardingSteps";

/**
 * OnboardingFlow — pixel-perfect port of the Claude Design "School Onboarding"
 * reference (project ace763a2-…). A single-column wizard (Shell B / topbar
 * layout) with a Welcome/resume screen, six guided steps and a Review & launch
 * step that persists everything to the real settings / academics / classes /
 * subjects APIs. Draft state auto-saves so the flow can be resumed any time.
 */
export default function OnboardingFlow({ onComplete }) {
  const navigate = useNavigate();
  const { schoolSettings, currentAcademicYear, classes = [], refetch } = useApp();
  const ob = useOnboardingState(schoolSettings, currentAcademicYear);
  const { data, step, maxStep, setStep, setField, toggleClass, toggleDay, setClasses, addSection, removeSection, addSubject, removeSubject, derived } = ob;

  const [launching, setLaunching] = useState(false);
  const logoInputRef = useRef(null);

  // ── logo picker (preview only — real hosted upload happens in Settings) ──
  const onPickLogo = useCallback(() => logoInputRef.current?.click(), []);
  const onLogoChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setField("logo", reader.result);
    reader.readAsDataURL(file);
  }, [setField]);

  // ── exit / complete ──
  const saveAndExit = useCallback(() => {
    toast.success("Progress saved — resume any time from Settings.");
    onComplete?.();
  }, [onComplete]);

  const finishComplete = useCallback(() => {
    safeSetItem(DONE_KEY, "true");
    clearOnboardingDraft();
    onComplete?.();
  }, [onComplete]);

  // ── launch (last step) ──
  const launch = useCallback(async () => {
    setLaunching(true);
    const t = toast.loading("Launching your dashboard…");
    try {
      let existingSubjects = [];
      try { existingSubjects = (await settingsApi.getSubjects()) || []; } catch { /* ignore */ }
      const res = await launchOnboarding(data, { existingClasses: classes, existingSubjects });
      try { await refetch?.(true); } catch { /* non-fatal */ }
      toast.dismiss(t);
      if (res.failed.length === 0) {
        toast.success(`Setup complete — created ${res.created.classes} classes & ${res.created.subjects} subjects.`);
      } else {
        toast(`Setup saved with ${res.failed.length} issue(s): ${res.failed.map((f) => f.area).join(", ")}. Finish these in Settings.`, { icon: "⚠️", duration: 6000 });
      }
      finishComplete();
      // "Import a previous session" was on — hand the admin straight to the
      // data-import tools to bring last year's records over.
      if (res.importPrev) {
        toast("Next: import last year's data to finish migrating.", { icon: "⤓", duration: 6000 });
        navigate("/data-tools");
      }
    } catch (e) {
      toast.dismiss(t);
      toast.error(e?.message || "Couldn't complete setup. Your progress is saved.");
    } finally {
      setLaunching(false);
    }
  }, [data, classes, refetch, finishComplete, navigate]);

  const next = useCallback(() => { if (step === 6) launch(); else setStep(step + 1); }, [step, setStep, launch]);
  const back = useCallback(() => setStep(step - 1), [step, setStep]);
  const skip = useCallback(() => setStep(step + 1), [step, setStep]);

  // ── topbar step dots ──
  const steps = STEP_META.map((m, i) => {
    const n = i + 1;
    const status = step > n ? "done" : step === n ? "active" : "todo";
    return { ...m, n, mark: status === "done" ? "✓" : String(n), mod: status === "active" ? " is-active" : status === "done" ? " is-done" : "" };
  });

  const pct = step <= 0 ? 0 : Math.round((step / 6) * 100);
  const progressLabel = step === 0 ? "Not started" : `Step ${step} of 6`;
  const continueLabel = step === 6 ? "Launch dashboard ✦" : "Save & continue →";
  const brandLetter = (data.schoolName?.trim()?.[0] || "E").toUpperCase();

  return (
    <div className="obx">
      <input ref={logoInputRef} type="file" accept="image/png,image/svg+xml,image/jpeg" hidden onChange={onLogoChange} />
      <div className="ob">
        <div className="ob-body">
          {/* Topbar */}
          <header className="ob-topbar">
            <div className="ob-brand" style={{ margin: 0 }}>
              <div className="ob-brand__logo" style={{ width: 32, height: 32, borderRadius: 9, fontSize: 13 }}>{brandLetter}</div>
              <div>
                <div className="ob-brand__n" style={{ fontSize: 12.5 }}>{data.schoolName?.trim() || "New school"}</div>
                <div className="ob-brand__s">School setup</div>
              </div>
            </div>
            <div className="ob-top__steps">
              {steps.map((s) => (
                <React.Fragment key={s.n}>
                  <button className={"ob-top__step" + s.mod} onClick={() => setStep(s.n)} title={s.title} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <span className="ob-top__dot">{s.mark}</span>
                    <span className="ob-top__lab">{s.title}</span>
                  </button>
                  <span className="ob-top__line"></span>
                </React.Fragment>
              ))}
            </div>
            <button className="btn btn--ghost btn--sm" onClick={saveAndExit}>Save &amp; exit</button>
          </header>

          {/* Main */}
          <main className="ob-main">
            {step === 0 && <WelcomeStep data={data} maxStep={maxStep} onResume={() => setStep(maxStep > 0 ? maxStep : 1)} onStartFresh={() => setStep(1)} />}
            {step === 1 && <ProfileStep data={data} setField={setField} onPickLogo={onPickLogo} />}
            {step === 2 && <SessionStep data={data} setField={setField} derived={derived} />}
            {step === 3 && <TimingsStep data={data} setField={setField} toggleDay={toggleDay} />}
            {step === 4 && <ClassesStep data={data} derived={derived} toggleClass={toggleClass} setClasses={setClasses} addSection={addSection} removeSection={removeSection} />}
            {step === 5 && <SubjectsStep data={data} setField={setField} addSubject={addSubject} removeSubject={removeSubject} />}
            {step === 6 && <ReviewStep data={data} derived={derived} goTo={setStep} />}
          </main>

          {/* Footer */}
          {step >= 1 && (
            <footer className="ob-foot">
              <button className="btn btn--ghost" onClick={back}>← Back</button>
              <div className="ob-foot__prog">
                <span className="mono">{progressLabel}</span>
                <div className="ob-foot__bar"><div className="ob-foot__fill" style={{ width: `${pct}%` }}></div></div>
              </div>
              <div className="ob-spacer"></div>
              {step < 6 && <button className="btn" onClick={skip}>Skip for now</button>}
              <button className="btn btn--accent" onClick={next} disabled={launching}>{launching ? "Launching…" : continueLabel}</button>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
