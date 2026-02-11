import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { validateNickname } from '@ontheway/shared';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const result = validateNickname(nickname);
    if (!result.valid) {
      setError(result.message ?? '昵称无效');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(nickname.trim());
      navigate('/');
    } catch {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Background decorative blurs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <div className="relative w-full max-w-sm">
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
              <span className="material-icons-round text-white text-3xl">restaurant_menu</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">碰个头</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">找到最佳聚餐地点</p>
          </div>

          {/* Nickname input */}
          <div className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                你的昵称
              </label>
              <div className="relative">
                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  person
                </span>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    if (error) setError('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="输入昵称开始使用"
                  maxLength={20}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>
              {error && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <span className="material-icons-round text-xs">error</span>
                  {error}
                </p>
              )}
            </div>

            <button
              onClick={handleLogin}
              disabled={loading || !nickname.trim()}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="material-icons-round animate-spin text-lg">progress_activity</span>
              ) : (
                <>
                  <span className="material-icons-round text-lg">rocket_launch</span>
                  快速开始
                </>
              )}
            </button>
          </div>

          {/* Footer hint */}
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
            无需注册，输入昵称即可开始
          </p>
        </div>
      </div>
    </div>
  );
}
