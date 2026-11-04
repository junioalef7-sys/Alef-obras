(()=>{
  'use strict';

  const $=id=>document.getElementById(id);
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const safe=s=>String(s||'arquivo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'arquivo';

  let obras=[];
  let clientes=[];
  let funcs=[];
  let perfil=null;
  let tipo='recibo';
  let ultimo=null;
  let documentos=[];

  async function init(){return OBRIX_BACKEND.init();}

  function mostrarApp(){
    $('app')?.classList.remove('hidden');
    $('login')?.classList.add('hidden');
  }

  function setStatus(msg,erro=false){
    if(!$('status'))return;
    $('status').textContent=msg;
    $('status').style.color=erro?'#9f1d20':'#166534';
  }

  function setArquivoStatus(msg,erro=false){
    if(!$('arquivoStatus'))return;
    $('arquivoStatus').textContent=msg;
    $('arquivoStatus').style.color=erro?'#9f1d20':'#166534';
  }

  function mimeByName(name,type){
    if(type)return type;
    const ext=String(name||'').toLowerCase().split('.').pop();
    const map={
      pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',heic:'image/heic',heif:'image/heif',
      doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt:'text/plain',csv:'text/csv',zip:'application/zip',dwg:'application/dwg',dxf:'application/dxf'
    };
    return map[ext]||'application/octet-stream';
  }

  function obraNome(id){return obras.find(o=>o.id===id)?.nome||'Sem obra';}

  async function carregar(){
    perfil=await OBRIX_BACKEND.profile();
    mostrarApp();
    setStatus('Carregando dados...');

    [obras,clientes,funcs]=await Promise.all([
      OBRIX_BACKEND.readTable('obras','criado_em'),
      OBRIX_BACKEND.readTable('clientes','criado_em'),
      OBRIX_BACKEND.readTable('funcionarios','criado_em')
    ]);

    const opts='<option value="">Selecione</option>'+obras.map(o=>`<option value="${o.id}">${esc(o.nome)}</option>`).join('');
    $('recObra').innerHTML=opts;
    $('conObra').innerHTML=opts;
    $('arqObra').innerHTML='<option value="">Sem obra vinculada</option>'+obras.map(o=>`<option value="${o.id}">${esc(o.nome)}</option>`).join('');
    $('recDestinatario').innerHTML='<option value="">Selecione</option>'+
      clientes.map(x=>`<option value="cliente:${x.id}">Cliente — ${esc(x.nome)}</option>`).join('')+
      funcs.map(x=>`<option value="funcionario:${x.id}">Funcionário — ${esc(x.nome)}</option>`).join('');
    $('recData').value=new Date().toISOString().slice(0,10);

    await historico();
    setStatus('');
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
        const dest=$('recDestinatario').value;
        const cliente_id=dest.startsWith('cliente:')?dest.split(':')[1]:null;
        const funcionario_id=dest.startsWith('funcionario:')?dest.split(':')[1]:null;
        ultimo={categoria:'recibo',titulo:`Recibo - ${nome}`,descricao:`${money(valor)} - ${desc}`,obra_id:obra?.id||null,cliente_id,funcionario_id,data_documento:data};
        $('preview').innerHTML=`<h1>RECIBO</h1><p>Recebi de <b>${esc($('recEmitente').value||'OBRIX')}</b> a importância de <b>${money(valor)}</b>, referente a <b>${esc(desc)}</b>.</p>${obra?`<p><b>Obra:</b> ${esc(obra.nome)}</p>`:''}<p><b>Data:</b> ${new Date(data+'T12:00:00').toLocaleDateString('pt-BR')}</p><div class="sig"><span>${esc(nome)}</span></div>`;
      }else{
        const cliente=$('conCliente').value.trim();
        const valor=Number(String($('conValor').value||'').replace(/\./g,'').replace(',','.'))||0;
        const obra=obras.find(o=>o.id===$('conObra').value);
        if(!cliente||valor<=0) throw new Error('Informe cliente e valor.');
        const servico=$('conServico').value.trim()||'serviços de construção civil';
        const cli=clientes.find(c=>String(c.nome||'').trim().toLowerCase()===cliente.toLowerCase());
        ultimo={categoria:'contrato',titulo:`Contrato - ${cliente}`,descricao:`${servico} - ${money(valor)}`,obra_id:obra?.id||null,cliente_id:cli?.id||obra?.cliente_id||null,funcionario_id:null,data_documento:$('conInicio').value||new Date().toISOString().slice(0,10)};
        $('preview').innerHTML=`<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1><p><b>CONTRATANTE:</b> ${esc(cliente)}</p><p><b>OBJETO:</b> ${esc(servico)}</p><p><b>VALOR:</b> ${money(valor)}</p><p><b>CONDIÇÕES:</b> ${esc($('conCondicoes').value||'Conforme acordado entre as partes.')}</p><div class="sig"><span>${esc(cliente)}</span></div>`;
      }
      setStatus('Prévia gerada com sucesso.');
      return true;
    }catch(e){
      setStatus('Erro: '+(e.message||e),true);
      return false;
    }
  }

  async function guardarArquivoStorage(file,base){
    const sb=await init();
    const obraPasta=base.obra_id||'geral';
    const nome=`${Date.now()}-${safe(file.name)}`;
    const path=`${perfil.empresa_id}/${obraPasta}/${nome}`;
    const contentType=mimeByName(file.name,file.type);
    const {error:uploadError}=await sb.storage.from('obrix-documentos').upload(path,file,{cacheControl:'3600',upsert:false,contentType});
    if(uploadError)throw uploadError;
    const registro={
      empresa_id:perfil.empresa_id,
      obra_id:base.obra_id||null,
      cliente_id:base.cliente_id||null,
      funcionario_id:base.funcionario_id||null,
      titulo:base.titulo||file.name,
      descricao:base.descricao||null,
      categoria:base.categoria||'outros',
      nome_arquivo:file.name,
      caminho_arquivo:path,
      tipo_arquivo:contentType,
      tamanho_bytes:file.size||null,
      data_documento:base.data_documento||new Date().toISOString().slice(0,10)
    };
    const {error:dbError}=await sb.from('documentos').insert(registro);
    if(dbError){
      await sb.storage.from('obrix-documentos').remove([path]);
      throw dbError;
    }
    return registro;
  }

  async function registrar(){
    const btn=$('registrar');
    try{
      if(!ultimo&&!gerar())return;
      if(!window.OBRIX_DOC_PDF?.buildFile)throw new Error('Gerador de PDF ainda não carregou.');
      if(btn){btn.disabled=true;btn.textContent='Guardando PDF...';}
      setStatus('Gerando e guardando PDF no OBRIX...');
      const file=await window.OBRIX_DOC_PDF.buildFile();
      await guardarArquivoStorage(file,ultimo);
      setStatus('PDF guardado no OBRIX com sucesso.');
      await historico();
    }catch(e){
      setStatus('Erro ao guardar PDF: '+(e.message||e),true);
    }finally{
      if(btn){btn.disabled=false;btn.textContent='Guardar PDF no OBRIX';}
    }
  }

  async function guardarArquivo(){
    const btn=$('guardarArquivo');
    try{
      const file=$('arqArquivo').files?.[0];
      if(!file)throw new Error('Escolha um arquivo.');
      if(file.size>50*1024*1024)throw new Error('O arquivo ultrapassa 50 MB.');
      const titulo=$('arqTitulo').value.trim()||file.name;
      if(btn){btn.disabled=true;btn.textContent='Guardando...';}
      setArquivoStatus('Enviando arquivo...');
      await guardarArquivoStorage(file,{
        obra_id:$('arqObra').value||null,
        categoria:$('arqCategoria').value||'outros',
        titulo,
        descricao:null,
        data_documento:new Date().toISOString().slice(0,10)
      });
      $('arqTitulo').value='';
      $('arqArquivo').value='';
      setArquivoStatus('Documento guardado com sucesso.');
      await historico();
    }catch(e){
      setArquivoStatus('Erro ao guardar: '+(e.message||e),true);
    }finally{
      if(btn){btn.disabled=false;btn.textContent='Guardar documento';}
    }
  }

  async function baixar(id){
    const d=documentos.find(x=>x.id===id);
    if(!d?.caminho_arquivo)return;
    try{
      setArquivoStatus('Baixando documento...');
      const sb=await init();
      const {data,error}=await sb.storage.from('obrix-documentos').download(d.caminho_arquivo);
      if(error)throw error;
      const nome=d.nome_arquivo||'documento';
      const file=new File([data],nome,{type:d.tipo_arquivo||data.type||'application/octet-stream'});
      if(navigator.share&&navigator.canShare?.({files:[file]})){
        await navigator.share({files:[file],title:d.titulo||nome});
        setArquivoStatus('Documento pronto para salvar ou compartilhar.');
      }else{
        const url=URL.createObjectURL(data),a=document.createElement('a');
        a.href=url;a.download=nome;document.body.appendChild(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),60000);
        setArquivoStatus('Download iniciado.');
      }
    }catch(e){
      if(e?.name==='AbortError')setArquivoStatus('Compartilhamento cancelado.');
      else setArquivoStatus('Erro ao baixar: '+(e.message||e),true);
    }
  }

  async function excluir(id){
    const d=documentos.find(x=>x.id===id);
    if(!d)return;
    if(!confirm(`Excluir "${d.titulo}"?`))return;
    try{
      const sb=await init();
      setArquivoStatus('Excluindo documento...');
      if(d.caminho_arquivo){
        const {error:storageError}=await sb.storage.from('obrix-documentos').remove([d.caminho_arquivo]);
        if(storageError)throw storageError;
      }
      const {error}=await sb.from('documentos').delete().eq('id',id);
      if(error)throw error;
      setArquivoStatus('Documento excluído.');
      await historico();
    }catch(e){
      setArquivoStatus('Erro ao excluir: '+(e.message||e),true);
    }
  }

  async function historico(){
    documentos=await OBRIX_BACKEND.readTable('documentos','created_at');
    $('historico').innerHTML=documentos.length?documentos.slice(0,100).map(d=>{
      const arquivo=d.caminho_arquivo?`<div class="history-actions"><button class="secondary" type="button" data-baixar="${d.id}">Baixar / Compartilhar</button><button class="danger" type="button" data-excluir="${d.id}">Excluir</button></div>`:`<div class="history-actions"><button class="danger" type="button" data-excluir="${d.id}">Excluir registro</button></div>`;
      return `<div class="history-item"><b>${esc(d.titulo)}</b><br><span class="muted">${esc(d.categoria)} · ${esc(obraNome(d.obra_id))} · ${esc(d.data_documento||'')}${d.nome_arquivo?' · '+esc(d.nome_arquivo):''}</span>${arquivo}</div>`;
    }).join(''):'Nenhum documento guardado.';
    $('historico').querySelectorAll('[data-baixar]').forEach(b=>b.addEventListener('click',()=>baixar(b.dataset.baixar)));
    $('historico').querySelectorAll('[data-excluir]').forEach(b=>b.addEventListener('click',()=>excluir(b.dataset.excluir)));
  }

  async function entrar(){
    const btn=$('entrar'),status=$('loginStatus');
    try{
      if(btn){btn.disabled=true;btn.textContent='Entrando...';}
      if(status)status.textContent='Autenticando...';
      const sb=await init();
      const {error}=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('senha').value});
      if(error)throw error;
      if(status)status.textContent='Login confirmado. Carregando dados...';
      await carregar();
    }catch(e){
      const msg='Erro ao entrar: '+(e.message||e);
      if($('app')&&!$('app').classList.contains('hidden'))setStatus(msg,true);else if(status)status.textContent=msg;
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
    if(x)$('recNome').value=x.nome;
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
  $('guardarArquivo').addEventListener('click',guardarArquivo);

  window.OBRIX_DOCS={gerar,historico};

  (async()=>{
    try{
      const sb=await init();
      const {data,error}=await sb.auth.getSession();
      if(error)throw error;
      if(data?.session)await carregar();
    }catch(e){
      if($('app')&&!$('app').classList.contains('hidden'))setStatus('Erro ao carregar: '+(e.message||e),true);
      else $('loginStatus').textContent='Erro ao carregar sessão: '+(e.message||e);
    }
  })();
})();