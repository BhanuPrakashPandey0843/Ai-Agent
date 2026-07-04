const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');

const exts = ['.js', '.jsx', '.ts', '.tsx'];
const root = 'd:/Final/app';
const files = [];

function walk(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (['node_modules', '.expo', 'dist', 'dist-dev', 'dist-test', 'dist-debug', 'dist-verify', 'dist-quiz-check', 'dist-quiz-verify', 'dist-firebase1071'].includes(item.name)) continue;
      walk(full);
    } else {
      for (const ext of exts) {
        if (item.name.endsWith(ext)) {
          files.push(full);
          break;
        }
      }
    }
  }
}

walk(root);
console.log(`Scanning ${files.length} files...`);
let had = false;
for (const file of files) {
  try {
    const code = fs.readFileSync(file, 'utf8');
    parse(code, { sourceType: 'module', plugins: ['jsx','typescript','classProperties','decorators-legacy'] });
  } catch (e) {
    had = true;
    console.error('ERROR in', file);
    console.error(e.message);
    if (e.loc) console.error('Line', e.loc.line, 'Col', e.loc.column);
  }
}
if (!had) console.log('No parse errors found.');
else process.exit(1);
