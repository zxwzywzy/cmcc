import { HStack,Image,Text,RoundedRectangle } from 'scripting'
import { palette } from './appearance'
export function RideAction({small=false,label='乘车码'}:{small?:boolean;label?:string}){const p=palette();return <HStack spacing={3} padding={{horizontal:small?5:8,vertical:4}} background={<RoundedRectangle cornerRadius={8} fill={p.accent}/>} foregroundStyle={p.bg}><Image systemName="qrcode" font={small?9:11}/><Text font={small?9:11} fontWeight="semibold">{label}</Text></HStack>}
export function directionAppearance(small=false){const p=palette();return {buttonStyle:'plain' as const,font:small?9:11,fontWeight:'semibold' as const,foregroundStyle:p.ink,padding:{horizontal:small?5:8,vertical:4},background:<RoundedRectangle cornerRadius={8} fill={p.wash}/>}}
