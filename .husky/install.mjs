import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

if (
  process.env.HUSKY !== '0' &&
  process.env.CI !== 'true' &&
  process.env.NODE_ENV !== 'production' &&
  existsSync('.git')
) {
  const require = createRequire(import.meta.url);
  let installed = true;
  try {
    require.resolve('husky');
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    installed = false;
  }
  if (installed) {
    const { default: install } = await import('husky');
    const error = install();
    if (error) throw new Error(error);
  }
}
