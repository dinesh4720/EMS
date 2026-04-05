import { useState, useEffect, useCallback } from 'react';
import {
  Card, CardBody, Button, Switch,
  Breadcrumbs, BreadcrumbItem, Chip, Divider,
} from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { Home, Save, RefreshCw, Edit2, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../services/api';
import { PageLayout, MinimalButton } from '../../components/ui';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const GRADE_COLOR = (g) => {
  if (['A1', 'A2'].includes(g)) return 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300';
  if (['B1', 'B2'].includes(g)) return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
  if (['C1', 'C2'].includes(g)) return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
  if (g === 'D') return 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300';
  return 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300';
};

function NumInput({ value, onChange, min, max, className = '' }) {
  return (
    <input
      type="number"
      value={value ?? ''}
      min={min}
      max={max}
      onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      className={`w-16 text-center border border-gray-300 dark:border-zinc-600 rounded px-1 py-0.5 text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
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

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await request('/cce/config');
      setConfig(res);
      setEnabled(res.enabled !== false);
    } catch {
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
        ) : config ? (
          <div className="p-6 space-y-6">
            {/* Enable Toggle */}
            <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-zinc-100">Enable CCE Grading</p>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                      {config._initialized === false ? 'Using default CBSE scale' : `Academic Year: ${config.academicYear}`}
                    </p>
                  </div>
                  <Switch isSelected={enabled} onValueChange={setEnabled} />
                </div>
              </CardBody>
            </Card>

            {/* Grading Scale */}
            <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Grading Scale</h3>
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
                      <tr className="border-b border-gray-100 dark:border-zinc-800">
                        <th className="text-left py-2 text-gray-500 dark:text-zinc-400 font-medium">Grade</th>
                        <th className="text-center py-2 text-gray-500 dark:text-zinc-400 font-medium">Grade Point</th>
                        <th className="text-center py-2 text-gray-500 dark:text-zinc-400 font-medium">Min %</th>
                        <th className="text-center py-2 text-gray-500 dark:text-zinc-400 font-medium">Max %</th>
                        <th className="text-left py-2 text-gray-500 dark:text-zinc-400 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingScale
                        ? draftScale.map((row, i) => (
                          <tr key={i} className="border-b border-gray-50 dark:border-zinc-900">
                            <td className="py-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${GRADE_COLOR(row.grade)}`}>
                                {row.grade}
                              </span>
                            </td>
                            <td className="py-2 text-center">
                              <NumInput value={row.gradePoint} onChange={v => updateDraftRow(i, 'gradePoint', v)} min={0} max={10} />
                            </td>
                            <td className="py-2 text-center">
                              <NumInput value={row.minPercentage} onChange={v => updateDraftRow(i, 'minPercentage', v)} min={0} max={100} />
                            </td>
                            <td className="py-2 text-center">
                              <NumInput value={row.maxPercentage} onChange={v => updateDraftRow(i, 'maxPercentage', v)} min={0} max={100} />
                            </td>
                            <td className="py-2">
                              <input
                                type="text"
                                value={row.description ?? ''}
                                onChange={e => updateDraftRow(i, 'description', e.target.value)}
                                className="w-full border border-gray-300 dark:border-zinc-600 rounded px-2 py-0.5 text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </td>
                          </tr>
                        ))
                        : (config.gradingScale || []).map((row, i) => (
                          <tr key={i} className="border-b border-gray-50 dark:border-zinc-900">
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${GRADE_COLOR(row.grade)}`}>
                                {row.grade}
                              </span>
                            </td>
                            <td className="py-2.5 text-center text-gray-700 dark:text-zinc-300 font-medium">{row.gradePoint}</td>
                            <td className="py-2.5 text-center text-gray-600 dark:text-zinc-400">{row.minPercentage}%</td>
                            <td className="py-2.5 text-center text-gray-600 dark:text-zinc-400">{row.maxPercentage}%</td>
                            <td className="py-2.5 text-gray-600 dark:text-zinc-400">{row.description}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>

            {/* Assessment Types */}
            <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Assessment Types</h3>
                  {(() => {
                    const total = (config.assessmentTypes || []).reduce((s, at) => s + (Number(at.weightage) || 0), 0);
                    return (
                      <Chip
                        size="sm"
                        variant="flat"
                        className={total === 100
                          ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                          : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                        }
                      >
                        Total: {total}%{total !== 100 ? ' (must be 100%)' : ''}
                      </Chip>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(config.assessmentTypes || []).map((at, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{at.name}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 capitalize">
                          {at.type} · {at.term?.replace(/_/g, ' ')} · {at.weightage}% weightage · {at.maxMarks} marks
                        </p>
                      </div>
                      <Chip
                        size="sm"
                        variant="flat"
                        className={at.isActive
                          ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                          : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'
                        }
                      >
                        {at.isActive ? 'Active' : 'Inactive'}
                      </Chip>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Co-Scholastic Areas */}
            <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Co-Scholastic Areas</h3>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Toggle to activate/deactivate</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(config.coScholasticAreas || []).map((area, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleCoScholasticToggle(i, !area.isActive)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 ${
                        area.isActive
                          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                          : 'bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-medium text-gray-800 dark:text-zinc-200">{area.name}</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 capitalize">{area.category?.replace(/_/g, ' ')}</p>
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
