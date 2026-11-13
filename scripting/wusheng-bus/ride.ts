import { post,balance } from './api'
import { readAccount,type Account } from './account'
import { cachedNearby,coordinate } from './nearby'
import { finite } from './model'
type Card={balance?:number;cardTail?:string;fetchedAt:number}
export type RideState={image?:any;card?:Card;cardStale:boolean;busy:boolean;note:string;issuedAt?:number}
const sameAccount=(a:Account|undefined,b:Account|undefined)=>!!a&&!!b&&a.authorization===b.authorization&&a.userId===b.userId
// The service requires coordinate fields. A public station reference succeeded in a real request;
// it is only a ride-code request reference, never presented as the user's actual location.
export function rideCoordinate(){
 const cached=cachedNearby(),p=coordinate(cached?.position),age=Date.now()-(cached?.position?.timestamp||0)
 if(p&&age>=0&&age<=10*60000)return p
 return coordinate(cached?.stop?.coordinate)||{latitude:30.351705,longitude:106.303647}
}
// Only the explicit foreground tap session calls this function. No timers or widget entry call it.
export async function requestRide(account=readAccount()){
 if(!account)throw Error('请先到账号页从 BoxJS 导入登录')
 const p=rideCoordinate()
 const body=await post('/api/AppBusiness/GetPayRrcode',{pageIndex:1,pageSize:10,userId:account.userId,latitude:p.latitude,longitude:p.longitude},account)
 if(body?.code!==0||typeof body?.data?.qrcode!=='string'||!body.data.qrcode){
  const message=typeof body?.message==='string'?body.message.replace(account.authorization,'').replace(account.userId,'').replace(/[\r\n]/g,' ').slice(0,160):''
  throw Error(message?'乘车码获取失败：'+message:'服务未返回乘车码，请稍后重试或回微信查看')
 }
 const image=await rideImage(body.data.qrcode);if(!image)throw Error('乘车码图片无法读取，请回微信使用')
 const cents=finite(body.data.money)
 return {image,card:cents===undefined?undefined:{balance:cents/100,fetchedAt:Date.now()} as Card}
}
export function initialRideState():RideState{return {card:readAccount()?Storage.get<Card>('wusheng.bus.balance')||undefined:undefined,cardStale:true,busy:false,note:'点击获取本次乘车码及余额'}}
// Construction is inert; refresh() is called only by a user tap or the page opened by that tap.
export function createRideSession(changed:(state:RideState)=>void,balanceUpdated=()=>{}){
 let state=initialRideState(),disposed=false,locked=false,sequence=0,timer:ReturnType<typeof setTimeout>|undefined
 const emit=(next:RideState)=>{state=next;if(!disposed)changed({...state})}
 const clear=()=>{if(timer!==undefined)clearTimeout(timer);timer=undefined}
 return {
  async refresh(){
   if(disposed||locked)return
   locked=true;const request=++sequence;clear();emit({...state,image:undefined,issuedAt:undefined,busy:true,note:'正在获取新乘车码和余额…'})
   try{
    const account=readAccount()
    if(!account){emit({cardStale:true,busy:false,note:'请先到账号页从 BoxJS 导入登录'});return}
    const [qr,profile]=await Promise.allSettled([requestRide(account),balance(account)])
    if(disposed||request!==sequence)return
    if(!sameAccount(account,readAccount())){emit({cardStale:true,busy:false,note:'账号已变化，请重新点击获取'});return}
    const fresh=profile.status==='fulfilled'&&profile.value.balance!==undefined?profile.value:qr.status==='fulfilled'&&qr.value.card?qr.value.card:profile.status==='fulfilled'?profile.value:undefined
    if(fresh){Storage.set('wusheng.bus.balance',fresh);balanceUpdated()}
    const card=fresh||Storage.get<Card>('wusheng.bus.balance')||undefined
    const image=qr.status==='fulfilled'?qr.value.image:undefined
    const note=qr.status==='fulfilled'?'已更新':qr.reason instanceof Error?qr.reason.message:'获取失败，请点击重试'
    emit({image,card,cardStale:!fresh,busy:false,issuedAt:image?Date.now():undefined,note:note+(!fresh?' 余额暂未更新。':'')})
    if(image)timer=setTimeout(()=>{timer=undefined;emit({...state,image:undefined,issuedAt:undefined,note:'本页已隐藏乘车码，请点击重新获取'})},20000)
   }finally{if(request===sequence)locked=false}
  },
  hide(){sequence++;locked=false;clear();emit({...state,image:undefined,issuedAt:undefined,busy:false,note:'点击获取本次乘车码及余额'})},
  dispose(){disposed=true;sequence++;clear();state={...state,image:undefined}},
 }
}
export async function rideImage(raw:string){
 if(raw.length>2*1024*1024)throw Error('乘车码图片过大')
 if(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=\r\n]+$/.test(raw))return UIImage.fromBase64String(raw.slice(raw.indexOf(',')+1))
 if(/^(iVBOR|\/9j\/)[A-Za-z0-9+/=\r\n]+$/.test(raw))return UIImage.fromBase64String(raw)
 // The mini-program binds qrcode directly as an image URL. Unknown formats are not re-encoded as an invented code.
 const url=raw.startsWith('/')&&!raw.startsWith('//')?'https://wsapi.wskyzx.com:26110'+raw:raw
 if(/^https:\/\/(wsapi|wsdata)\.wskyzx\.com(?::\d+)?\//.test(url))return UIImage.fromURL(url)
 throw Error('尚未适配该乘车码图片格式，请使用微信乘车码')
}
