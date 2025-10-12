// context/DashboardContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

type DashboardContextType = {
  refreshDashboard: () => void;
  setRefreshDashboard: (callback: () => void) => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshCallback, setRefreshCallback] = useState<() => void>(() => () => {});

  const setRefreshDashboard = (callback: () => void) => {
    setRefreshCallback(() => callback);
  };

  const refreshDashboard = useCallback(() => {
    refreshCallback();
  }, [refreshCallback]);

  return (
    <DashboardContext.Provider value={{ refreshDashboard, setRefreshDashboard }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
