const fs=require('fs');const path=require('path');
const root='d:/Final';
const files=[];
function walk(dir){
  let items;try{items=fs.readdirSync(dir,{withFileTypes:true});}catch(e){return}
  for(const item of items){
    const full=path.join(dir,item.name);
    if(item.isDirectory()){if(['node_modules','.git','.next','dist','dist-dev','dist-debug'].includes(item.name)) continue; walk(full);} else {if(item.name.endsWith('.json')) files.push(full)}
  }
}
walk(root);
console.log('Checking',files.length,'json files');
let bad=0;
for(const f of files){
  try{const txt=fs.readFileSync(f,'utf8'); JSON.parse(txt);}catch(e){console.error('BAD JSON',f,e.message); bad++;}
}
console.log('Done. Bad:',bad);
