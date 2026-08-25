import React, { createContext, useContext, ReactNode } from 'react';
import { TransitSnapshot, useTransitStream } from '@yara/shared';

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
  const { data, isConnected, error } = useTransitStream();
  const value: TransitContextValue = {
    data,
    isConnected,
    error,
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

export const useTransit = useTransitContext;
