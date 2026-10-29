import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from './context/StoreContext';
import { CustomerStorefront } from './components/storefront/CustomerStorefront';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

function CustomerApp() {
  return (
    <ErrorBoundary fallbackTitle="Top Fruit & Veg Customer Storefront">
      <StoreProvider>
        <CustomerStorefront
          onSwitchToStaff={() => {
            try {
              window.location.href = '/admin';
            } catch {
              window.location.hash = '#/admin';
            }
          }}
        />
      </StoreProvider>
    </ErrorBoundary>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CustomerApp />
  </StrictMode>
);
