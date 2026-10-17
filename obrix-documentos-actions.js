(()=>{
  'use strict';

  const status=(msg,erro=false)=>{
    const el=document.getElementById('arquivoStatus');
    if(!el)return;
    el.textContent=msg;
    el.style.color=erro?'#9f1d20':'#166534';
  };

  async function obterDocumento(id){
    const docs=await OBRIX_BACKEND.readTable('documentos','created_at');
    return docs.find(d=>String(d.id)===String(id));
  }

  async function obterArquivo(d){
    if(!d?.caminho_arquivo)throw new Error('Arquivo não encontrado.');
    const sb=await OBRIX_BACKEND.init();
    const {data,error}=await sb.storage.from('obrix-documentos').download(d.caminho_arquivo);
    if(error)throw error;
    return data;
  }

  async function visualizarArquivo(id){
    let aba=null;
    try{
      aba=window.open('about:blank','_blank');
      status('Abrindo documento...');
      const d=await obterDocumento(id);
      if(!d?.caminho_arquivo)throw new Error('Arquivo não encontrado.');
      const sb=await OBRIX_BACKEND.init();
      const {data,error}=await sb.storage.from('obrix-documentos').createSignedUrl(d.caminho_arquivo,300);
      if(error)throw error;
      if(!data?.signedUrl)throw new Error('Não foi possível gerar a visualização.');
      if(aba){
        aba.location.replace(data.signedUrl);
      }else{
        window.location.href=data.signedUrl;
      }
      status('Documento aberto para visualização.');
    }catch(e){
      try{if(aba&&!aba.closed)aba.close();}catch(_){ }
      status('Erro ao visualizar: '+(e.message||e),true);
    }
  }

  async function baixarArquivo(id){
    try{
      status('Baixando documento...');
      const d=await obterDocumento(id);
      const data=await obterArquivo(d);
      const nome=d.nome_arquivo||'documento';
      const url=URL.createObjectURL(data);
      const a=document.createElement('a');
      a.href=url;
      a.download=nome;
      a.style.display='none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      status('Download iniciado.');
    }catch(e){
      status('Erro ao baixar: '+(e.message||e),true);
    }
  }

  async function compartilharArquivo(id){
    try{
      status('Preparando compartilhamento...');
      const d=await obterDocumento(id);
      const data=await obterArquivo(d);
      const nome=d.nome_arquivo||'documento';
      const file=new File([data],nome,{type:d.tipo_arquivo||data.type||'application/octet-stream'});
      if(!navigator.share||!navigator.canShare?.({files:[file]})){
        throw new Error('Compartilhamento direto não disponível neste navegador. Use Baixar arquivo.');
      }
      await navigator.share({files:[file],title:d.titulo||nome});
      status('Documento compartilhado.');
    }catch(e){
      if(e?.name==='AbortError')status('Compartilhamento cancelado.');
      else status('Erro ao compartilhar: '+(e.message||e),true);
    }
  }

  function separarBotoes(root=document){
    root.querySelectorAll?.('[data-baixar]').forEach(botaoAntigo=>{
      const id=botaoAntigo.dataset.baixar;
      if(!id)return;

      const visualizar=document.createElement('button');
      visualizar.type='button';
      visualizar.className='secondary';
      visualizar.textContent='Visualizar';
      visualizar.dataset.visualizarArquivo=id;

      const baixar=document.createElement('button');
      baixar.type='button';
      baixar.className='secondary';
      baixar.textContent='Baixar arquivo';
      baixar.dataset.baixarArquivo=id;

      const compartilhar=document.createElement('button');
      compartilhar.type='button';
      compartilhar.className='secondary';
      compartilhar.textContent='Compartilhar';
      compartilhar.dataset.compartilharArquivo=id;

      botaoAntigo.replaceWith(visualizar,baixar,compartilhar);
    });
  }

  document.addEventListener('click',e=>{
    const visualizar=e.target.closest?.('[data-visualizar-arquivo]');
    if(visualizar){
      e.preventDefault();
      visualizarArquivo(visualizar.dataset.visualizarArquivo);
      return;
    }
    const baixar=e.target.closest?.('[data-baixar-arquivo]');
    if(baixar){
      e.preventDefault();
      baixarArquivo(baixar.dataset.baixarArquivo);
      return;
    }
    const compartilhar=e.target.closest?.('[data-compartilhar-arquivo]');
    if(compartilhar){
      e.preventDefault();
      compartilharArquivo(compartilhar.dataset.compartilharArquivo);
    }
  });

  separarBotoes();
  const historico=document.getElementById('historico');
  if(historico){
    new MutationObserver(()=>separarBotoes(historico)).observe(historico,{childList:true,subtree:true});
  }
})();
