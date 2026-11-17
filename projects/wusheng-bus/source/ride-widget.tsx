import {Button,HStack,Image,Link,Script,Text,VStack,Widget} from 'scripting'
import {ticketIndex,ticketInk,originalInk} from './ride-ticket'
import {tintQrInk} from './qr-ink'
import {readAccount} from './account'
import {requestRide} from './ride'
import {widgetRuntime} from './runtime'
import {HideRideWidgetIntent,ShowRideWidgetIntent} from './app_intents'
import {WARN_AFTER_MS,rideGate,sessionTag} from './ride-widget-gate'
import {rideImageCache} from './ride-widget-cache'

export async function presentRideWidget(){
 const family=Widget.family,small=family==='systemSmall',medium=family==='systemMedium'
 const page=Script.createRunURLScheme(Script.name,{page:'ride'})
 let saved:{image:UIImage;time:number}|undefined,owner='',version='',failed=false
 try{
  const gate=rideGate(family),cache=rideImageCache(family),account=readAccount()
  owner=sessionTag(account)
  const permit=account&&gate.take(owner)
  if(permit&&widgetRuntime().enabled&&sessionTag(readAccount())===owner){
   try{
    const result=await requestRide(account),received=Date.now()
    gate.commit(permit.claim,owner,()=>{if(widgetRuntime().enabled&&sessionTag(readAccount())===owner)cache.save(owner,result.image,received)})
   }catch{failed=true} // No retries, and never expose server error strings.
  }
  version=gate.row().version
  if(owner&&widgetRuntime().enabled&&sessionTag(readAccount())===owner)saved=cache.read(owner)
 }catch{failed=true}
 if(sessionTag(readAccount())!==owner)saved=undefined
 const rendered=saved?(originalInk()?saved.image:await tintQrInk(saved.image,ticketInk(ticketIndex()))):undefined
 if(saved&&(sessionTag(readAccount())!==owner||rideGate(family).row().version!==version))saved=undefined
 const now=Date.now(),stale=saved&&(failed||now<saved.time||now-saved.time>=WARN_AFTER_MS)
 const open=<Link url={page}><Text>去登录</Text></Link>
 const controls=<HStack spacing={small?4:10}><Button title={saved?'刷新':'取码'} buttonStyle="plain" disabled={!owner||!version} intent={ShowRideWidgetIntent({family,version,owner})}/>{saved?<Button title="清除" buttonStyle="plain" intent={HideRideWidgetIntent({family})}/>:null}{!owner?open:null}</HStack>
 const warning=failed?'刷新失败':stale?'待刷新':''
 const info=<VStack alignment="center" spacing={small?1:4}>{warning?<Text font={small?10:12} foregroundStyle="#895310">{warning}</Text>:null}{controls}</VStack>
 const {width,height}=Widget.displaySize
 const side=Math.max(1,Math.min(width-24,medium?width*0.46:width,height-(small?53:medium?24:68)))
 const qr=saved?<VStack padding={6} background="white"><Image image={rendered!} resizable scaleToFit frame={{width:side,height:side}}/></VStack>:null
 Widget.present(<VStack spacing={1} frame={{maxWidth:'infinity',maxHeight:'infinity'}} widgetURL={page} widgetBackground="white" foregroundStyle="black">{medium?<HStack spacing={5}>{qr}{info}</HStack>:<>{qr}{info}</>}</VStack>,saved&&!stale?{policy:'after',date:new Date(saved.time+WARN_AFTER_MS)}:{policy:'never'})
}
