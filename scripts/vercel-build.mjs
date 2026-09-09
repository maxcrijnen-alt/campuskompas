import {rmSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd();
const cache=resolve(root,'.next');
if(dirname(cache)!==root)throw Error('Invalid build-cache path');
rmSync(cache,{recursive:true,force:true});
const result=spawnSync(process.execPath,[resolve(root,'node_modules/next/dist/bin/next'),'build'],{stdio:'inherit'});
process.exit(result.status??1);
