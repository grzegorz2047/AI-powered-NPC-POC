import { describe, expect, it } from 'vitest';
import { formatRuntimeMs } from './runtimeDiagnostics';

describe('runtime diagnostics formatting', () => {
  it('renders unavailable timings explicitly', () => {
    expect(formatRuntimeMs(null)).toBe('—');
  });

  it('renders fast replies in milliseconds', () => {
    expect(formatRuntimeMs(87)).toBe('87 ms');
  });

  it('renders model initialization in seconds', () => {
    expect(formatRuntimeMs(2350)).toBe('2.4 s');
    expect(formatRuntimeMs(12_600)).toBe('13 s');
  });
});
