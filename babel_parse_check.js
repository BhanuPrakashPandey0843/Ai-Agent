const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const root = process.cwd();
const ignored = new Set(['node_modules', '.git', '.expo', 'dist', 'dist-dev', 'dist-test', 'dist-debug', 'dist-verify', 'dist-firebase1071', 'build']);
function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignored.has(entry.name)) results.push(...walk(full));
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const files = walk(root);
let errors = 0;
for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  const ext = path.extname(file).toLowerCase();
  const plugins = ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator', 'decorators-legacy', 'dynamicImport'];
  if (ext === '.ts' || ext === '.tsx') plugins.push('typescript');
  if (ext === '.tsx' && !plugins.includes('jsx')) plugins.push('jsx');
  try {
    parser.parse(code, { sourceType: 'module', plugins, allowReturnOutsideFunction: true });
  } catch (e) {
    errors++;
    console.log('FILE', file);
    console.log(e.message);
    console.log('---');
  }
}
console.log('TOTAL ERRORS', errors);
process.exit(errors ? 1 : 0);
