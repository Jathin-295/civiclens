import { useContext } from 'react';
import { BarrierContext } from './BarrierContext';

export function useBarriers() {
  const context = useContext(BarrierContext);
  if (!context) {
    throw new Error('useBarriers must be used within a BarrierProvider');
  }
  return context;
}
