import { useState, useEffect } from 'react';
import { Card, CardBody } from '@heroui/react';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';
import { TrendingUp, Users, ThumbsUp, ThumbsDown, Minus, MessageSquare } from 'lucide-react';
import { request } from '../../services/api';
import toast from 'react-hot-toast';
import { formatShortDate } from '../../utils/dateFormatter';

function NpsGauge({ score }) {
  if (score == null) return <p className="text-3xl font-bold text-gray-300 dark:text-zinc-600">N/A</p>;
  const color = score >= 50 ? 'text-green-600 dark:text-green-400' : score >= 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
  return <p className={`text-4xl font-bold ${color}`}>{score > 0 ? `+${score}` : score}</p>;
}

export default function NPSAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await request('/nps/analytics');
        setData(res);
      } catch {
        toast.error('Failed to load NPS analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">NPS Analytics</h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Net Promoter Score based on staff feedback surveys</p>
      </div>

      {loading ? (
        <TablePageSkeleton />
      ) : !data ? null : (
        <div className="space-y-4">
          {/* Score Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
              <CardBody className="p-4 text-center">
                <TrendingUp size={20} className="mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">NPS Score</p>
                <NpsGauge score={data?.npsScore ?? null} />
              </CardBody>
            </Card>
            <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
              <CardBody className="p-4 text-center">
                <Users size={20} className="mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Total Responses</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{data?.total ?? 0}</p>
              </CardBody>
            </Card>
            <Card shadow="sm" className="bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-800">
              <CardBody className="p-4 text-center">
                <ThumbsUp size={20} className="mx-auto mb-2 text-green-500" />
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">Promoters (9–10)</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">{data?.promoters ?? 0}</p>
              </CardBody>
            </Card>
            <Card shadow="sm" className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-800">
              <CardBody className="p-4 text-center">
                <ThumbsDown size={20} className="mx-auto mb-2 text-red-500" />
                <p className="text-xs text-red-600 dark:text-red-400 mb-1">Detractors (0–6)</p>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">{data?.detractors ?? 0}</p>
              </CardBody>
            </Card>
          </div>

          {/* Score distribution */}
          {(data?.total ?? 0) > 0 && (
            <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
              <CardBody className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-4">Score Distribution</h3>
                <div className="space-y-2">
                  {Array.from({ length: 11 }, (_, i) => 10 - i).map(score => {
                    const count = data?.distribution?.[score] || 0;
                    const pct = (data?.total ?? 0) > 0 ? (count / data.total) * 100 : 0;
                    const color = score >= 9 ? 'bg-green-400' : score >= 7 ? 'bg-yellow-400' : 'bg-red-400';
                    return (
                      <div key={score} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-zinc-400 w-4 text-right">{score}</span>
                        <div className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${color} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-zinc-400 w-6">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Recent Comments */}
          {data.comments?.length > 0 && (
            <Card shadow="sm" className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={16} className="text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Recent Comments</h3>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {data.comments.map((c, i) => (
                    <div key={i} className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                          c.category === 'promoter' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' :
                          c.category === 'passive' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' :
                          'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        }`}>
                          Score: {c.score}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-zinc-500">
                          {formatShortDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-zinc-300">{c.comment}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {(data?.total ?? 0) === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl">
              <TrendingUp size={40} className="mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
              <p className="text-gray-500 dark:text-zinc-400">No NPS survey responses yet</p>
              <p className="text-sm text-gray-400 dark:text-zinc-500 mt-1">Staff will be prompted to complete surveys periodically</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
