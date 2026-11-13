'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const host='http://127.0.0.1:8765';
const paths=['/obrix.html','/obrix-android-inicial/obrix.html'];
const platforms=[['iPhone WebKit',webkit,devices['iPhone 13']],
 ['Android Chromium',chromium,devices['Pixel 7']],
 ['Desktop Chromium',chromium,{viewport:{width:1366,height:768}}]];
const expected={
  finance:['#fff1f2','#381b28'],
  diarioOk:['#dcfce7','#123524'],diarioErro:['#fee2e2','#391b28'],
  notasOk:['#dcfce7','#123524'],notasErro:['#fee2e2','#391b28'],
  orcOk:['#dcfce7','#123524'],orcErro:['#fee2e2','#391b28'],
  supOk:['#dcfce7','#123524'],supErro:['#fee2e2','#391b28'],
  supOffline:['#fff7ed','#422006'],supActive:['#e5eaf0','#253b58']
};
function hex(s){
 const m=String(s).match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
 return m?'#'+[m[1],m[2],m[3]].map(x=>Number(x).toString(16).padStart(2,'0')).join(''):s;
}
function luminosity(s){
 if(!/^#[0-9a-f]{6}$/i.test(s))return 0;
 const l=[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255)
  .map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 return .2126*l[0]+.7152*l[1]+.0722*l[2];
}
function contrast(a,b){const x=[luminosity(a),luminosity(b)].sort((m,n)=>n-m);return (x[0]+.05)/(x[1]+.05)}
async function prepare(page,path){
 const res=await page.goto(host+path,{waitUntil:'domcontentloaded',timeout:40000});
 assert.equal(res.status(),200);
 await page.waitForFunction(()=>!!window.OBRIX_POS_LOGIN_LOADER,{timeout:18000});
 const base=path.includes('android-inicial')?'/obrix-android-inicial/':'/';
 for(const name of ['obrix-financeiro-main.js','obrix-diario-main.js',
    'obrix-notas-main.js','obrix-orcamentos-main.js'])
  await page.addScriptTag({url:host+base+name+'?v=20261113-contraste-temas1'});
 await page.waitForFunction(()=>!!document.getElementById('obrixSupportStyle'),{timeout:9000});
 await page.evaluate(()=>{
  document.getElementById('app')?.classList.remove('hidden');
  document.getElementById('login')?.classList.add('hidden');
  function hostElement(id){
    let root=document.getElementById(id);
    if(!root){root=document.createElement('main');root.id=id;document.getElementById('app').appendChild(root)}
    return root;
  }
  function fixture(parent,html){
    const box=document.createElement('section');
    box.setAttribute('data-contrast-fixture','yes');
    box.innerHTML=html;hostElement(parent).appendChild(box);
  }
  document.getElementById('fmChecklistTotal')?.remove();
  fixture('financeiroMain','<div id="fmChecklistTotal" class="fmChecklistTotal fmDistErro">'+
    '<div><span>Total selecionado</span><strong>R$ 13.400,00</strong></div>'+
    '<div><span>Valor do lançamento</span><strong>R$ 13.650,00</strong></div>'+
    '<div data-audit="finance"><span>Falta distribuir</span><strong>R$ 250,00</strong></div></div>');
  fixture('diarioMain','<div class="diarioMsg ok" data-audit="diarioOk">Salvo</div>'+
    '<div class="diarioMsg erro" data-audit="diarioErro">Falha</div>'+
    '<div class="diarioForm"><input aria-label="Registro diario" data-audit="diarioInput"></div>');
  fixture('notasMain','<div class="notasMsg ok" data-audit="notasOk">Salvo</div>'+
    '<div class="notasMsg erro" data-audit="notasErro">Falha</div>'+
    '<div class="notaMeta"><span class="alta" data-audit="notaAlta">Alta</span>'+
    '<span class="baixa" data-audit="notaBaixa">Baixa</span></div>');
  fixture('orcamentosMain','<div class="orcMsg ok" data-audit="orcOk">Salvo</div>'+
    '<div class="orcMsg erro" data-audit="orcErro">Falha</div>'+
    '<span class="orcStatus aprovado" data-audit="orcAprovado">Aprovado</span>'+
    '<span class="orcStatus recusado" data-audit="orcRecusado">Recusado</span>'+
    '<div class="orcForm"><input data-audit="orcInput" aria-label="Novo orcamento"></div>');
  fixture('suporteMain','<div class="obrixSupport">'+
    '<div class="supOk" data-audit="supOk">Enviado</div>'+
    '<div class="supErr" data-audit="supErro">Erro</div>'+
    '<div class="supOffline" data-audit="supOffline">Sem rede</div>'+
    '<div class="supTabs"><button class="active" data-audit="supActive">Ativo</button></div>'+
    '<span class="supChip aberto" data-audit="supAberto">Aberto</span></div>');
 });
}
(async()=>{
 let count=0;
 for(const [platform,engine,device] of platforms){
  const browser=await engine.launch({headless:true});
  try{
   for(const path of paths){
    const page=await browser.newPage({...device,serviceWorkers:'block'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await prepare(page,path);
    for(const theme of ['light','dark']){
      await page.evaluate(theme=>{
        document.documentElement.dataset.theme=theme;
        document.body.classList.toggle('dark',theme==='dark');
        window.dispatchEvent(new Event('obrix:theme-changed'));
      },theme);
      await page.waitForTimeout(340);
      const styles=await page.evaluate(()=>{
        const names=['finance','diarioOk','diarioErro','diarioInput','notasOk','notasErro',
          'notaAlta','notaBaixa','orcOk','orcErro','orcAprovado','orcRecusado',
          'orcInput','supOk','supErro','supOffline','supActive','supAberto'];
        const o={};
        for(const name of names){
          const el=document.querySelector('[data-audit="'+name+'"]');
          if(!el)throw Error('Componente inexistente: '+name);
          const st=getComputedStyle(el);
          o[name]={bg:st.backgroundColor,text:st.color};
          if(name==='finance'){
            o[name].label=getComputedStyle(el.querySelector('span')).color;
            o[name].amount=getComputedStyle(el.querySelector('strong')).color;
          }
        }
        return o;
      });
      for(const [name,options] of Object.entries(expected)){
        assert.equal(hex(styles[name].bg),options[theme==='dark'?1:0],
          platform+' '+path+' '+theme+' - '+name+' fundo invertido');
      }
      for(const name of ['finance','diarioOk','diarioErro','notasOk','notasErro',
          'orcOk','orcErro','supOk','supErro','supOffline']){
        const s=styles[name],c=contrast(hex(s.bg),hex(s.text));
        assert.ok(c>=4.5,platform+' '+path+' '+theme+' - '+name+' baixo contraste '+c.toFixed(2));
      }
      assert.ok(contrast(hex(styles.finance.bg),hex(styles.finance.label))>=4.5,
        platform+' titulo Falta distribuir ilegivel');
      assert.ok(contrast(hex(styles.finance.bg),hex(styles.finance.amount))>=4.5,
        platform+' valor pendente ilegivel');
      if(theme==='dark')for(const name of ['notaAlta','notaBaixa','orcAprovado',
        'orcRecusado','supAberto','diarioInput','orcInput']){
        assert.ok(luminosity(hex(styles[name].bg))<.23,
          platform+' '+name+' conserva fundo claro no dark mode');
      }
      if(theme==='light')for(const name of ['diarioInput','orcInput']){
        assert.ok(luminosity(hex(styles[name].bg))>.63,
          platform+' '+name+' tem fundo escuro no modo claro');
      }
      count++;
      console.log(JSON.stringify({pass:true,platform,path,theme,components:18,
        finance:{bg:hex(styles.finance.bg),text:hex(styles.finance.text),
          title:hex(styles.finance.label),value:hex(styles.finance.amount)},
        errors:errors.length}));
    }
    await page.close();
   }
  }finally{await browser.close()}
 }
 console.log('PASSOU '+count+' combinacoes de tela/dispositivo/tema');
})().catch(e=>{console.error('FAIL OBRIX contraste',e);process.exitCode=1});