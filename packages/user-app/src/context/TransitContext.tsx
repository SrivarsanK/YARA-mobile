import React, { createContext, useContext, ReactNode } from 'react';
import { TransitSnapshot, useTransitStream } from '@yara/shared';

export interface TransitContextValue {
  data: TransitSnapshot | null;
  isConnected: boolean;
  error: string | null;
  isMockFallback: boolean;
  reconnectAttempts: number;
}

const TransitContext = createContext<TransitContextValue | null>(null);

interface TransitProviderProps {
  children: ReactNode;
}

export const TransitProvider: React.FC<TransitProviderProps> = ({ children }) => {
  const { data, isConnected, error, isMockFallback, reconnectAttempts } = useTransitStream();

  const value: TransitContextValue = {
    data,
    isConnected,
    error,
    isMockFallback,
    reconnectAttempts,
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
