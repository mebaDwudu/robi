import React from 'react';
import { CustomerOrdersPage } from './CustomerOrdersPage';

interface CustomerOrdersViewProps {
  onOpenDedicatedPage?: () => void;
}

export const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = () => {
  return <CustomerOrdersPage isEmbedded={true} />;
};
