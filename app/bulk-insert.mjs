import {assert} from './domain.mjs';
export function* chunks(rows,size=500){for(let i=0;i<rows.length;i+=size)yield rows.slice(i,i+size);}
export async function insertRows(tx,table,columns,rows,{suffix=''}={}){
 assert(/^[a-z_][a-z0-9_]*$/.test(table)&&columns.every(c=>/^[a-z_][a-z0-9_]*$/.test(c)),400,'Nama tabel/kolom bulk tidak valid.');
 for(const batch of chunks(rows,1000)){
  assert(batch.every(r=>r.length===columns.length),400,'Jumlah field bulk tidak sesuai.');
  const row='('+columns.map(()=>'?').join(',')+')';
  await tx.run(`INSERT INTO ${table}(${columns.join(',')}) VALUES ${batch.map(()=>row).join(',')}${suffix}`,batch.flat());
 }
}
