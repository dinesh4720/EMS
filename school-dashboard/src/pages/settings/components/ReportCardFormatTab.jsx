import { useState, useEffect } from "react";
import { Input, Button, Switch } from "@heroui/react";
import { FileText, Plus, Trash2, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { settingsApi } from '../../../services/settingsApi';
import toast from "react-hot-toast";

export default function ReportCardFormatTab({ settings, onSave, saving }) {
  const { t } = useTranslation();
  const BOARD_TYPES = ['CBSE', 'ICSE', 'StateBoard', 'IB', 'IGCSE', 'Custom'];
  const BOARD_LABELS = {
    CBSE: 'CBSE (Central Board of Secondary Education)',
    ICSE: 'ICSE (Indian Certificate of Secondary Education)',
    StateBoard: 'State Board',
    IB: 'IB (International Baccalaureate)',
    IGCSE: 'IGCSE (Cambridge International)',
    Custom: 'Custom',
  };

  const defaultFormat = {
    boardType: 'Custom',
    customTitle: '',
    showGrade: true,
    showMarks: true,
    showRank: true,
    showAttendance: true,
    showRemarks: true,
    useGradePoints: false,
    passingGrade: 'D',
  };

  const [format, setFormat] = useState({ ...defaultFormat, ...(settings?.reportCardFormat || {}) });
  const [gradingScale, setGradingScale] = useState(settings?.gradingScale || []);
  const [newGrade, setNewGrade] = useState({ minPercentage: '', grade: '' });
  const [presets, setPresets] = useState(null);
  const [loadingPresets, setLoadingPresets] = useState(false);

  useEffect(() => {
    setFormat({ ...defaultFormat, ...(settings?.reportCardFormat || {}) });
    setGradingScale(settings?.gradingScale || []);
  }, [settings]);

  const loadPresets = async () => {
    if (presets) return;
    setLoadingPresets(true);
    try {
      const data = await settingsApi.getBoardConfigPresets();
      setPresets(data);
    } catch (e) {
      toast.error(t('settings.academics.boardPresetsLoadFailed', 'Failed to load board presets'));
    } finally {
      setLoadingPresets(false);
    }
  };

  const applyPreset = async (boardType) => {
    await loadPresets();
    const p = presets?.[boardType];
    if (!p) return;
    const { gradingScale: presetScale, ...presetFormat } = p;
    setFormat(presetFormat);
    setGradingScale(presetScale || []);
    toast.success(t('settings.academics.presetLoaded', '{{board}} preset loaded', { board: boardType }));
  };

  const handleSave = () => {
    onSave({ reportCardFormat: format, gradingScale });
  };

  const addGradeRow = () => {
    const pct = parseFloat(newGrade.minPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100 || !newGrade.grade.trim()) {
      toast.error(t('settings.academics.invalidGradeEntry', 'Enter a valid percentage (0-100) and grade label'));
      return;
    }
    setGradingScale(prev => [...prev, { minPercentage: pct, grade: newGrade.grade.trim() }]
      .sort((a, b) => b.minPercentage - a.minPercentage));
    setNewGrade({ minPercentage: '', grade: '' });
  };

  const removeGradeRow = (idx) => {
    setGradingScale(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleField = (field) => setFormat(f => ({ ...f, [field]: !f[field] }));

  const VISIBILITY_FIELDS = [
    { key: 'showMarks', label: t('settings.academics.visibility.showMarks', 'Show Marks / Scores') },
    { key: 'showGrade', label: t('settings.academics.visibility.showGrade', 'Show Grade') },
    { key: 'showRank', label: t('settings.academics.visibility.showRank', 'Show Class Rank') },
    { key: 'showAttendance', label: t('settings.academics.visibility.showAttendance', 'Show Attendance Summary') },
    { key: 'showRemarks', label: t('settings.academics.visibility.showRemarks', 'Show Teacher Remarks') },
    { key: 'useGradePoints', label: t('settings.academics.visibility.useGradePoints', 'Display Grade Points (e.g. IB scale)') },
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Board Type Selector */}
      <div className="rounded-xl border border-default-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary"><FileText size={24} /></div>
          <div>
            <h3 className="text-lg font-bold text-default-900">{t('settings.academics.boardType', 'Board Type')}</h3>
            <p className="text-xs text-default-500">{t('settings.academics.boardTypeDesc', 'Select a board to load its default format and grading scale')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BOARD_TYPES.map(bt => (
            <button
              key={bt}
              type="button"
              onClick={() => {
                setFormat(f => ({ ...f, boardType: bt }));
                if (bt !== 'Custom') applyPreset(bt);
              }}
              className={`p-3 rounded-lg border text-left transition-all text-sm ${
                format.boardType === bt
                  ? 'border-primary bg-primary/5 text-primary font-semibold'
                  : 'border-default-200 text-default-700 hover:border-default-300'
              }`}
            >
              {bt}
            </button>
          ))}
        </div>
        {format.boardType && (
          <p className="text-xs text-default-400 mt-2">{BOARD_LABELS[format.boardType] || format.boardType}</p>
        )}
      </div>

      {/* Report Card Title */}
      <div className="rounded-xl border border-default-200 bg-white p-6 space-y-4">
        <h3 className="text-base font-semibold text-default-800">{t('settings.academics.reportCardTitleHeading', 'Report Card Title')}</h3>
        <Input
          label={t('settings.academics.customTitleLabel', 'Custom Title (leave blank to use default)')}
          labelPlacement="outside"
          placeholder={t('settings.academics.customTitlePlaceholder', 'e.g. PROGRESS REPORT, REPORT CARD')}
          value={format.customTitle}
          onValueChange={(v) => setFormat(f => ({ ...f, customTitle: v }))}
          variant="bordered"
          maxLength={100}
        />
        <Input
          label={t('settings.academics.minPassingGrade', 'Minimum Passing Grade')}
          labelPlacement="outside"
          placeholder={t('settings.academics.minPassingGradePlaceholder', 'e.g. D, C, 3')}
          value={format.passingGrade}
          onValueChange={(v) => setFormat(f => ({ ...f, passingGrade: v }))}
          variant="bordered"
          maxLength={5}
          className="max-w-xs"
        />
      </div>

      {/* Visibility Toggles */}
      <div className="rounded-xl border border-default-200 bg-white p-6 space-y-4">
        <h3 className="text-base font-semibold text-default-800">{t('settings.academics.reportCardSections', 'Report Card Sections')}</h3>
        <p className="text-xs text-default-400">{t('settings.academics.reportCardSectionsDesc', 'Choose which sections appear on the printed report card')}</p>
        <div className="space-y-3">
          {VISIBILITY_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-default-100 bg-default-50">
              <span className="text-sm text-default-700">{label}</span>
              <Switch
                size="sm"
                isSelected={format[key] ?? true}
                onValueChange={() => toggleField(key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Grading Scale */}
      <div className="rounded-xl border border-default-200 bg-white p-6 space-y-4">
        <h3 className="text-base font-semibold text-default-800">{t('settings.academics.gradingScale', 'Grading Scale')}</h3>
        <p className="text-xs text-default-400">{t('settings.academics.gradingScaleDesc', 'Define how percentages map to grades. Sorted automatically by percentage.')}</p>
        {gradingScale.length > 0 ? (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-default-50">
                <th className="text-left py-2 px-3 font-semibold text-default-600">{t('settings.academics.minPercent', 'Min %')}</th>
                <th className="text-left py-2 px-3 font-semibold text-default-600">{t('settings.academics.gradeHeader', 'Grade')}</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {gradingScale.map((row, idx) => (
                <tr key={`grade-${row.minPercentage}-${row.grade}`} className="border-t border-default-100">
                  <td className="py-2 px-3 text-default-700">{row.minPercentage}%</td>
                  <td className="py-2 px-3 font-semibold text-default-800">{row.grade}</td>
                  <td className="py-2 px-3 text-right">
                    <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => removeGradeRow(idx)}>
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-6 text-default-400 text-sm bg-default-50 rounded-lg">
            {t('settings.academics.noGradingScale', 'No grading scale configured — default Indian scale will be used')}
          </div>
        )}
        <div className="flex gap-2 items-end pt-2">
          <Input
            type="number"
            label={t('settings.academics.minPercent', 'Min %')}
            labelPlacement="outside"
            placeholder={t('settings.academics.minPercentPlaceholder', 'e.g. 90')}
            value={String(newGrade.minPercentage)}
            onValueChange={(v) => setNewGrade(g => ({ ...g, minPercentage: v }))}
            variant="bordered"
            min={0}
            max={100}
            className="w-28"
          />
          <Input
            label={t('settings.academics.gradeLabel', 'Grade')}
            labelPlacement="outside"
            placeholder={t('settings.academics.gradePlaceholder', 'e.g. A+')}
            value={newGrade.grade}
            onValueChange={(v) => setNewGrade(g => ({ ...g, grade: v }))}
            variant="bordered"
            maxLength={5}
            className="w-28"
          />
          <Button
            color="primary"
            variant="flat"
            startContent={<Plus size={16} />}
            onPress={addGradeRow}
            className="mb-0.5"
          >
            {t('common.add', 'Add')}
          </Button>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button color="primary" onPress={handleSave} isLoading={saving} startContent={<Save size={16} />}>
          {t('settings.academics.saveReportCardFormat', 'Save Report Card Format')}
        </Button>
      </div>
    </div>
  );
}
