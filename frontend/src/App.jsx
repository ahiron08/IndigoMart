import { BrowserRouter } from 'react-router-dom';

import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import AppRoutes from '@/routes/AppRoutes.jsx';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
