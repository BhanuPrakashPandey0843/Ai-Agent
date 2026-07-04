const fs=require('fs');const path=require('path');
const exts=['.js','.jsx','.ts','.tsx','.json','.mjs','.cjs'];
const root='d:/Final';
const files=[];
function walk(dir){
  let items;try{items=fs.readdirSync(dir,{withFileTypes:true});}catch(e){return}
  for(const item of items){
    const full=path.join(dir,item.name);
    if(item.isDirectory()){walk(full);} else {for(const ext of exts) if(item.name.endsWith(ext)){files.push(full);break}}
  }
}
walk(root);
console.log('Scanning',files.length,'files');
let problems=0;
for(const f of files){
  const buf=fs.readFileSync(f);
  for(let i=0;i<buf.length;i++){
    const b=buf[i];
    if(b===0){console.log('NULL byte in',f); problems++; break}
  }
}
console.log('Done. problems',problems);
