export type MatchMediaLike = (query: string) => Pick<MediaQueryList, 'matches'>;

export function prefersReducedMotion(matchMedia?: MatchMediaLike) {
  const resolveMatchMedia = matchMedia ?? (typeof globalThis.matchMedia === 'function' ? globalThis.matchMedia.bind(globalThis) : undefined);
  return resolveMatchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
