import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GatheringStatus, formatInviteCode } from '@ontheway/shared';
import type { Gathering } from '@ontheway/shared';

type StatusFilter = 'all' | 'active' | 'completed';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

function getStatusBadge(status: string) {
  switch (status) {
    case GatheringStatus.WAITING:
      return { label: '等待中', className: 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300' };
    case GatheringStatus.NOMINATING:
      return { label: '提名中', className: 'bg-primary/10 text-primary' };
    case GatheringStatus.VOTING:
      return { label: '投票中', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' };
    case GatheringStatus.CONFIRMED:
      return { label: '已确认', className: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' };
    case GatheringStatus.DEPARTING:
      return { label: '出发中', className: 'bg-primary/10 text-primary' };
    case GatheringStatus.COMPLETED:
      return { label: '已完成', className: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' };
    default:
      return { label: status, className: 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300' };
  }
}

function isActiveStatus(status: string): boolean {
  return ([
    GatheringStatus.WAITING,
    GatheringStatus.NOMINATING,
    GatheringStatus.VOTING,
    GatheringStatus.CONFIRMED,
    GatheringStatus.DEPARTING,
  ] as string[]).includes(status);
}

export default function MyGatheringsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [gatherings, setGatherings] = useState<Gathering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGatherings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { getMyGatherings } = await import('@/services/api');
      const data = await getMyGatherings();
      setGatherings(data.gatherings);
    } catch {
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGatherings();
  }, [fetchGatherings]);

  const filtered = gatherings.filter((g) => {
    if (filter === 'all') return true;
    if (filter === 'active') return isActiveStatus(g.status);
    if (filter === 'completed') return g.status === GatheringStatus.COMPLETED;
    return true;
  });

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="bg-white dark:bg-surface-dark border-b border-stone-200 dark:border-stone-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-slate-500 dark:text-slate-400"
          >
            <span className="material-icons-round">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">我的聚会</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                filter === tab.key
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'bg-stone-100 dark:bg-stone-800 text-slate-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-surface-dark rounded-xl border border-stone-200 dark:border-stone-800 p-5 animate-pulse"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded w-40" />
                  <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded-full w-16" />
                </div>
                <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-24 mb-2" />
                <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-32" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <span className="material-icons-round text-4xl text-red-400 mb-2 block">error_outline</span>
            <p className="text-slate-500 dark:text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchGatherings}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold text-sm hover:bg-primary-700 transition-colors"
            >
              重试
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <span className="material-icons-round text-3xl text-stone-400">event_busy</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-2">
              {filter === 'all' ? '还没有聚会' : '没有符合条件的聚会'}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:underline mt-2"
            >
              <span className="material-icons-round text-lg">add_circle</span>
              创建一个新聚会
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((gathering) => {
              const badge = getStatusBadge(gathering.status);
              return (
                <button
                  key={gathering.id}
                  onClick={() => navigate(`/dashboard/${gathering.code}`)}
                  className="w-full text-left bg-white dark:bg-surface-dark rounded-xl border border-stone-200 dark:border-stone-800 p-5 hover:shadow-md hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate pr-3">
                      {gathering.name}
                    </h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="material-icons-round text-sm">tag</span>
                      <span className="font-mono">{formatInviteCode(gathering.code)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-icons-round text-sm">schedule</span>
                      {formatDate(gathering.target_time)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-icons-round text-sm">people</span>
                      {/* v2: participant_count 由详情接口提供 */}
                      人数见详情
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
