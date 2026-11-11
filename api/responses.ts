import {put,head} from '@vercel/blob';
import {createHandler} from '../server/responses.js';

const handler=createHandler(async(path,body)=>{
 try{return await put(path,body,{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:false});}
 catch(error){
  // A retry may follow a successful write whose response was lost.
  // Only acknowledge it if that exact immutable pathname exists.
  try{await head(path);return;}catch{throw error;}
 }
},()=>Boolean(process.env.BLOB_READ_WRITE_TOKEN));

export default {fetch:handler};
