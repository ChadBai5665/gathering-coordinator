import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '@/router';
import { ToastContainer } from '@/components/ui';
import { useToast } from '@/hooks/useToast';

function AppContent() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <AppRoutes />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
