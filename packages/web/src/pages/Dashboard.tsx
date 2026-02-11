import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGatheringStore } from '@/stores/gathering.store';
import { useAuthStore } from '@/stores/auth.store';
import { useLocation as useGeoLocation } from '@/hooks/useLocation';
import {
  GatheringStatus,
  ParticipantStatus,
  MessageType,
  VoteStatus,
  formatCountdown,
  formatDuration,
  formatTime,
  getTimeRemaining,
  formatInviteCode,
} from '@ontheway/shared';
import type {
  Participant,
  Restaurant,
  VoteDetail,
  Message,
  GatheringDetail,
} from '@ontheway/shared';

// ══════════════════════════════════════════════
//  Main Page Component
// ══════════════════════════════════════════════

export function DashboardPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const {
    currentGathering,
    participants,
    restaurants,
    activeVote,
    messages,
    isLoading,
    fetchGathering,
    startPolling,
    stopPolling,
  } = useGatheringStore();

  // 自动请求位置
  const { location: _userLocation } = useGeoLocation(true);

  useEffect(() => {
    if (!code) {
      navigate('/');
      return;
    }
    fetchGathering(code);
    startPolling(code);
    return () => stopPolling();
  }, [code, fetchGathering, startPolling, stopPolling, navigate]);

  if (isLoading && !currentGathering) {
    return <DashboardSkeleton />;
  }

  if (!currentGathering) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
        <div className="text-center">
          <span className="material-icons-round text-4xl text-stone-400 mb-2 block">search_off</span>
          <p className="text-slate-500 dark:text-slate-400 mb-4">未找到聚会</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 h-screen overflow-hidden flex font-display">
      {/* Left Sidebar */}
      <Sidebar gathering={currentGathering} participants={participants} />

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden relative flex flex-col">
        {/* Decorative blurs */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-teal-100/50 dark:bg-teal-900/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-primary/10 rounded-full blur-3xl -z-10 -translate-x-1/4 translate-y-1/4" />

        <div className="flex-1 overflow-y-auto">
          {/* AI Recommendations */}
          {(currentGathering.status === GatheringStatus.WAITING ||
            currentGathering.status === GatheringStatus.RECOMMENDING) && (
            <RecommendationsSection
              code={code!}
              restaurants={restaurants}
              participants={participants}
              gatheringStatus={currentGathering.status}
            />
          )}

          {/* Voting Section */}
          {currentGathering.status === GatheringStatus.VOTING && activeVote && (
            <VotingSection code={code!} vote={activeVote} restaurants={restaurants} />
          )}

          {/* Confirmed Section */}
          {(currentGathering.status === GatheringStatus.CONFIRMED ||
            currentGathering.status === GatheringStatus.ACTIVE) && (
            <ConfirmedSection restaurants={restaurants} participants={participants} />
          )}

          {/* Countdown Divider */}
          <CountdownDivider targetTime={currentGathering.target_time} />

          {/* Map Section */}
          <MapSection restaurants={restaurants} participants={participants} />

          {/* Action Bar */}
          <ActionBar code={code!} participants={participants} gatheringStatus={currentGathering.status} />

          {/* Message Feed */}
          <MessageFeed messages={messages} />
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;

// ══════════════════════════════════════════════
//  Utilities
// ══════════════════════════════════════════════

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue}, 55%, 50%)`;
}

function getParticipantStatusConfig(p: Participant) {
  switch (p.status) {
    case ParticipantStatus.ARRIVED:
      return {
        ringColor: 'ring-teal-500 dark:ring-teal-600',
        badge: 'check' as string | null,
        badgeBg: 'bg-teal-500',
        textColor: 'text-teal-600 dark:text-teal-400',
        label: '已到达',
        animate: false,
      };
    case ParticipantStatus.DEPARTED:
      return {
        ringColor: 'ring-primary dark:ring-primary',
        badge: (p.travel_duration && p.travel_duration > 1800 ? 'directions_car' : 'directions_run') as string | null,
        badgeBg: 'bg-primary',
        textColor: 'text-primary',
        label: p.travel_duration ? `途中 (${formatDuration(p.travel_duration)})` : '已出发',
        animate: true,
      };
    default:
      return {
        ringColor: 'ring-stone-200 dark:ring-stone-700',
        badge: null as string | null,
        badgeBg: '',
        textColor: 'text-stone-500',
        label: '未出发',
        animate: false,
      };
  }
}

function getMessageConfig(type: string) {
  switch (type) {
    case MessageType.REMINDER:
      return { icon: 'notifications', bgColor: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-500' };
    case MessageType.URGENT:
      return { icon: 'priority_high', bgColor: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-500' };
    case MessageType.MILESTONE:
      return { icon: 'emoji_events', bgColor: 'bg-teal-100 dark:bg-teal-900/30', iconColor: 'text-teal-500' };
    case MessageType.JOIN:
      return { icon: 'person_add', bgColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-500' };
    case MessageType.DEPART:
      return { icon: 'directions_car', bgColor: 'bg-primary/10', iconColor: 'text-primary' };
    case MessageType.ARRIVE:
      return { icon: 'place', bgColor: 'bg-teal-100 dark:bg-teal-900/30', iconColor: 'text-teal-500' };
    case MessageType.VOTE:
      return { icon: 'how_to_vote', bgColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-500' };
    case MessageType.VOTE_RESULT:
      return { icon: 'ballot', bgColor: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-500' };
    case MessageType.RESTAURANT_CONFIRMED:
      return { icon: 'restaurant', bgColor: 'bg-teal-100 dark:bg-teal-900/30', iconColor: 'text-teal-500' };
    default:
      return { icon: 'info', bgColor: 'bg-stone-100 dark:bg-stone-800', iconColor: 'text-stone-500' };
  }
}

// ══════════════════════════════════════════════
//  Sidebar
// ══════════════════════════════════════════════

function Sidebar({
  gathering,
  participants,
}: {
  gathering: GatheringDetail;
  participants: Participant[];
}) {
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);

  const targetDate = new Date(gathering.target_time);
  const dateStr = `${targetDate.getMonth() + 1}月${targetDate.getDate()}日`;
  const timeStr = formatTime(gathering.target_time);
  const [countdown, setCountdown] = useState(() => getTimeRemaining(gathering.target_time));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeRemaining(gathering.target_time));
    }, 10_000);
    return () => clearInterval(timer);
  }, [gathering.target_time]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(gathering.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const arrivedCount = participants.filter((p) => p.status === ParticipantStatus.ARRIVED).length;

  return (
    <aside className="hidden lg:flex w-80 h-full bg-white dark:bg-surface-dark flex-col border-r border-stone-200 dark:border-stone-800 relative shadow-xl z-20 shrink-0 overflow-y-auto">
      {/* Top gradient bar */}
      <div className="sticky top-0 z-10 w-full h-2 bg-gradient-to-r from-primary to-teal-500" />

      <div className="p-8 pb-0 flex flex-col gap-6">
        {/* Gathering header */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-primary">
            <span className="material-icons-round">restaurant_menu</span>
            <span className="font-bold tracking-wider uppercase text-xs">Gathering Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {gathering.name}
          </h1>
          <div className="mt-4 flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="material-icons-round text-lg">calendar_today</span>
            <span className="font-medium">{dateStr}</span>
          </div>
        </div>

        {/* Meeting time card */}
        <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-5 border border-stone-100 dark:border-stone-700">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-1">聚会时间</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-slate-800 dark:text-white">{timeStr}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-medium bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-full w-fit">
            <span className="material-icons-round text-xs">schedule</span>
            <span>{formatCountdown(countdown)}</span>
          </div>
        </div>

        {/* Invite code card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-teal-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
          <div className="relative bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700 flex flex-col items-center text-center">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">邀请码</p>
            <div className="text-2xl font-mono font-bold tracking-widest text-slate-800 dark:text-white mb-2">
              {formatInviteCode(gathering.code)}
            </div>
            <button
              onClick={handleCopy}
              className="w-full py-1.5 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-icons-round text-xs">{copied ? 'check' : 'content_copy'}</span>
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>
      </div>

      {/* Participants section */}
      <div className="px-8 py-6 flex-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
          <span>参与者</span>
          <span className="bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-xs py-0.5 px-2 rounded-full">
            {arrivedCount}/{participants.length}
          </span>
        </h3>
        <div className="flex flex-col gap-3">
          {participants.map((p) => (
            <ParticipantRow key={p.id} participant={p} />
          ))}
        </div>
      </div>

      {/* Current user footer */}
      <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 mt-auto sticky bottom-0 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white dark:border-stone-700 shadow-sm"
            style={{ backgroundColor: stringToColor(user?.nickname ?? '?') }}
          >
            {user?.nickname?.charAt(0) ?? '?'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user?.nickname ?? '用户'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.id === gathering.creator_id ? '创建者' : '参与者'}
            </p>
          </div>
          <button className="ml-auto text-slate-400 hover:text-primary transition-colors">
            <span className="material-icons-round">settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

// ══════════════════════════════════════════════
//  Participant Row
// ══════════════════════════════════════════════

function ParticipantRow({ participant }: { participant: Participant }) {
  const cfg = getParticipantStatusConfig(participant);

  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors ${
      participant.status === ParticipantStatus.JOINED ? 'opacity-75' : ''
    }`}>
      <div className="relative">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white ring-2 ${cfg.ringColor} ${
            participant.status === ParticipantStatus.JOINED ? 'grayscale' : ''
          }`}
          style={{ backgroundColor: stringToColor(participant.nickname) }}
        >
          {participant.nickname.charAt(0)}
        </div>
        {cfg.badge && (
          <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border-2 border-white dark:border-stone-800 ${cfg.badgeBg} text-white ${
            cfg.animate ? 'animate-pulse' : ''
          }`}>
            <span className="material-icons-round text-[8px] block">{cfg.badge}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{participant.nickname}</p>
        <p className={`text-xs ${cfg.textColor}`}>{cfg.label}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  Recommendations Section
