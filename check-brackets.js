const fs = require('fs');
const path = require('path');
const exts = ['.js', '.jsx', '.ts', '.tsx'];
const root = 'd:/Final';
const skipDirs = new Set(['node_modules', '.expo', 'dist', 'dist-dev', 'dist-debug', 'dist-test', 'dist-verify', 'dist-quiz-check', 'dist-quiz-verify', 'dist-firebase1071', '.git', 'android', 'ios']);
const files = [];
function walk(dir){
  let items;
  try{items=fs.readdirSync(dir,{withFileTypes:true});}catch(e){return}
  for(const item of items){
    const full=path.join(dir,item.name);
    if(item.isDirectory()){
      if(skipDirs.has(item.name)) continue;
      walk(full);
    } else {
      for(const ext of exts) if(item.name.endsWith(ext)) {files.push(full); break}
    }
  }
}
walk(root);
console.log('Checking', files.length, 'files');
let problems=0;
for(const f of files){
  const txt=fs.readFileSync(f,'utf8');
  const openSquare=(txt.match(/\[/g)||[]).length;
  const closeSquare=(txt.match(/\]/g)||[]).length;
  const openCurly=(txt.match(/\{/g)||[]).length;
  const closeCurly=(txt.match(/\}/g)||[]).length;
  const openParen=(txt.match(/\(/g)||[]).length;
  const closeParen=(txt.match(/\)/g)||[]).length;
  if(openSquare!==closeSquare || openCurly!==closeCurly || openParen!==closeParen){
    console.log('MISMATCH in', f);
    console.log(' square',openSquare,closeSquare,' curly',openCurly,closeCurly,' paren',openParen,closeParen);
    problems++;
  }
}
console.log('Done. Problems:', problems);
process.exit(0);
