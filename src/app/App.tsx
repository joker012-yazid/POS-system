import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ToastProvider, ToastHost } from '@/components/ToastHost';
import { ConfirmProvider } from '@/components/ConfirmDialog';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <AppRouter />
            <ToastHost />
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