// ══════════════════════════════════════════════

function RecommendationsSection({
  code,
  restaurants,
  participants,
  gatheringStatus,
}: {
  code: string;
  restaurants: Restaurant[];
  participants: Participant[];
  gatheringStatus: string;
}) {
  const { recommend, startVote } = useGatheringStore();
  const [recommending, setRecommending] = useState(false);

  const tasteSummary = useMemo(() => {
    const tasteMap = new Map<string, number>();
    participants.forEach((p) => {
      p.tastes.forEach((t) => tasteMap.set(t, (tasteMap.get(t) ?? 0) + 1));
    });
    return Array.from(tasteMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([taste]) => taste);
  }, [participants]);

  const handleRecommend = async () => {
    setRecommending(true);
    try {
      await recommend(code);
    } finally {
      setRecommending(false);
    }
  };

  const handleStartVote = (index: number) => {
    startVote(code, index);
  };

  return (
    <section className="p-8 pb-4 shrink-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="material-icons-round text-white">auto_awesome</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI 推荐</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              综合口味偏好：
              {tasteSummary.map((t, i) => (
                <span
                  key={t}
                  className={i % 2 === 0 ? 'text-primary font-medium' : 'text-teal-600 dark:text-teal-400 font-medium'}
                >
                  {i > 0 && ' / '}{t}
                </span>
              ))}
              {tasteSummary.length === 0 && <span className="text-stone-400">暂无</span>}
            </p>
          </div>
        </div>
      </div>

      {restaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant, index) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              participants={participants}
              isTopMatch={index === 0}
              onStartVote={() => handleStartVote(index)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
            <span className="material-icons-round text-3xl text-stone-400">restaurant</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {gatheringStatus === GatheringStatus.RECOMMENDING
              ? '正在为你寻找最佳餐厅...'
              : '点击下方按钮获取AI推荐'}
          </p>
          <button
            onClick={handleRecommend}
            disabled={recommending || gatheringStatus === GatheringStatus.RECOMMENDING}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/30 disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {recommending || gatheringStatus === GatheringStatus.RECOMMENDING ? (
              <>
                <span className="material-icons-round animate-spin">progress_activity</span>
                推荐中...
              </>
            ) : (
              <>
                <span className="material-icons-round">auto_awesome</span>
                获取推荐
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════
//  Restaurant Card
// ══════════════════════════════════════════════

function RestaurantCard({
  restaurant,
  participants,
  isTopMatch,
  onStartVote,
}: {
  restaurant: Restaurant;
  participants: Participant[];
  isTopMatch: boolean;
  onStartVote: () => void;
}) {
  const priceLevel = restaurant.cost
    ? restaurant.cost <= 30
      ? '\u00A5'
      : restaurant.cost <= 80
      ? '\u00A5\u00A5'
      : '\u00A5\u00A5\u00A5'
    : '';

  return (
    <div className={`bg-white dark:bg-surface-dark rounded-2xl p-3 transition-all duration-300 border group ${
      isTopMatch
        ? 'shadow-lg ring-2 ring-primary ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark -translate-y-1 border-transparent'
        : 'shadow-sm hover:shadow-xl hover:-translate-y-1 border-stone-100 dark:border-stone-800'
    }`}>
      {/* Image placeholder */}
      <div className="relative h-32 rounded-xl overflow-hidden mb-3">
        <div className={`w-full h-full ${
          isTopMatch
            ? 'bg-gradient-to-br from-primary/30 to-teal-500/30'
            : 'bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-700 dark:to-stone-800'
        } flex items-center justify-center group-hover:scale-105 transition-transform duration-500`}>
          <span className="material-icons-round text-4xl text-white/60">restaurant</span>
        </div>

        {/* Rating badge */}
        {restaurant.rating != null && (
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm ${
            isTopMatch
              ? 'bg-primary text-white'
              : 'bg-white/90 dark:bg-black/80 backdrop-blur-sm'
          }`}>
            <span className={`material-icons-round text-sm ${isTopMatch ? 'text-white' : 'text-primary'}`}>star</span>
            <span className="text-xs font-bold">{restaurant.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Top match label */}
        {isTopMatch && (
          <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm z-20">
            <span className="material-icons-round text-xs">recommend</span>
            <span className="text-[10px] font-bold">最佳推荐</span>
          </div>
        )}
      </div>

      <div className="px-2">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-white">{restaurant.name}</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {restaurant.type}{priceLevel && ` \u00B7 ${priceLevel}`}
            </p>
          </div>
          {restaurant.score > 0 && (
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {restaurant.score.toFixed(0)}分
            </span>
          )}
        </div>

        {/* Travel info */}
        {restaurant.travel_infos.length > 0 && (
          <div className="mt-2 mb-2 space-y-1">
            {restaurant.travel_infos.slice(0, 3).map((info) => {
              const participant = participants.find((p) => p.id === info.participant_id);
              return (
                <div key={info.participant_id} className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 dark:text-slate-400 truncate">{participant?.nickname ?? '参与者'}</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{formatDuration(info.duration)}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Action button */}
        {restaurant.is_confirmed ? (
          <button className="w-full mt-2 py-2 rounded-lg bg-primary text-white font-bold text-xs shadow-lg shadow-primary/30 flex items-center justify-center gap-2 cursor-default">
            <span className="material-icons-round text-xs">check_circle</span>
            已选择
          </button>
        ) : (
          <button
            onClick={onStartVote}
            className="w-full mt-2 py-2 rounded-lg bg-slate-100 dark:bg-stone-700 hover:bg-slate-200 dark:hover:bg-stone-600 text-slate-600 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            发起投票
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  Voting Section
// ══════════════════════════════════════════════

function VotingSection({
  code,
  vote,
  restaurants,
}: {
  code: string;
  vote: VoteDetail;
  restaurants: Restaurant[];
}) {
  const { castVote: castVoteAction } = useGatheringStore();
  const [voting, setVoting] = useState(false);

  const restaurant = restaurants[vote.restaurant_index];
  const totalParticipants = vote.total_voters || 1;
  const agreePercent = Math.round((vote.agree_count / totalParticipants) * 100);
  const disagreePercent = Math.round((vote.disagree_count / totalParticipants) * 100);

  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(vote.timeout_at));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(vote.timeout_at));
    }, 1000);
    return () => clearInterval(timer);
  }, [vote.timeout_at]);

  const handleVote = async (agree: boolean) => {
    setVoting(true);
    try {
      await castVoteAction(code, vote.id, agree);
    } finally {
      setVoting(false);
    }
  };

  const timeoutSeconds = Math.ceil(timeLeft / 1000);

  return (
    <section className="p-8 pb-4 shrink-0">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <span className="material-icons-round text-white">how_to_vote</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">投票进行中</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            为 <span className="text-primary font-medium">{restaurant?.name ?? '餐厅'}</span> 投票
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
        {/* Restaurant info */}
        {restaurant && (
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/30 to-teal-500/30 flex items-center justify-center shrink-0">
              <span className="material-icons-round text-2xl text-primary">restaurant</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{restaurant.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {restaurant.type}
                {restaurant.address && ` \u00B7 ${restaurant.address}`}
              </p>
              {restaurant.rating != null && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="material-icons-round text-primary text-sm">star</span>
                  <span className="text-sm font-bold">{restaurant.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeout progress */}
        <div className="flex items-center gap-2 mb-4 text-xs">
          <span className="material-icons-round text-sm text-stone-400">timer</span>
          <span className="text-stone-500 dark:text-stone-400">
            剩余 <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{timeoutSeconds}</span> 秒
          </span>
          <div className="flex-1 h-1.5 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden ml-2">
            <div
              className="h-full bg-gradient-to-r from-primary to-teal-500 rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(0, (timeLeft / 120000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Vote counts */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{vote.agree_count}</p>
            <p className="text-xs text-teal-600/70 dark:text-teal-400/70 font-medium">同意 ({agreePercent}%)</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-500 dark:text-red-400">{vote.disagree_count}</p>
            <p className="text-xs text-red-500/70 dark:text-red-400/70 font-medium">反对 ({disagreePercent}%)</p>
          </div>
        </div>

        {/* Vote buttons / status */}
        {vote.has_voted ? (
          <div className="text-center py-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
            <span className="material-icons-round text-teal-500 text-lg align-middle mr-1">check_circle</span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">你已投票</span>
          </div>
        ) : vote.status !== VoteStatus.ACTIVE ? (
          <div className="text-center py-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              投票已{vote.status === VoteStatus.PASSED ? '通过' : '否决'}
            </span>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => handleVote(true)}
              disabled={voting}
              className="flex-1 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-icons-round">thumb_up</span>
              同意
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={voting}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-icons-round">thumb_down</span>
              反对
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════
//  Confirmed Restaurant Section
// ══════════════════════════════════════════════

function ConfirmedSection({
  restaurants,
  participants,
}: {
  restaurants: Restaurant[];
  participants: Participant[];
}) {
  const confirmed = restaurants.find((r) => r.is_confirmed);
  if (!confirmed) return null;

  return (
    <section className="p-8 pb-4 shrink-0">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
          <span className="material-icons-round text-white">celebration</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">餐厅已确认</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">准备出发吧</p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-2xl border-2 border-teal-500 p-6 shadow-lg shadow-teal-500/10">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500/30 to-teal-600/30 flex items-center justify-center shrink-0">
            <span className="material-icons-round text-2xl text-teal-500">restaurant</span>
          </div>
          <div>
            <h3 className="font-bold text-xl text-slate-900 dark:text-white">{confirmed.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {confirmed.type}
              {confirmed.address && ` \u00B7 ${confirmed.address}`}
            </p>
            <div className="flex items-center gap-3 mt-1">
              {confirmed.rating != null && (
                <span className="flex items-center gap-1 text-sm">
                  <span className="material-icons-round text-primary text-sm">star</span>
                  <span className="font-bold">{confirmed.rating.toFixed(1)}</span>
                </span>
              )}
              {confirmed.cost != null && (
                <span className="text-sm text-slate-500">人均 {confirmed.cost}元</span>
              )}
            </div>
          </div>
        </div>

        {/* Travel info per participant */}
        {confirmed.travel_infos.length > 0 && (
          <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-4 space-y-2">
            {confirmed.travel_infos.map((info) => {
              const participant = participants.find((p) => p.id === info.participant_id);
              return (
                <div key={info.participant_id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{participant?.nickname ?? '参与者'}</span>
                  <span className="text-slate-800 dark:text-white font-medium">{formatDuration(info.duration)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════
//  Countdown Divider
// ══════════════════════════════════════════════

function CountdownDivider({ targetTime }: { targetTime: string }) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(targetTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getTimeRemaining(targetTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetTime]);

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="px-8 py-2 shrink-0">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-stone-200 dark:border-stone-700" />
        </div>
        <div className="relative bg-background-light dark:bg-background-dark px-6 flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            距离聚会
          </span>
          <div className="font-mono text-xl font-bold text-primary tabular-nums tracking-tight">
            {remaining <= 0 ? '已到时间' : `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  Map Section (Placeholder)
// ═══════════════���══════════════════════════════

function MapSection({
  restaurants,
  participants,
}: {
  restaurants: Restaurant[];
  participants: Participant[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');

  const confirmed = restaurants.find((r) => r.is_confirmed);
  const departedOrArrived = participants.filter(
    (p) => p.status === ParticipantStatus.DEPARTED || p.status === ParticipantStatus.ARRIVED,
  );

  // 加载地图
  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        const { loadAMap } = await import('@/services/amap');
        await loadAMap();
        if (cancelled || !mapRef.current) return;

        const AMap = (window as any).AMap;
        const map = new AMap.Map(mapRef.current, {
          zoom: 13,
          center: confirmed?.location
            ? [confirmed.location.lng, confirmed.location.lat]
            : [116.397428, 39.90923], // 默认北京
          mapStyle: 'amap://styles/light',
        });

        mapInstanceRef.current = map;
        setMapReady(true);
      } catch {
        if (!cancelled) setMapError('地图加载失败');
      }
    }

    initMap();
    return () => { cancelled = true; };
  }, []);

  // 更新标记
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const AMap = (window as any).AMap;
    const map = mapInstanceRef.current;

    // 清除旧标记
    map.clearMap();

    const points: any[] = [];

    // 餐厅标记
    if (confirmed) {
      const marker = new AMap.Marker({
        position: [confirmed.location.lng, confirmed.location.lat],
        title: confirmed.name,
        content: `<div style="background:#f2930d;color:white;padding:6px;border-radius:50%;display:flex;align-items:center;justify-content:center;width:36px;height:36px;box-shadow:0 2px 8px rgba(242,147,13,0.4)"><span class="material-icons-round" style="font-size:20px">restaurant</span></div>`,
        offset: new AMap.Pixel(-18, -18),
      });
      map.add(marker);
      points.push([confirmed.location.lng, confirmed.location.lat]);

      // 信息窗体
      const infoWindow = new AMap.InfoWindow({
        content: `<div style="padding:8px;font-size:13px"><b>${confirmed.name}</b><br/>${confirmed.address || confirmed.type || ''}</div>`,
        offset: new AMap.Pixel(0, -24),
      });
      marker.on('click', () => infoWindow.open(map, marker.getPosition()));
    }

    // 所有有位置的餐厅（未确认的）
    restaurants.filter(r => !r.is_confirmed && r.location).forEach((r) => {
      const marker = new AMap.Marker({
        position: [r.location.lng, r.location.lat],
        title: r.name,
        content: `<div style="background:#0d94f2;color:white;padding:4px;border-radius:50%;display:flex;align-items:center;justify-content:center;width:28px;height:28px;box-shadow:0 2px 6px rgba(13,148,242,0.3)"><span class="material-icons-round" style="font-size:16px">restaurant</span></div>`,
        offset: new AMap.Pixel(-14, -14),
      });
      map.add(marker);
      points.push([r.location.lng, r.location.lat]);
    });

    // 参与者标记
    departedOrArrived.forEach((p) => {
      if (!p.location) return;
      const color = p.status === ParticipantStatus.ARRIVED ? '#14b8a6' : '#f2930d';
      const icon = p.status === ParticipantStatus.ARRIVED ? 'check_circle' : 'directions_car';
      const marker = new AMap.Marker({
        position: [p.location.lng, p.location.lat],
        title: p.nickname,
        content: `<div style="background:${color};color:white;padding:4px;border-radius:50%;display:flex;align-items:center;justify-content:center;width:32px;height:32px;box-shadow:0 2px 6px ${color}66;border:2px solid white"><span class="material-icons-round" style="font-size:18px">${icon}</span></div>`,
        offset: new AMap.Pixel(-16, -16),
      });
      map.add(marker);
      points.push([p.location.lng, p.location.lat]);
    });

    // 自适应视野
    if (points.length > 0) {
      map.setFitView(null, false, [60, 60, 60, 60]);
    }
  }, [mapReady, confirmed, restaurants, departedOrArrived]);

  return (
    <section className="flex-1 p-8 pt-4 min-h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">实时地图</h2>
        <div className="flex gap-2">
          <button
            onClick={() => mapInstanceRef.current?.setFitView(null, false, [60, 60, 60, 60])}
            className="bg-white dark:bg-surface-dark border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-2 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            <span className="material-icons-round text-sm">my_location</span>居中
          </button>
        </div>
      </div>

      <div className="relative w-full flex-1 min-h-[320px] rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 shadow-inner">
        <div ref={mapRef} className="absolute inset-0" />
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-100 dark:bg-stone-800">
            <div className="text-center">
              <span className="material-icons-round text-4xl text-stone-400 mb-2 block">map</span>
              <p className="text-sm text-stone-500">{mapError}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════
//  Action Bar
// ══════════════════════════════════════════════

function ActionBar({
  code,
  participants,
  gatheringStatus,
}: {
  code: string;
  participants: Participant[];
  gatheringStatus: string;
}) {
  const user = useAuthStore((s) => s.user);
  const { depart, arrive } = useGatheringStore();
  const [acting, setActing] = useState(false);

  const currentParticipant = participants.find((p) => p.user_id === user?.id);
  if (!currentParticipant) return null;

  if (
    gatheringStatus !== GatheringStatus.CONFIRMED &&
    gatheringStatus !== GatheringStatus.ACTIVE
  ) {
    return null;
  }

  const handleDepart = async () => {
    setActing(true);
    try {
      await depart(code);
    } finally {
      setActing(false);
    }
  };

  const handleArrive = async () => {
    setActing(true);
    try {
      await arrive(code);
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="px-8 py-4 shrink-0">
      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-sm">
        {currentParticipant.status === ParticipantStatus.JOINED && (
          <button
            onClick={handleDepart}
            disabled={acting}
            className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-700 text-white font-bold rounded-xl text-lg transition-all shadow-lg shadow-primary/30 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {acting ? (
              <span className="material-icons-round animate-spin">progress_activity</span>
            ) : (
              <>
                <span className="material-icons-round text-2xl">directions_car</span>
                我出发了
              </>
            )}
          </button>
        )}

        {currentParticipant.status === ParticipantStatus.DEPARTED && (
          <button
            onClick={handleArrive}
            disabled={acting}
            className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl text-lg transition-colors shadow-lg shadow-teal-500/30 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {acting ? (
              <span className="material-icons-round animate-spin">progress_activity</span>
            ) : (
              <>
                <span className="material-icons-round text-2xl">place</span>
                我到了
              </>
            )}
          </button>
        )}

        {currentParticipant.status === ParticipantStatus.ARRIVED && (
          <div className="flex items-center justify-center gap-2 py-4 text-teal-600 dark:text-teal-400">
            <span className="material-icons-round text-2xl">check_circle</span>
            <span className="font-bold text-lg">你已到达</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  Message Feed
// ══════════════════════════════════════════════

function MessageFeed({ messages }: { messages: Message[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <section className="px-8 pb-8 shrink-0">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
        <span className="material-icons-round text-sm">chat</span>
        消息动态
      </h3>
      <div
        ref={scrollRef}
        className="bg-white dark:bg-surface-dark rounded-xl border border-stone-200 dark:border-stone-800 max-h-48 overflow-y-auto"
      >
        <div className="p-4 space-y-3">
          {messages.map((msg) => {
            const config = getMessageConfig(msg.type);
            const time = new Date(msg.created_at);
            const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

            return (
              <div key={msg.id} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${config.bgColor}`}>
                  <span className={`material-icons-round text-xs ${config.iconColor}`}>{config.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{msg.text}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{timeStr}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════
//  Loading Skeleton
// ══════════════════════════════════════════════

function DashboardSkeleton() {
  return (
    <div className="bg-background-light dark:bg-background-dark h-screen overflow-hidden flex animate-pulse">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:block w-80 h-full bg-white dark:bg-surface-dark border-r border-stone-200 dark:border-stone-800 p-8">
        <div className="h-2 bg-gradient-to-r from-primary to-teal-500 rounded -mx-8 -mt-8 mb-6" />
        <div className="space-y-4">
          <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-24" />
          <div className="h-8 bg-stone-200 dark:bg-stone-700 rounded w-48" />
          <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-32" />
        </div>
        <div className="h-24 bg-stone-100 dark:bg-stone-800 rounded-xl mt-6" />
        <div className="h-20 bg-stone-100 dark:bg-stone-800 rounded-xl mt-4" />
        <div className="space-y-3 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-200 dark:bg-stone-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-24 mb-1" />
                <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </aside>
      {/* Main skeleton */}
      <main className="flex-1 p-8">
        <div className="space-y-6">
          <div className="h-8 bg-stone-200 dark:bg-stone-700 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-stone-200 dark:bg-stone-700 rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-stone-200 dark:bg-stone-700 rounded-2xl" />
        </div>
      </main>
    </div>
  );
}
