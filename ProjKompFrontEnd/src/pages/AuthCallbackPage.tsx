import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      console.error('OAuth callback error:', error);
      // Redirect to login with error message
      setTimeout(() => {
        navigate(`/login?error=${encodeURIComponent(error)}`);
      }, 3000);
    } else {
      // Refresh session from auth context to sync user data
      const handleSessionRefresh = async () => {
        try {
          await refreshSession();
          console.log('✅ Session refreshed after OAuth callback');
          // Navigate to home - ProtectedRoute will handle the rest
          navigate('/');
        } catch (err) {
          console.error('Session refresh failed:', err);
          setTimeout(() => {
            navigate('/login?error=session_failed');
          }, 1500);
        }
      };
      
      // Wait a bit for cookies to be set, then refresh
      setTimeout(handleSessionRefresh, 300);
    }
  }, [error, navigate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '20px' }}>
      {error ? (
        <>
          <Message severity="error" text={`Błąd logowania: ${error}`} />
          <p>Przekierowanie na stronę logowania...</p>
        </>
      ) : (
        <>
          <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
          <p>Przetwarzanie logowania...</p>
        </>
      )}
    </div>
  );
};
