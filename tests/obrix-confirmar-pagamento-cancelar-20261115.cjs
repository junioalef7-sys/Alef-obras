'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function mock(source){
  let latest=null;
  const styles={},events=new Map();
  class Element{
    constructor(tag){this.tagName=tag.toUpperCase();this.style={cssText:''};this.textContent='';this.removed=false;this.children=new Map();}
    set innerHTML(html){
      this.html=html;
      for(const tag of ['h2','p','.obrixConfirmCancel','.obrixConfirmPagamento']){
        this.children.set(tag,new Element(tag.startsWith('.')?'button':tag));
      }
      this.children.set('button',this.children.get('.obrixConfirmCancel'));
    }
    querySelector(sel){return this.children.get(sel)||null}
    addEventListener(name,fn){this['event_'+name]=fn}
    remove(){this.removed=true}
    focus(){this.focused=true}
    toString(){return '[object HTMLButtonElement]'}
  }
  const document={
    head:{appendChild(el){styles[el.id]=el}},
    body:{appendChild(el){latest=el}},
    createElement:tag=>new Element(tag),
    getElementById:id=>styles[id]||null,
    addEventListener:(name,fn)=>events.set(name,fn),
    removeEventListener:name=>events.delete(name)
  };
  const window={};
  vm.runInNewContext(source,{window,document});
  return {window,events,get overlay(){return latest}};
}
for(const file of ['obrix-confirmar-acoes.js','obrix-android-inicial/obrix-confirmar-acoes.js']){
  const source=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  test(file+': botão Cancelar tem texto correto e retorna false',async()=>{
    const h=mock(source),pending=h.window.OBRIX_CONFIRMAR_PAGAMENTO({
      titulo:'Confirmar pagamento da equipe',
      mensagem:'Funcionários: 2\nLíquido total: R$ 6.580,00',
      confirmar:'Confirmar pagamento'
    });
    const button=h.overlay.querySelector('.obrixConfirmCancel');
    assert.equal(button.textContent,'Cancelar');
    assert.notEqual(button.textContent,'[object HTMLButtonElement]');
    button.onclick();
    assert.equal(await pending,false);
    assert.equal(h.overlay.removed,true);
  });
  test(file+': confirmação positiva conserva texto, cor e retorno',async()=>{
    const h=mock(source),pending=h.window.OBRIX_CONFIRMAR_PAGAMENTO({});
    const button=h.overlay.querySelector('.obrixConfirmPagamento');
    assert.equal(button.textContent,'Confirmar pagamento');
    assert.match(button.style.cssText,/background:/);
    button.onclick();
    assert.equal(await pending,true);
  });
  test(file+': texto personalizado do cancelamento',async()=>{
    const h=mock(source),pending=h.window.OBRIX_CONFIRMAR_PAGAMENTO({cancelar:'Voltar'});
    const button=h.overlay.querySelector('.obrixConfirmCancel');
    assert.equal(button.textContent,'Voltar');
    button.onclick();
    assert.equal(await pending,false);
  });
  test(file+': tecla Escape cancela',async()=>{
    const h=mock(source),pending=h.window.OBRIX_CONFIRMAR_PAGAMENTO({});
    h.events.get('keydown')({key:'Escape',preventDefault(){}});
    assert.equal(await pending,false);
  });
  test(file+': segundo clique não confirma pagamento cancelado',async()=>{
    const h=mock(source),pending=h.window.OBRIX_CONFIRMAR_PAGAMENTO({});
    h.overlay.querySelector('.obrixConfirmCancel').onclick();
    h.overlay.querySelector('.obrixConfirmPagamento').onclick();
    assert.equal(await pending,false);
  });
}
