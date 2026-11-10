import { fetch } from 'scripting'
import { normalizeUnicomCookie, unicomExtras } from './normalizers.js'
import type { Metrics } from './hub'
// Only these constant, read-only queries receive the local Cookie.
const SUMMARY='https://m.client.10010.com/mobileserviceimportant/home/queryUserInfoSeven'
const DETAIL='https://m.client.10010.com/servicequerybusiness/operationservice/queryOcsPackageFlowLeftContentRevisedInJune'
export async function queryUnicomCookie(cookie:string):Promise<Metrics>{
 if(!cookie||cookie.length>32768||/[\r\n]/.test(cookie))throw Error('联通 Cookie 无效')
 // Derive the user's own phone only if present; never send an upstream sample number.
 const match=cookie.match(/(?:^|;\s*)(?:u_account|c_mobile)=(1\d{10})(?:;|$)/)
 const query='?version=iphone_c@10.0100&showType=0'+(match?'&desmobiel='+encodeURIComponent(match[1]):'')
 const headers={'Cookie':cookie,'User-Agent':'ChinaUnicom.x CFNetwork iOS/16.3 unicom{version:iphone_c@10.0100}'}
 const read=async(url:string)=>{try{const r=await fetch(url,{method:'GET',headers,redirect:'error'});return r.ok?await r.json():null}catch{return null}}
 const [fee,detail]=await Promise.all([read(SUMMARY+query),read(DETAIL)])
 const metrics=normalizeUnicomCookie(fee,detail) as Metrics
 // Older summary still supplies points for some App versions; failure never discards the primary readings.
 if(metrics.points===undefined){const legacy=await read('https://m.client.10010.com/mobileService/home/queryUserInfoSeven.htm'+query);Object.assign(metrics,unicomExtras(legacy))}
 return metrics
}
