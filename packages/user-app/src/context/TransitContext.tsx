import React, { createContext, useContext, ReactNode } from 'react';
import { TransitSnapshot } from '@yara/shared';

interface TransitContextValue {
  data: TransitSnapshot | null;
  isConnected: boolean;
  error: string | null;
}

const TransitContext = createContext<TransitContextValue | null>(null);

interface TransitProviderProps {
  children: ReactNode;
}

export const TransitProvider: React.FC<TransitProviderProps> = ({ children }) => {
  // Phase 2: wire useTransitStream hook here
  const value: TransitContextValue = {
    data: null,
    isConnected: false,
    error: null,
  };

  return <TransitContext.Provider value={value}>{children}</TransitContext.Provider>;
};

export const useTransitContext = (): TransitContextValue => {
  const context = useContext(TransitContext);
  if (!context) {
    throw new Error('useTransitContext must be used within a TransitProvider');
  }
  return context;
};
