const ts = require('typescript');
const fs = require('fs');
const path = require('path');
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) continue;
      files = files.concat(walk(p));
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      files.push(p);
    }
  }
  return files;
}
const root = process.cwd();
const files = walk(root);
let errors = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const ext = path.extname(file).toLowerCase();
  const scriptKind = ext === '.ts' ? ts.ScriptKind.TS : ext === '.tsx' ? ts.ScriptKind.TSX : ext === '.jsx' ? ts.ScriptKind.JSX : ts.ScriptKind.JS;
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, scriptKind);
  const diagnostics = sourceFile.parseDiagnostics;
  if (diagnostics.length) {
    errors.push({ file, diagnostics: diagnostics.map(d => ({ start: d.start, length: d.length, message: ts.flattenDiagnosticMessageText(d.messageText, '\n'), code: d.code })) });
  }
}
if (errors.length === 0) {
  console.log('NO_PARSE_ERRORS');
  process.exit(0);
}
for (const err of errors) {
  console.log('FILE', err.file);
  for (const d of err.diagnostics) {
    console.log('  ', d.code, d.message, 'start', d.start, 'len', d.length);
  }
}
process.exit(1);
