import {list,get} from '@vercel/blob';
import {mkdir,writeFile} from 'node:fs/promises';

if(!process.env.BLOB_READ_WRITE_TOKEN)throw new Error('서버 전용 BLOB_READ_WRITE_TOKEN이 필요합니다.');
const records=[];let cursor;
do{
 const page=await list({prefix:'responses/',cursor,limit:1000});
 for(const blob of page.blobs){
  const response=await get(blob.pathname,{access:'private'});
  if(!response||response.statusCode!==200)throw new Error('응답 파일을 읽지 못했습니다.');
  records.push(JSON.parse(await new Response(response.stream).text()));
 }
 cursor=page.hasMore?page.cursor:undefined;
}while(cursor);
await mkdir('exports',{recursive:true});
const file=`exports/responses-${Date.now()}.json`;
await writeFile(file,JSON.stringify(records,null,2),'utf8');
console.log(`${records.length}개 응답을 ${file}에 저장했습니다.`);
