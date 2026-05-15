import { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, Switch, Input, Button } from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { TrendingUp, Users, ThumbsUp, ThumbsDown, Minus, MessageSquare, Settings, Save, Filter } from 'lucide-react';
import { npsApi } from '../../services/api';
import toast from 'react-hot-toast';
import { formatShortDate } from '../../utils/dateFormatter';

function NpsGauge({ score }) {
  if (score == null) return <p className="text-3xl font-bold text-fg-faint">N/A</p>;
  const color = score >= 50 ? 'text-green-600 dark:text-green-400' : score >= 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
  return <p className={`text-4xl font-bold ${color}`}>{score > 0 ? `+${score}` : score}</p>;
}

export default function NPSAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Config state
  const [config, setConfig] = useState({ enabled: true, cooldownDays: 90 });
  const [configDraft, setConfigDraft] = useState({ enabled: true, cooldownDays: 90 });
  const [configLoading, setConfigLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  // Date filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchAnalytics = useCallback(async (from, to) => {
    try {
      setLoading(true);
      const params = {};
      if (from) params.from = new Date(from).toISOString();
      if (to) params.to = new Date(to + 'T23:59:59').toISOString();
      const res = await npsApi.getAnalytics(params);
      setData(res);
    } catch {
      toast.error('Failed to load NPS analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    npsApi.getConfig()
      .then((cfg) => {
        setConfig(cfg);
        setConfigDraft(cfg);
      })
      .catch(() => toast.error('Failed to load NPS config'))
      .finally(() => setConfigLoading(false));
  }, [fetchAnalytics]);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await npsApi.updateConfig(configDraft);
      setConfig(configDraft);
      toast.success('NPS configuration saved');
    } catch {
      toast.error('Failed to save NPS config');
    } finally {
      setSavingConfig(false);
    }
  };

  const configChanged = config.enabled !== configDraft.enabled || config.cooldownDays !== configDraft.cooldownDays;

  const handleApplyFilter = () => {
    fetchAnalytics(dateFrom, dateTo);
  };

  const handleClearFilter = () => {
    setDateFrom('');
    setDateTo('');
    fetchAnalytics();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">NPS Analytics</h2>
        <p className="text-sm text-fg-muted">Net Promoter Score based on staff feedback surveys</p>
      </div>

      {/* Configuration Section */}
      <Card shadow="sm" className="bg-surface border border-border-token">
        <CardBody className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={16} className="text-fg-faint" />
            <h3 className="text-sm font-semibold text-fg">Survey Configuration</h3>
          </div>
          {configLoading ? (
            <div className="h-12 animate-pulse bg-surface-2 rounded" />
          ) : (
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex items-center gap-3">
                <Switch
                  size="sm"
                  isSelected={configDraft.enabled}
                  onValueChange={(val) => setConfigDraft((d) => ({ ...d, enabled: val }))}
                />
                <span className="text-sm text-fg">
                  {configDraft.enabled ? 'Surveys enabled' : 'Surveys disabled'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-fg-muted whitespace-nowrap">Cooldown (days)</label>
                <Input
                  type="number"
                  size="sm"
                  className="w-24"
                  min={7}
                  max={365}
                  value={String(configDraft.cooldownDays)}
                  onValueChange={(val) => {
                    const n = parseInt(val, 10);
                    if (!isNaN(n)) setConfigDraft((d) => ({ ...d, cooldownDays: Math.min(365, Math.max(7, n)) }));
                  }}
                />
              </div>
              {configChanged && (
                <Button
                  size="sm"
                  color="primary"
                  isLoading={savingConfig}
                  onPress={handleSaveConfig}
                  startContent={<Save size={14} />}
                >
                  Save
                </Button>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Date Range Filter */}
      <Card shadow="sm" className="bg-surface border border-border-token">
        <CardBody className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <Filter size={16} className="text-fg-faint mb-1" />
            <div>
              <label className="text-xs text-fg-muted">From</label>
              <Input type="date" size="sm" className="w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="Start date" />
            </div>
            <div>
              <label className="text-xs text-fg-muted">To</label>
              <Input type="date" size="sm" className="w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="End date" />
            </div>
            <Button size="sm" color="primary" variant="flat" onPress={handleApplyFilter}>Apply</Button>
            {(dateFrom || dateTo) && (
              <Button size="sm" variant="light" onPress={handleClearFilter}>Clear</Button>
            )}
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <TablePageSkeleton />
      ) : !data ? null : (
        <div className="space-y-4">
          {/* Score Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card shadow="sm" className="bg-surface border border-border-token">
              <CardBody className="p-4 text-center">
                <TrendingUp size={20} className="mx-auto mb-2 text-fg-faint" />
                <p className="text-xs text-fg-muted mb-1">NPS Score</p>
                <NpsGauge score={data?.npsScore ?? null} />
              </CardBody>
            </Card>
            <Card shadow="sm" className="bg-surface border border-border-token">
              <CardBody className="p-4 text-center">
                <Users size={20} className="mx-auto mb-2 text-fg-faint" />
                <p className="text-xs text-fg-muted mb-1">Total Responses</p>
                <p className="text-3xl font-bold text-fg">{data?.total ?? 0}</p>
              </CardBody>
            </Card>
            <Card shadow="sm" className="bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-800">
              <CardBody className="p-4 text-center">
                <ThumbsUp size={20} className="mx-auto mb-2 text-green-500" />
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">Promoters (9-10)</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">{data?.promoters ?? 0}</p>
              </CardBody>
            </Card>
            <Card shadow="sm" className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-100 dark:border-yellow-800">
              <CardBody className="p-4 text-center">
                <Minus size={20} className="mx-auto mb-2 text-yellow-500" />
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">Passives (7-8)</p>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{data?.passives ?? 0}</p>
              </CardBody>
            </Card>
            <Card shadow="sm" className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-800">
              <CardBody className="p-4 text-center">
                <ThumbsDown size={20} className="mx-auto mb-2 text-red-500" />
                <p className="text-xs text-red-600 dark:text-red-400 mb-1">Detractors (0-6)</p>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">{data?.detractors ?? 0}</p>
              </CardBody>
            </Card>
          </div>

          {/* Trend */}
          {data.trend?.length > 0 && (
            <Card shadow="sm" className="bg-surface border border-border-token">
              <CardBody className="p-4">
                <h3 className="text-sm font-semibold text-fg mb-4">Monthly Trend</h3>
                <div className="flex items-end gap-2 h-40">
                  {data.trend.map((t) => {
                    const maxR = Math.max(...data.trend.map((x) => x.responses), 1);
                    const barH = Math.max((t.responses / maxR) * 100, 8);
                    const color = t.score >= 50 ? 'bg-green-400' : t.score >= 0 ? 'bg-yellow-400' : 'bg-red-400';
                    return (
                      <div key={t.month} className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="text-xs font-semibold text-fg mb-1">
                          {t.score > 0 ? `+${t.score}` : t.score}
                        </span>
                        <div
                          className={`w-full max-w-[40px] rounded-t ${color} transition-all`}
                          style={{ height: `${barH}%` }}
                          title={`${t.responses} responses`}
                        />
                        <span className="text-[10px] text-fg-faint mt-1">{t.month}</span>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Score distribution */}
          {(data?.total ?? 0) > 0 && (
            <Card shadow="sm" className="bg-surface border border-border-token">
              <CardBody className="p-4">
                <h3 className="text-sm font-semibold text-fg mb-4">Score Distribution</h3>
                <div className="space-y-2">
                  {Array.from({ length: 11 }, (_, i) => 10 - i).map(score => {
                    const count = data?.distribution?.[score] || 0;
                    const pct = (data?.total ?? 0) > 0 ? (count / data.total) * 100 : 0;
                    const color = score >= 9 ? 'bg-green-400' : score >= 7 ? 'bg-yellow-400' : 'bg-red-400';
                    return (
                      <div key={score} className="flex items-center gap-3">
                        <span className="text-xs text-fg-muted w-4 text-right">{score}</span>
                        <div className="flex-1 bg-surface-2 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${color} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-fg-muted w-6">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Recent Comments */}
          {data.comments?.length > 0 && (
            <Card shadow="sm" className="bg-surface border border-border-token">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={16} className="text-fg-faint" />
                  <h3 className="text-sm font-semibold text-fg">Recent Comments</h3>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {data.comments.map((c, i) => (
                    <div key={i} className="p-3 bg-surface-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                          c.category === 'promoter' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' :
                          c.category === 'passive' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' :
                          'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        }`}>
                          Score: {c.score}
                        </span>
                        <span className="text-xs text-fg-faint">
                          {formatShortDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-fg">{c.comment}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {(data?.total ?? 0) === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border-token rounded-xl">
              <TrendingUp size={40} className="mx-auto mb-3 text-fg-faint" />
              <p className="text-fg-muted">No NPS survey responses yet</p>
              <p className="text-sm text-fg-faint mt-1">Staff will be prompted to complete surveys periodically</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
