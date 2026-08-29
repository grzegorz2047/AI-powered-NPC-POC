export const GAME_AUDIO = {
  rain: { key: 'audio-rain', url: '/audio/rain-loop.wav', loop: true, volume: 0.12 },
  hotelHum: { key: 'audio-hotel-hum', url: '/audio/hotel-hum-loop.wav', loop: true, volume: 0.07 },
  thunder: { key: 'audio-thunder', url: '/audio/thunder.wav', loop: false, volume: 0.18 },
  cardClick: { key: 'audio-card-click', url: '/audio/card-click.wav', loop: false, volume: 0.38 },
  evidence: { key: 'audio-evidence', url: '/audio/evidence-sting.wav', loop: false, volume: 0.3 },
  contradiction: { key: 'audio-contradiction', url: '/audio/contradiction-sting.wav', loop: false, volume: 0.34 },
} as const;

export type GameAudioName = keyof typeof GAME_AUDIO;

export function audioForNewClue(clueId: string): GameAudioName[] {
  return clueId === 'keycard-log' ? ['cardClick', 'evidence'] : ['evidence'];
}

export function totalContradictions(progress: Record<string, { contradictionIds?: string[]; contradictions?: number }>) {
  return Object.values(progress).reduce((sum, item) => sum + (item.contradictionIds?.length ?? item.contradictions ?? 0), 0);
}
