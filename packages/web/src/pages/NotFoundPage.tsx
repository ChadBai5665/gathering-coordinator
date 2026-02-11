import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="material-icons-round text-white text-4xl">explore_off</span>
        </div>
        <h1 className="text-6xl font-extrabold text-slate-900 dark:text-white mb-2">404</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">页面不存在</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary/30"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}
