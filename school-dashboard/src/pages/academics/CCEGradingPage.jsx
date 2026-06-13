import { useState, useEffect, useCallback } from 'react';
import {
  Card, CardBody, Button, Switch,
  Breadcrumbs, BreadcrumbItem,
} from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { Home, Save, RefreshCw, Edit2, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../services/api';
import { PageLayout, MinimalButton, Input as DSInput, ErrorState } from '../../components/ui';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Token-driven grade pill — uses --ok/--info/--warn/--danger tokens
// so the scale visualization is dark-mode aware out of the box.
const gradePillClass = (g) => {
  if (!g) return 'grade-pill grade-pill--muted';
  if (g === 'A1' || g === 'A2') return 'grade-pill grade-pill--ok';
  if (g === 'B1' || g === 'B2') return 'grade-pill grade-pill--info';
  if (g === 'C1' || g === 'C2') return 'grade-pill grade-pill--warn';
  return 'grade-pill grade-pill--danger';
};

function NumInput({ value, onChange, min, max, ariaLabel }) {
  return (
    <DSInput
      size="sm"
      type="number"
      value={value ?? ''}
      min={min}
      max={max}
      onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      wrapperClassName="w-20 mx-auto"
      aria-label={ariaLabel}
    />
  );
}

export default function CCEGradingPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [editingScale, setEditingScale] = useState(false);
  const [draftScale, setDraftScale] = useState([]);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await request('/cce/config');
      setConfig(res);
      setEnabled(res.enabled !== false);
    } catch (e) {
      setLoadError(e);
      toast.error('Failed to load CCE configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (overrideConfig) => {
    const payload = overrideConfig ?? { ...config, enabled };

    // Validate assessment type weightages sum to 100%
    const assessmentTypes = payload.assessmentTypes || [];
    if (assessmentTypes.length > 0) {
      const totalWeightage = assessmentTypes.reduce((sum, at) => sum + (Number(at.weightage) || 0), 0);
      if (totalWeightage !== 100) {
        toast.error(`Assessment type weightages must sum to 100%. Current total: ${totalWeightage}%`);
        return;
      }
    }

    setSaving(true);
    try {
      await request('/cce/config', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (overrideConfig) setConfig(overrideConfig);
      toast.success('CCE configuration saved');
    } catch (e) {
      toast.error(e?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  // ── Grading scale edit ──────────────────────────────────────────────────────
  const startEditScale = () => {
    setDraftScale((config.gradingScale || []).map(r => ({ ...r })));
    setEditingScale(true);
  };

  const cancelEditScale = () => {
    setEditingScale(false);
    setDraftScale([]);
  };

  const updateDraftRow = useCallback((idx, field, val) => {
    setDraftScale(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  }, []);

  const saveScale = async () => {
    const updated = { ...config, enabled, gradingScale: draftScale };
    await handleSave(updated);
    setEditingScale(false);
    setDraftScale([]);
  };

  // ── Co-scholastic toggle ────────────────────────────────────────────────────
  const handleCoScholasticToggle = useCallback(async (idx, newActive) => {
    let updated;
    setConfig(prev => {
      const updatedAreas = (prev.coScholasticAreas || []).map((a, i) =>
        i === idx ? { ...a, isActive: newActive } : a
      );
      updated = { ...prev, enabled, coScholasticAreas: updatedAreas };
      return updated;
    });
    try {
      await request('/cce/config', {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
      toast.success(`${updated.coScholasticAreas[idx].name} ${newActive ? 'activated' : 'deactivated'}`);
    } catch {
      setConfig(prev => ({
        ...prev,
        coScholasticAreas: prev.coScholasticAreas.map((a, i) =>
          i === idx ? { ...a, isActive: !newActive } : a
        ),
      }));
      toast.error('Failed to update co-scholastic area');
    }
  }, [enabled]);

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <Breadcrumbs size="sm">
          <BreadcrumbItem startContent={<Home size={14} />} onPress={() => navigate('/')}>Home</BreadcrumbItem>
          <BreadcrumbItem onPress={() => navigate('/academics')}>Academics</BreadcrumbItem>
          <BreadcrumbItem>CCE Grading</BreadcrumbItem>
        </Breadcrumbs>
      </div>

      <PageLayout
        header={{ title: 'CCE Grading Configuration', description: 'Configure Continuous and Comprehensive Evaluation grading scale' }}
        actions={
          <div className="flex gap-2">
            <MinimalButton icon={<RefreshCw size={16} />} onClick={fetchConfig}>Reload</MinimalButton>
            <MinimalButton icon={<Save size={16} />} onClick={() => handleSave(null)} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </MinimalButton>
          </div>
        }
        noPadding
      >
        {loading ? (
          <TablePageSkeleton />
        ) : loadError && !config ? (
          <div className="p-6">
            <ErrorState
              title="Failed to load CCE configuration"
              error={loadError}
              onRetry={fetchConfig}
              size="lg"
            />
          </div>
        ) : config ? (
          <div className="p-6 space-y-6">
            {/* Enable Toggle */}
            <Card shadow="sm" className="bg-surface border border-border-token">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-fg">Enable CCE Grading</p>
                    <p className="text-sm text-fg-muted">
                      {config._initialized === false ? 'Using default CBSE scale' : `Academic Year: ${config.academicYear}`}
                    </p>
                  </div>
                  <Switch isSelected={enabled} onValueChange={setEnabled} />
                </div>
              </CardBody>
            </Card>

            {/* Grading Scale */}
            <Card shadow="sm" className="bg-surface border border-border-token">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-fg">Grading Scale</h3>
                  {!editingScale ? (
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      startContent={<Edit2 size={13} />}
                      onPress={startEditScale}
                    >
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        startContent={<X size={13} />}
                        onPress={cancelEditScale}
                        isDisabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        color="success"
                        startContent={<Check size={13} />}
                        onPress={saveScale}
                        isLoading={saving}
                      >
                        Save Scale
                      </Button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-divider">
                        <th className="text-left py-2 text-fg-muted font-medium">Grade</th>
                        <th className="text-center py-2 text-fg-muted font-medium">Grade Point</th>
                        <th className="text-center py-2 text-fg-muted font-medium">Min %</th>
                        <th className="text-center py-2 text-fg-muted font-medium">Max %</th>
                        <th className="text-left py-2 text-fg-muted font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingScale
                        ? draftScale.map((row, i) => (
                          <tr key={row.grade || `draft-grade-${i}`} className="border-b border-divider">
                            <td className="py-2">
                              <span className={gradePillClass(row.grade)}>
                                {row.grade}
                              </span>
                            </td>
                            <td className="py-2 text-center">
                              <NumInput value={row.gradePoint} onChange={v => updateDraftRow(i, 'gradePoint', v)} min={0} max={10} ariaLabel={`Grade point for ${row.grade}`} />
                            </td>
                            <td className="py-2 text-center">
                              <NumInput value={row.minPercentage} onChange={v => updateDraftRow(i, 'minPercentage', v)} min={0} max={100} ariaLabel={`Min percentage for ${row.grade}`} />
                            </td>
                            <td className="py-2 text-center">
                              <NumInput value={row.maxPercentage} onChange={v => updateDraftRow(i, 'maxPercentage', v)} min={0} max={100} ariaLabel={`Max percentage for ${row.grade}`} />
                            </td>
                            <td className="py-2">
                              <DSInput
                                size="sm"
                                type="text"
                                value={row.description ?? ''}
                                onChange={e => updateDraftRow(i, 'description', e.target.value)}
                                aria-label={`Description for ${row.grade}`}
                              />
                            </td>
                          </tr>
                        ))
                        : (config.gradingScale || []).map((row, i) => (
                          <tr key={row.grade || `grade-${i}`} className="border-b border-divider">
                            <td className="py-2.5">
                              <span className={gradePillClass(row.grade)}>
                                {row.grade}
                              </span>
                            </td>
                            <td className="py-2.5 text-center text-fg font-medium tnum">{row.gradePoint}</td>
                            <td className="py-2.5 text-center text-fg-muted tnum">{row.minPercentage}%</td>
                            <td className="py-2.5 text-center text-fg-muted tnum">{row.maxPercentage}%</td>
                            <td className="py-2.5 text-fg-muted">{row.description}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>

            {/* Assessment Types */}
            <Card shadow="sm" className="bg-surface border border-border-token">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-fg">Assessment Types</h3>
                  {(() => {
                    const total = (config.assessmentTypes || []).reduce((s, at) => s + (Number(at.weightage) || 0), 0);
                    return (
                      <span className={`grade-pill tnum ${total === 100 ? 'grade-pill--ok' : 'grade-pill--danger'}`}>
                        Total: {total}%{total !== 100 ? ' · must be 100%' : ''}
                      </span>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(config.assessmentTypes || []).map((at, i) => (
                    <div
                      key={at.name || `assessment-${i}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-divider"
                    >
                      <div>
                        <p className="text-sm font-medium text-fg">{at.name}</p>
                        <p className="text-xs text-fg-muted capitalize">
                          {at.type} · {at.term?.replace(/_/g, ' ')} · {at.weightage}% weightage · {at.maxMarks} marks
                        </p>
                      </div>
                      <span className={`grade-pill ${at.isActive ? 'grade-pill--ok' : 'grade-pill--muted'}`}>
                        {at.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Co-Scholastic Areas */}
            <Card shadow="sm" className="bg-surface border border-border-token">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-fg">Co-Scholastic Areas</h3>
                  <p className="text-xs text-fg-faint">Toggle to activate/deactivate</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(config.coScholasticAreas || []).map((area, i) => (
                    <button
                      key={area.name || `coscholastic-${i}`}
                      type="button"
                      onClick={() => handleCoScholasticToggle(i, !area.isActive)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors cursor-pointer hover:bg-surface-hover ${
                        area.isActive
                          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                          : 'bg-surface-2 border-divider'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-medium text-fg">{area.name}</p>
                        <p className="text-xs text-fg-faint capitalize">{area.category?.replace(/_/g, ' ')}</p>
                      </div>
                      <Switch
                        isSelected={area.isActive}
                        size="sm"
                        color="success"
                        onClick={e => e.stopPropagation()}
                        onChange={() => handleCoScholasticToggle(i, !area.isActive)}
                        aria-label={`Toggle ${area.name}`}
                      />
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        ) : null}
      </PageLayout>
    </div>
  );
}
