import React from 'react';
import { useAuth } from './AuthContext';
import { ProgressSpinner } from 'primereact/progressspinner';

type OptionalAuthRouteProps = {
  children: React.ReactNode;
};

export const ProtectedRoute: React.FC<OptionalAuthRouteProps> = ({ children }) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
      </div>
    );
  }

  // Allow access both for authenticated and anonymous users
  return <>{children}</>;
};
