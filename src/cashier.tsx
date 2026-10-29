import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from './context/StoreContext';
import { CashierPortal } from './components/cashier/CashierPortal';
import './index.css';

function CashierApp() {
  return (
    <StoreProvider>
      <CashierPortal
        onSwitchToAdmin={() => {
          window.location.href = '/admin';
        }}
        onSwitchToStorefront={() => {
          window.location.href = '/customer';
        }}
      />
    </StoreProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CashierApp />
  </StrictMode>
);
