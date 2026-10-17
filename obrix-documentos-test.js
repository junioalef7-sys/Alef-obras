(()=>{
  'use strict';

  const $=id=>document.getElementById(id);
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let obras=[];
  let clientes=[];
  let funcs=[];
  let perfil=null;
  let tipo='recibo';
  let ultimo=null;

  async function init(){
    return OBRIX_BACKEND.init();
  }

  function mostrarApp(){
    $('app')?.classList.remove('hidden');
    $('login')?.classList.add('hidden');
  }

  async function carregar(){
    perfil=await OBRIX_BACKEND.profile();
    mostrarApp();
    if($('status')) $('status').textContent='Carregando dados...';

    [obras,clientes,funcs]=await Promise.all([
      OBRIX_BACKEND.readTable('obras','criado_em'),
      OBRIX_BACKEND.readTable('clientes','criado_em'),
      OBRIX_BACKEND.readTable('funcionarios','criado_em')
    ]);

    const opts='<option value="">Selecione</option>'+obras.map(o=>`<option value="${o.id}">${esc(o.nome)}</option>`).join('');
    $('recObra').innerHTML=opts;
    $('conObra').innerHTML=opts;
    $('recDestinatario').innerHTML='<option value="">Selecione</option>'+
      clientes.map(x=>`<option value="cliente:${x.id}">Cliente — ${esc(x.nome)}</option>`).join('')+
      funcs.map(x=>`<option value="funcionario:${x.id}">Funcionário — ${esc(x.nome)}</option>`).join('');
    $('recData').value=new Date().toISOString().slice(0,10);

    await historico();
    if($('status')) $('status').textContent='';
  }

  function troca(t){
    tipo=t;
    $('formRecibo').classList.toggle('hidden',t!=='recibo');
    $('formContrato').classList.toggle('hidden',t!=='contrato');
    $('tabRecibo').classList.toggle('active',t==='recibo');
    $('tabContrato').classList.toggle('active',t==='contrato');
    $('preview').innerHTML='';
    ultimo=null;
  }

  function gerar(){
    try{
      if(tipo==='recibo'){
        const nome=$('recNome').value.trim();
        const valor=Number(String($('recValor').value||'').replace(/\./g,'').replace(',','.'))||0;
        const desc=$('recDescricao').value.trim()||'serviços prestados';
        const data=$('recData').value||new Date().toISOString().slice(0,10);
        const obra=obras.find(o=>o.id===$('recObra').value);
        if(!nome||valor<=0) throw new Error('Informe nome e valor.');
        ultimo={categoria:'recibo',titulo:`Recibo - ${nome}`,descricao:`${money(valor)} - ${desc}`,obra_id:obra?.id||null,data_documento:data};
        $('preview').innerHTML=`<h1>RECIBO</h1><p>Recebi de <b>${esc($('recEmitente').value||'OBRIX')}</b> a importância de <b>${money(valor)}</b>, referente a <b>${esc(desc)}</b>.</p>${obra?`<p><b>Obra:</b> ${esc(obra.nome)}</p>`:''}<p><b>Data:</b> ${new Date(data+'T12:00:00').toLocaleDateString('pt-BR')}</p><div class="sig"><span>${esc(nome)}</span></div>`;
      }else{
        const cliente=$('conCliente').value.trim();
        const valor=Number(String($('conValor').value||'').replace(/\./g,'').replace(',','.'))||0;
        const obra=obras.find(o=>o.id===$('conObra').value);
        if(!cliente||valor<=0) throw new Error('Informe cliente e valor.');
        const servico=$('conServico').value.trim()||'serviços de construção civil';
        ultimo={categoria:'contrato',titulo:`Contrato - ${cliente}`,descricao:`${servico} - ${money(valor)}`,obra_id:obra?.id||null,data_documento:$('conInicio').value||new Date().toISOString().slice(0,10)};
        $('preview').innerHTML=`<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1><p><b>CONTRATANTE:</b> ${esc(cliente)}</p><p><b>OBJETO:</b> ${esc(servico)}</p><p><b>VALOR:</b> ${money(valor)}</p><p><b>CONDIÇÕES:</b> ${esc($('conCondicoes').value||'Conforme acordado entre as partes.')}</p><div class="sig"><span>${esc(cliente)}</span></div>`;
      }
      $('status').textContent='Prévia gerada com sucesso.';
      return true;
    }catch(e){
      $('status').textContent='Erro: '+(e.message||e);
      return false;
    }
  }

  async function registrar(){
    try{
      if(!ultimo&&!gerar()) return;
      const sb=await init();
      const {error}=await sb.from('documentos').insert({...ultimo,empresa_id:perfil.empresa_id,tipo_arquivo:'application/pdf'});
      if(error) throw error;
      $('status').textContent='Documento registrado com sucesso.';
      await historico();
    }catch(e){
      $('status').textContent='Erro ao registrar: '+(e.message||e);
    }
  }

  async function historico(){
    const ds=await OBRIX_BACKEND.readTable('documentos','created_at');
    $('historico').innerHTML=ds.length
      ?ds.slice(0,20).map(d=>`<div class="history-item"><b>${esc(d.titulo)}</b><br><span class="muted">${esc(d.categoria)} · ${esc(d.data_documento||'')}</span></div>`).join('')
      :'Nenhum documento registrado.';
  }

  async function entrar(){
    const btn=$('entrar');
    const status=$('loginStatus');
    try{
      if(btn){btn.disabled=true;btn.textContent='Entrando...';}
      if(status) status.textContent='Autenticando...';
      const sb=await init();
      const {error}=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('senha').value});
      if(error) throw error;
      if(status) status.textContent='Login confirmado. Carregando dados...';
      await carregar();
    }catch(e){
      const msg='Erro ao entrar: '+(e.message||e);
      if($('app')&&!$('app').classList.contains('hidden')){
        $('status').textContent=msg;
      }else if(status){
        status.textContent=msg;
      }
    }finally{
      if(btn){btn.disabled=false;btn.textContent='Entrar';}
    }
  }

  $('entrar').addEventListener('click',entrar);
  $('tabRecibo').addEventListener('click',()=>troca('recibo'));
  $('tabContrato').addEventListener('click',()=>troca('contrato'));
  $('recDestinatario').addEventListener('change',()=>{
    const [t,id]=String($('recDestinatario').value).split(':');
    const x=t==='cliente'?clientes.find(a=>a.id===id):funcs.find(a=>a.id===id);
    if(x) $('recNome').value=x.nome;
  });
  $('conObra').addEventListener('change',()=>{
    const o=obras.find(x=>x.id===$('conObra').value);
    if(o){
      $('conCliente').value=o.cliente||'';
      $('conValor').value=Number(o.valor_contrato||0).toLocaleString('pt-BR',{minimumFractionDigits:2});
      $('conServico').value=o.tipo_servico||'';
    }
  });
  $('gerar').addEventListener('click',gerar);
  $('registrar').addEventListener('click',registrar);

  window.OBRIX_DOCS={gerar};

  (async()=>{
    try{
      const sb=await init();
      const {data,error}=await sb.auth.getSession();
      if(error) throw error;
      if(data?.session) await carregar();
    }catch(e){
      if($('app')&&!$('app').classList.contains('hidden')){
        $('status').textContent='Erro ao carregar: '+(e.message||e);
      }else{
        $('loginStatus').textContent='Erro ao carregar sessão: '+(e.message||e);
      }
    }
  })();
})();