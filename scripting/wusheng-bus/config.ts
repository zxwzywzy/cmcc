export function domain(value:string){
 const host=value.trim().toLowerCase(),parts=host.split(':'),name=parts[0],port=parts[1]
 if(parts.length>2||name.length>253||!name.includes('.')||!name.split('.').every(p=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(p))||/^\d+(?:\.\d+){3}$/.test(name)||(port!==undefined&&(!/^[1-9]\d{0,4}$/.test(port)||Number(port)>65535)))throw Error('填写业务域名，可带端口，例如 wsdata.wskyzx.com:25790；不含协议、路径或通配符')
 return host
}
export function rules(value:string){
 const host=domain(value),escaped=host.replace(/\./g,'\\.')
 const script='https://raw.githubusercontent.com/zxwzywzy/cmcc/main/scripts/wusheng_bus_diagnostic-v0.0.2.js'
 const pattern='^https:\\/\\/'+escaped+(host.includes(':')?'':'(?::443)?')+'\\/'
 return '# 武胜公交：接口诊断，仅元数据；这不是 Cookie 抓取或查询功能。\n# 将下列条目追加到现有对应区段，勿替换原配置。\n[rewrite_local]\n'+pattern+' url script-request-header '+script+'\n'+pattern+' url script-response-body '+script+'\n\n[mitm]\nhostname = '+host+'\n'
}
