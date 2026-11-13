import { Button,Image,List,Navigation,Script,Section,Text,Widget,useEffect,useState } from 'scripting'
import { createRideSession,initialRideState,type RideState } from './ride'
import { clock } from './view'
import { readAccount } from './account'
export function RidePage({fromTap=false,tapId=0,active=true,close,toAccount}:{fromTap?:boolean;tapId?:number;active?:boolean;close?:any;toAccount?:()=>void}){
 const dismiss=Navigation.useDismiss()
 const [state,setState]=useState<RideState>(initialRideState())
 const [session]=useState(createRideSession(setState,()=>Widget.reloadAll()))
 const [gate]=useState({initial:false,lastTap:0})
 useEffect(()=>{if(!active){session.hide();return}if(fromTap&&!gate.initial){gate.initial=true;session.refresh()}else if(tapId>gate.lastTap){gate.lastTap=tapId;session.refresh()}},[active,fromTap,tapId])
 useEffect(()=>()=>session.dispose(),[])
 return <List navigationTitle="乘车码" toolbar={{cancellationAction:close||<Button title="关闭" action={()=>{session.dispose();dismiss()}}/>}}>
 <Section header={<Text>公交卡余额</Text>}><Text>{state.card?.balance!==undefined?(state.cardStale?'上次余额 ¥':'余额 ¥')+state.card.balance.toFixed(2):'余额未获取'}</Text>{state.card?<Text>{'更新于 '+clock(state.card.fetchedAt)}</Text>:null}</Section>
 <Section footer={<Text>仅点击乘车码入口或本页刷新按钮时取新码，同时更新余额。20秒后仅隐藏图片，不自动取新码；此时限不是官方二维码有效期。</Text>}>
 {state.image?<Image image={state.image} resizable frame={{width:240,height:240}} background="white"/>:null}
 <Text>{state.note}</Text><Button title={state.busy?'正在取码…':'获取 / 刷新乘车码'} disabled={state.busy||!active} action={()=>session.refresh()}/><Button title="打开微信（手动进入武胜公交）" action={async()=>{await Safari.openURL('weixin://')}}/>
 {!readAccount()&&toAccount?<Button title="去账号页从 BoxJS 登录" action={toAccount}/>:null}
 </Section><Section><Text>取码不强制重新定位；无可用定位缓存时使用公交站参考坐标。附近公交仍通过真实定位查询。取码失败时可回微信使用。</Text></Section></List>
}
export async function presentRide(){await Navigation.present({element:<RidePage fromTap/>});Script.exit()}
