import { Button,Image,List,Navigation,Script,Section,Text,useEffect,useState } from 'scripting'
import { requestRideImage } from './ride'
export function RidePage({auto=false}:{auto?:boolean}){
 const dismiss=Navigation.useDismiss()
 const [image,setImage]=useState<any>(undefined),[busy,setBusy]=useState(false),[note,setNote]=useState('点击取回本次乘车码'),[until,setUntil]=useState(0)
 async function refresh(){if(busy)return;setImage(undefined);setBusy(true);setUntil(0);setNote('正在定位并向公交系统取新码…');try{const fresh=await requestRideImage();setImage(fresh);setUntil(Date.now()+20000);setNote('码仅在本页短时展示，扫码失败请重新取码。')}catch(e){setNote((e as Error).message)}finally{setBusy(false)}}
 useEffect(()=>{if(auto)refresh()},[])
 useEffect(()=>{if(!until)return;const timer=setTimeout(()=>{setImage(undefined);setUntil(0);setNote('本页已隐藏乘车码，请点击重新取码')},Math.max(0,until-Date.now()));return()=>clearTimeout(timer)},[until])
 return <List navigationTitle="乘车码" toolbar={{cancellationAction:<Button title="关闭" action={dismiss}/>}}><Section footer={<Text>每次点击都会清除旧图后向公交系统请求。图片只留在本页内存，20秒后隐藏；这是本页展示限制，不是官方有效期。实际能否刷卡以公交系统为准。</Text>}>
 {image?<Image image={image} resizable frame={{width:240,height:240}} background="white"/>:null}
 <Text>{note}</Text><Button title={busy?'正在取码…':'获取 / 刷新乘车码'} disabled={busy} action={refresh}/><Button title="打开微信（手动进入武胜公交）" action={async()=>{await Safari.openURL('weixin://')}}/>
 </Section><Section><Text>若服务不返回图片，请先在微信“武胜公交”确认手机号授权及乘车码开通状态。本页不充值、不扣费，也不会模拟生成公交乘车凭证。</Text></Section></List>
}
export async function presentRide(){await Navigation.present({element:<RidePage auto/>});Script.exit()}
