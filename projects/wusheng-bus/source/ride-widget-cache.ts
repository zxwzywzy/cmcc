export const rideFamilies=['systemSmall','systemMedium','systemLarge','systemExtraLarge'] as const
const prefix='wusheng.bus.widget.last-image.v1.'
const maxChars=256*1024 // Base64 of at most 192 KiB of PNG.
const local={synchronizable:false,accessibility:'unlocked_this_device' as const}
export function rideImageCache(family:string,namespace=prefix){
 if(!rideFamilies.some(f=>f===family))throw Error('不支持的尺寸')
 const key=namespace+family
 return {
  save(owner:string,image:UIImage,time:number){
   const png=image.toPNGData()?.toBase64String()
   if(!owner||!png||png.length>maxChars||!Keychain.set(key,JSON.stringify({owner,time,png}),local))throw Error('无法安全保存本次图片')
  },
  read(owner:string){
   if(!owner)return undefined
   const raw=Keychain.get(key,{synchronizable:false});if(!raw||raw.length>maxChars+512)return undefined
   const r=JSON.parse(raw);if(r.owner!==owner||!Number.isSafeInteger(r.time)||r.time<=0||typeof r.png!=='string'||r.png.length>maxChars)return undefined
   const image=UIImage.fromBase64String(r.png);return image?{image,time:r.time as number}:undefined
  },
  clear(){if(Keychain.contains(key)&&!Keychain.remove(key))throw Error('无法清除缓存')}
 }
}
export function clearRideImages(){for(const family of rideFamilies)rideImageCache(family).clear()}
