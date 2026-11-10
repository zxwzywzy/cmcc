const esbuild=require('esbuild');
for(const name of ['index','widget','app_intents'])esbuild.buildSync({entryPoints:['scripting/wusheng-bus/'+name+'.tsx'],bundle:true,platform:'neutral',format:'esm',target:'es2020',external:['scripting'],logOverride:{'impossible-typeof':'silent'},outfile:'.build/bus-'+name+'.js'});
console.log('Bus app and widget build passed; native iOS validation remains.');
