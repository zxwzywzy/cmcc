import { Button,HStack,Image,List,Navigation,Script,Section,Spacer,Text,VStack,Widget,useEffect,useState } from 'scripting'
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
 <Section><VStack alignment="center" spacing={14} frame={{maxWidth:'infinity',minHeight:250}}>{state.image?<Image image={state.image} resizable frame={{width:240,height:240}} background="white"/>:<><Image systemName="qrcode" font={52} foregroundStyle="secondaryLabel"/><Text font={13} foregroundStyle="secondaryLabel">{state.busy?'正在获取…':'点击获取乘车码'}</Text></>}</VStack><Button title={state.busy?'正在获取…':'获取 / 刷新乘车码'} disabled={state.busy||!active} action={()=>session.refresh()}/>{!state.busy&&!state.image&&state.note&&!state.note.startsWith('点击获取')?<Text font={11} foregroundStyle="secondaryLabel">{state.note}</Text>:null}
 {!readAccount()&&toAccount?<Button title="去账号页从 BoxJS 登录" action={toAccount}/>:null}
 </Section><Section><HStack spacing={8}><Image systemName="creditcard" font={17}/><VStack alignment="leading" spacing={3}><Text font={12}>公交卡余额</Text>{state.card?<Text font={10} foregroundStyle="secondaryLabel">{clock(state.card.fetchedAt)}</Text>:null}</VStack><Spacer/><Text font={25} fontWeight="semibold" monospacedDigit>{state.card?.balance!==undefined?'¥'+state.card.balance.toFixed(2):'—'}</Text></HStack></Section></List>
}
export async function presentRide(){await Navigation.present({element:<RidePage fromTap/>});Script.exit()}
