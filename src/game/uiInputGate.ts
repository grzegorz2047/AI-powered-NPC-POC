export const GAME_UI_INPUT_BLOCK_EVENT = 'hotel-nocturne:ui-input-block';

const blockers = new Set<string>();

export function setGameInputBlocker(reason: string, blocked: boolean) {
  if (blocked) blockers.add(reason);
  else blockers.delete(reason);

  const isBlocked = blockers.size > 0;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(GAME_UI_INPUT_BLOCK_EVENT, {
      detail: { blocked: isBlocked },
    }));
  }
  return isBlocked;
}

export function isGameInputBlocked() {
  return blockers.size > 0;
}

export function subscribeGameInputBlocked(listener: (blocked: boolean) => void) {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ blocked?: boolean }>).detail;
    listener(Boolean(detail?.blocked));
  };

  window.addEventListener(GAME_UI_INPUT_BLOCK_EVENT, handler);
  listener(isGameInputBlocked());
  return () => window.removeEventListener(GAME_UI_INPUT_BLOCK_EVENT, handler);
}
