import { post } from './api'
import { readAccount } from './account'
import { freshPosition } from './nearby'
// This function is called only by an explicit foreground ride-code action. Never cache its result.
export async function requestRideImage(){
 const account=readAccount();if(!account)throw Error('请先导入自己的微信登录授权')
 const p=await freshPosition(true)
 const body=await post('/api/AppBusiness/GetPayRrcode',{pageIndex:1,pageSize:10,userId:account.userId,latitude:p.latitude,longitude:p.longitude},account)
 if(body?.code!==0||typeof body?.data?.qrcode!=='string'||!body.data.qrcode)throw Error('服务未返回乘车码，请先在微信确认已开通乘车码，再重试')
 const image=await rideImage(body.data.qrcode);if(!image)throw Error('乘车码图片无法读取，请回微信使用')
 return image
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
