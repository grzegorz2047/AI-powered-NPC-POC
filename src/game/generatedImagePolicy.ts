export const GENERATED_IMAGE_POLICY = {
  source: 'original project-specific image generation',
  format: 'webp',
  alpha: true,
  lazyWithPhaser: true,
  fallback: 'authored SVG assets remain available until generated crops are validated on Vercel',
} as const;
