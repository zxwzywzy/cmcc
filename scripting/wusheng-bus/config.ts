export function domain(value:string){
 const host=value.trim().toLowerCase()
 if(host.length>253||!host.includes('.')||!host.split('.').every(p=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(p))||/^\d+(?:\.\d+){3}$/.test(host))throw Error('只填写网络活动里确认的业务域名，不含 https://、路径、通配符或端口')
 return host
}
export function rules(value:string){
 const host=domain(value),escaped=host.replace(/\./g,'\\.')
 const script='https://raw.githubusercontent.com/zxwzywzy/cmcc/main/scripts/wusheng_bus_diagnostic-v0.0.1.js'
 const pattern='^https:\\/\\/'+escaped+'(?::443)?\\/'
 return '# 武胜公交：接口诊断，仅元数据；这不是 Cookie 抓取或查询功能。\n# 将下列条目追加到现有对应区段，勿替换原配置。\n[rewrite_local]\n'+pattern+' url script-request-header '+script+'\n'+pattern+' url script-response-body '+script+'\n\n[mitm]\nhostname = '+host+'\n'
}
