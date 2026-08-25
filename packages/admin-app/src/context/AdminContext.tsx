import React, { createContext, useContext, useState, useCallback } from 'react';
import { VehicleTelemetry } from '@yara/shared';

interface InjectHistoryEntry {
  id: string;
  vehicleId: string;
  type: 'delay' | 'gnss-dropout' | 'crowd-spike';
  payload: object;
  timestamp: number;
  response?: VehicleTelemetry;
}

interface AdminContextType {
  vehicles: VehicleTelemetry[];
  setVehicles: (vehicles: VehicleTelemetry[]) => void;
  selectedVehicleId: string | null;
  setSelectedVehicleId: (id: string | null) => void;
  injectHistory: InjectHistoryEntry[];
  addInjectEntry: (entry: Omit<InjectHistoryEntry, 'id' | 'timestamp'>) => void;
  clearInjectHistory: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<VehicleTelemetry[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [injectHistory, setInjectHistory] = useState<InjectHistoryEntry[]>([]);

  const addInjectEntry = useCallback((entry: Omit<InjectHistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: InjectHistoryEntry = {
      ...entry,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };
    setInjectHistory(prev => [newEntry, ...prev].slice(0, 50));
  }, []);

  const clearInjectHistory = useCallback(() => {
    setInjectHistory([]);
  }, []);

  return (
    <AdminContext.Provider
      value={{
        vehicles,
        setVehicles,
        selectedVehicleId,
        setSelectedVehicleId,
        injectHistory,
        addInjectEntry,
        clearInjectHistory,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};
