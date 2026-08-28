import { useEffect } from 'react';
import { setGameInputBlocker } from './uiInputGate';

export function useGameInputBlocker(reason: string, blocked: boolean) {
  useEffect(() => {
    setGameInputBlocker(reason, blocked);
    return () => {
      setGameInputBlocker(reason, false);
    };
  }, [reason, blocked]);
}
