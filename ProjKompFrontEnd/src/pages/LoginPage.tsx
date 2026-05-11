import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Button } from 'primereact/button';
import { motion } from 'framer-motion';
import '../styles/LoginPage.css';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();

  const handleMicrosoftLogin = () => {
    login();
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <motion.div
          className="login-box"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="login-header">
            <h1>WIRTUALNY PLAN ZAJĘĆ</h1>
            <p>Politechnika Łódzka</p>
          </div>

          <div className="login-content">
            <p className="login-subtitle">Zaloguj się, aby kontynuować</p>

            <Button
              label="Zaloguj się przez Microsoft"
              icon="pi pi-microsoft"
              onClick={handleMicrosoftLogin}
              loading={isLoading}
              disabled={isLoading}
              className="login-button microsoft-button"
              size="large"
            />

            <div className="login-divider">lub</div>

            <p className="login-info">
              Użyj swojego konta organizacyjnego (Microsoft/Entra ID) aby uzyskać dostęp do planu zajęć.
            </p>
          </div>

          <div className="login-footer">
            <p>
              Projekt kompetencyjny • Politechnika Łódzka
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
