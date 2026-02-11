import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export default function AppLayout({ children, showHeader = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-display">
      {showHeader && (
        <header className="h-14 bg-white dark:bg-surface-dark border-b border-stone-200 dark:border-stone-800 flex items-center px-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center">
              <span className="material-icons-round text-white text-sm">restaurant_menu</span>
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">碰个头</span>
          </div>
        </header>
      )}
      <main className={showHeader ? 'min-h-[calc(100vh-3.5rem)]' : 'min-h-screen'}>
        {children}
      </main>
    </div>
  );
}
