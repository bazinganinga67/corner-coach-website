// Preview launcher used by ../.claude/launch.json (Documents-level sessions).
// Vite must run with cwd = this project's root so Tailwind's relative content
// globs resolve; the preview harness can't set cwd, so this shim does.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(projectRoot);
process.argv = [process.argv[0], 'vite', '--port', '5199', '--strictPort'];
await import('file:///' + join(projectRoot, 'node_modules/vite/bin/vite.js').replaceAll('\\', '/'));
