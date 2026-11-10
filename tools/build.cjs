const esbuild=require('esbuild');
esbuild.buildSync({entryPoints:['scripts/carrier_hub_capture.source.js'],bundle:true,format:'iife',platform:'neutral',target:'es2020',outfile:'scripts/carrier_hub_capture.js'});
for(const name of ['index.tsx','widget.tsx'])esbuild.buildSync({entryPoints:['scripting/carriers/'+name],bundle:true,platform:'neutral',format:'esm',target:'es2020',external:['scripting'],outfile:'.build/'+name.replace('.tsx','.js')});
console.log('Capture and both Scripting entry points built. Native SDK type checking and device testing still required.');
