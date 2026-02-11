import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

/**
 * /join/:code 路由
 * 已登录 → 自动加入聚会并跳转 dashboard
 * 未登录 → 跳转登录页，登录后自动回来
 */
export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(true);

  useEffect(() => {
    if (!code) {
      navigate('/', { replace: true });
      return;
    }

    if (!isAuthenticated) {
      // 保存目标 code 到 sessionStorage，登录后自动跳回
      sessionStorage.setItem('pendingJoinCode', code);
      navigate('/login', { replace: true });
      return;
    }

    // 已登录，自动加入
    const doJoin = async () => {
      try {
        const { joinGathering } = await import('@/services/api');
        await joinGathering(code, {
          nickname: user?.nickname ?? '用户',
          tastes: user?.preferences?.default_tastes ?? [],
        });
        navigate(`/dashboard/${code}`, { replace: true });
      } catch (err: any) {
        // 如果已经是参与者，直接跳转
        if (err?.code === 'ERR_ALREADY_JOINED' || err?.message?.includes('已加入')) {
          navigate(`/dashboard/${code}`, { replace: true });
          return;
        }
        setError(err?.message || '加入聚会失败');
        setJoining(false);
      }
    };

    doJoin();
  }, [code, isAuthenticated, navigate, user]);

  if (joining) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <span className="material-icons-round text-5xl text-primary-500 animate-spin mb-4 block">progress_activity</span>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">正在加入聚会...</p>
          <p className="text-sm text-slate-500 mt-1">邀请码: {code}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <span className="material-icons-round text-5xl text-red-400 mb-4 block">error_outline</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">加入失败</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{error}</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}
