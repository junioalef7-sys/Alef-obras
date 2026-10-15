const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('core-fix65.js','utf8');
const calls=[];
const C={cents(v){return Math.round(Number(v||0)*100)}};
const context={
  console,
  Number,
  setTimeout:fn=>fn(),
  document:{readyState:'complete',addEventListener(){}},
  D:{obras:[{id:'obra-1',nome:'Obra 1'}]},
  EdifiqRelease27:C,
  obraProgress(o){calls.push(o);return o&&o.id==='obra-1'?73:0}
};
context.window=context;
vm.createContext(context);
vm.runInContext(code,context,{filename:'core-fix65.js'});
assert.equal(typeof context.obraProgress,'function');
assert.equal(context.obraProgress('obra-1'),73,'ID da obra deve ser convertido no objeto da obra');
assert.equal(calls.at(-1).id,'obra-1','função original deve receber o objeto completo');
const obra={id:'obra-1'};
assert.equal(context.obraProgress(obra),73,'chamadas que já usam objeto devem continuar funcionando');
assert.equal(calls.at(-1),obra,'objeto existente não deve ser substituído');
assert.equal(C.cents('280'),28000,'valor inteiro em reais deve continuar em centavos');
assert.equal(C.cents('1.234,56'),123456,'formato brasileiro deve ser preservado');
assert.equal(C.cents(1.005),101,'arredondamento positivo de meio centavo deve subir');
assert.equal(C.cents(-1.005),-101,'arredondamento negativo deve ser simétrico');
assert.equal(C.cents(0.1+0.2),30,'soma decimal comum deve conservar centavos');
console.log('CORE65 OK: progresso aceita objeto ou ID e moeda arredonda centavos de forma simétrica.');
