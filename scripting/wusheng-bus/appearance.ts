export const BUS_STYLES=['全景','到站卡','账单卡','极简'] as const
export type BusStyle=typeof BUS_STYLES[number]
export type BusFamily='systemSmall'|'systemMedium'|'systemLarge'
export type Appearance={theme:'night'|'day'|'system';showBalance:boolean;compact:boolean;styles:Record<BusFamily,BusStyle>}
const KEY='wusheng.bus.appearance.v1'
const style=(v:unknown):BusStyle=>BUS_STYLES.includes(v as BusStyle)?v as BusStyle:'全景'
export function appearance():Appearance{
 const v=Storage.get<Partial<Appearance>>(KEY)
 return {theme:v?.theme==='day'||v?.theme==='system'?v.theme:'night',showBalance:v?.showBalance!==false,compact:v?.compact===true,styles:{systemSmall:style(v?.styles?.systemSmall),systemMedium:style(v?.styles?.systemMedium),systemLarge:style(v?.styles?.systemLarge)}}
}
export function saveAppearance(patch:Partial<Appearance>){
 const v={...appearance(),...patch}
 const theme=v.theme==='day'||v.theme==='system'?v.theme:'night'
 Storage.set(KEY,{theme,showBalance:v.showBalance!==false,compact:v.compact===true,styles:{systemSmall:style(v.styles?.systemSmall),systemMedium:style(v.styles?.systemMedium),systemLarge:style(v.styles?.systemLarge)}})
 return appearance()
}
export const styleFor=(family:string)=>appearance().styles[family==='systemSmall'?'systemSmall':family==='systemMedium'?'systemMedium':'systemLarge']
export function saveStyle(family:BusFamily,value:BusStyle){const v=appearance();return saveAppearance({styles:{...v.styles,[family]:style(value)}})}
export function palette(theme=appearance().theme){
 const dark={bg:'#071423',ink:'#F2F7F8',muted:'#9AAAB3',accent:'#39D4E0',wash:'#10283A',track:'#294453'}
 const light={bg:'#F7FAFA',ink:'#142D34',muted:'#526870',accent:'#006B72',wash:'#E4F1F2',track:'#C5DBDD'}
 if(theme==='system')return {bg:{light:light.bg,dark:dark.bg},ink:{light:light.ink,dark:dark.ink},muted:{light:light.muted,dark:dark.muted},accent:{light:light.accent,dark:dark.accent},wash:{light:light.wash,dark:dark.wash},track:{light:light.track,dark:dark.track}}
 return theme==='day'?light:dark
}
