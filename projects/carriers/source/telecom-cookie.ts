import { fetch } from 'scripting'
import { safeRequest, endpoint, normalize } from './normalizers.js'
import type { Metrics } from './hub'
// The App authenticates this read-only query with headerInfos.token in its JSON body.
export function telecomRequest(value:any){
 const req=safeRequest(value)
 if(!req||endpoint(req.url)!=='telecom'||req.method!=='POST'||!req.body)return null
 try{const body=JSON.parse(req.body);return typeof body.headerInfos?.token==='string'&&body.headerInfos.token.trim()?req:null}catch{return null}
}
export function telecomIdentity(value:any):string|undefined{
 const req=telecomRequest(value);if(!req)return undefined
 try{const b=JSON.parse(req.body);const name=b.content?.fieldData?.account||b.headerInfos?.userLoginName;return typeof name==='string'?name:undefined}catch{return undefined}
}
export async function queryTelecomRequest(value:any):Promise<Metrics>{
 const req=telecomRequest(value);if(!req)throw Error('电信鉴权请求无效')
 const response=await fetch(req.url,{method:'POST',headers:req.headers,body:req.body,redirect:'error'})
 if(!response.ok)throw Error('电信查询失败')
 return {...normalize('telecom',await response.json()),telecomSchema:2} as Metrics
}
