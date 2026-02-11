import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import {
  TASTE_OPTIONS,
  MAX_TASTE_COUNT,
  validateGatheringName,
  validateNickname,
  validateTastes,
  isValidInviteCode,
} from '@ontheway/shared';

export default function HomePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="bg-white dark:bg-surface-dark border-b border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-icons-round text-white">restaurant_menu</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">碰个头</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                你好，{user?.nickname ?? '用户'}
              </p>
            </div>
          </div>
          <Link
            to="/my-gatherings"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <span className="material-icons-round text-lg">history</span>
            我的聚会
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CreateGatheringCard />
          <JoinGatheringCard />
        </div>
      </div>
    </div>
  );
}

// ── Create Gathering Card ──

function CreateGatheringCard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [selectedTastes, setSelectedTastes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Default datetime-local value: 2 hours from now
  const defaultDateTime = useMemo(() => {
    const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  }, []);

  const toggleTaste = (taste: string) => {
    setSelectedTastes((prev) => {
      if (prev.includes(taste)) return prev.filter((t) => t !== taste);
      if (prev.length >= MAX_TASTE_COUNT) return prev;
      return [...prev, taste];
    });
  };

  const handleCreate = async () => {
    setError('');

    const nameResult = validateGatheringName(name);
    if (!nameResult.valid) {
      setError(nameResult.message ?? '聚会名称无效');
      return;
    }

    if (!targetTime) {
      setError('请选择聚会时间');
      return;
    }

    const selectedDate = new Date(targetTime);
    if (selectedDate.getTime() <= Date.now()) {
      setError('聚会时间需要在当前时间之后');
      return;
    }

    const tasteResult = validateTastes(selectedTastes);
    if (!tasteResult.valid) {
      setError(tasteResult.message ?? '口味选择无效');
      return;
    }

    setLoading(true);
    try {
      const { createGathering } = await import('@/services/api');
      const gathering = await createGathering({
        name: name.trim(),
        target_time: selectedDate.toISOString(),
        creator_nickname: user?.nickname ?? '用户',
        creator_tastes: selectedTastes,
      });
      navigate(`/dashboard/${gathering.code}`);
    } catch {
      setError('创建聚会失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
      {/* Header gradient bar */}
      <div className="h-1.5 bg-gradient-to-r from-primary to-teal-500" />

      <div className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-md shadow-primary/20">
            <span className="material-icons-round text-white">add_circle</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">创建聚会</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">发起一次新的聚餐</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Gathering name */}
          <div>
            <label htmlFor="gathering-name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              聚会名称
            </label>
            <input
              id="gathering-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：周五晚聚餐"
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
            />
          </div>

          {/* Target time */}
          <div>
            <label htmlFor="target-time" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              聚会时间
            </label>
            <input
              id="target-time"
              type="datetime-local"
              value={targetTime || defaultDateTime}
              onChange={(e) => setTargetTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
            />
          </div>

          {/* Taste selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              口味偏好
              <span className="text-xs text-slate-400 font-normal ml-2">
                {selectedTastes.length}/{MAX_TASTE_COUNT}
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TASTE_OPTIONS.map((taste) => {
                const selected = selectedTastes.includes(taste);
                return (
                  <button
                    key={taste}
                    onClick={() => toggleTaste(taste)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      selected
                        ? 'bg-primary text-white shadow-sm shadow-primary/30'
                        : 'bg-stone-100 dark:bg-stone-800 text-slate-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    } ${
                      !selected && selectedTastes.length >= MAX_TASTE_COUNT
                        ? 'opacity-40 cursor-not-allowed'
                        : ''
                    }`}
                    disabled={!selected && selectedTastes.length >= MAX_TASTE_COUNT}
                  >
                    {taste}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <span className="material-icons-round text-xs">error</span>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="material-icons-round animate-spin">progress_activity</span>
            ) : (
              <>
                <span className="material-icons-round text-lg">celebration</span>
                创建聚会
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Join Gathering Card ──

function JoinGatheringCard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [selectedTastes, setSelectedTastes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    setCode(raw);
  };

  const displayCode = code.length > 3 ? `${code.slice(0, 3)}-${code.slice(3)}` : code;

  const toggleTaste = (taste: string) => {
    setSelectedTastes((prev) => {
      if (prev.includes(taste)) return prev.filter((t) => t !== taste);
      if (prev.length >= MAX_TASTE_COUNT) return prev;
      return [...prev, taste];
    });
  };

  const handleJoin = async () => {
    setError('');

    if (!isValidInviteCode(code)) {
      setError('请输入有效的6位邀请码');
      return;
    }

    const nicknameResult = validateNickname(nickname);
    if (!nicknameResult.valid) {
      setError(nicknameResult.message ?? '昵称无效');
      return;
    }

    const tasteResult = validateTastes(selectedTastes);
    if (!tasteResult.valid) {
      setError(tasteResult.message ?? '口味选择无效');
      return;
    }

    setLoading(true);
    try {
      const { joinGathering } = await import('@/services/api');
      await joinGathering(code, {
        nickname: nickname.trim(),
        tastes: selectedTastes,
      });
      navigate(`/dashboard/${code}`);
    } catch {
      setError('加入聚会失败，请检查邀请码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
      {/* Header gradient bar */}
      <div className="h-1.5 bg-gradient-to-r from-teal-500 to-primary" />

      <div className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md shadow-teal-500/20">
            <span className="material-icons-round text-white">group_add</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">加入聚会</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">输入邀请码加入</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Invite code */}
          <div>
            <label htmlFor="invite-code" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              邀请码
            </label>
            <input
              id="invite-code"
              type="text"
              value={displayCode}
              onChange={handleCodeChange}
              placeholder="输入6位邀请码"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors text-sm font-mono text-center text-xl tracking-widest"
            />
          </div>

          {/* Nickname */}
          <div>
            <label htmlFor="join-nickname" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              你的昵称
            </label>
            <input
              id="join-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="输入你的昵称"
              maxLength={20}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors text-sm"
            />
          </div>

          {/* Taste selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              口味偏好
              <span className="text-xs text-slate-400 font-normal ml-2">
                {selectedTastes.length}/{MAX_TASTE_COUNT}
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TASTE_OPTIONS.map((taste) => {
                const selected = selectedTastes.includes(taste);
                return (
                  <button
                    key={taste}
                    onClick={() => toggleTaste(taste)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      selected
                        ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/30'
                        : 'bg-stone-100 dark:bg-stone-800 text-slate-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    } ${
                      !selected && selectedTastes.length >= MAX_TASTE_COUNT
                        ? 'opacity-40 cursor-not-allowed'
                        : ''
                    }`}
                    disabled={!selected && selectedTastes.length >= MAX_TASTE_COUNT}
                  >
                    {taste}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <span className="material-icons-round text-xs">error</span>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="material-icons-round animate-spin">progress_activity</span>
            ) : (
              <>
                <span className="material-icons-round text-lg">login</span>
                加入聚会
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
