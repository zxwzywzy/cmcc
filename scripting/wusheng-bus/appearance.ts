export type Appearance={theme:'night'|'day'|'system';showBalance:boolean;compact:boolean}
const KEY='wusheng.bus.appearance.v1'
export function appearance():Appearance{
 const v=Storage.get<Partial<Appearance>>(KEY)
 return {theme:v?.theme==='day'||v?.theme==='system'?v.theme:'night',showBalance:v?.showBalance!==false,compact:v?.compact===true}
}
export function saveAppearance(v:Appearance){
 const theme=v.theme==='day'||v.theme==='system'?v.theme:'night'
 Storage.set(KEY,{theme,showBalance:v.showBalance!==false,compact:v.compact===true})
 return appearance()
}
export function palette(theme=appearance().theme){
 const dark={bg:'#071423',ink:'#F2F7F8',muted:'#9AAAB3',accent:'#39D4E0'}
 const light={bg:'#F7FAFA',ink:'#142D34',muted:'#526870',accent:'#006B72'}
 if(theme==='system')return {bg:{light:light.bg,dark:dark.bg},ink:{light:light.ink,dark:dark.ink},muted:{light:light.muted,dark:dark.muted},accent:{light:light.accent,dark:dark.accent}}
 return theme==='day'?light:dark
}
