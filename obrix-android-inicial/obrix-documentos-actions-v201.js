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
      if(!d?.caminho_arquivo)throw new Error('Este registro antigo não possui arquivo salvo.');
      const sb=await OBRIX_BACKEND.init();
      const {data,error}=await sb.storage.from('obrix-documentos').createSignedUrl(d.caminho_arquivo,300);
      if(error)throw error;
      if(!data?.signedUrl)throw new Error('Não foi possível gerar a visualização.');
      if(aba) aba.location.replace(data.signedUrl);
      else window.location.href=data.signedUrl;
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

  function criarBotao(texto,classe,atributo,id){
    const b=document.createElement('button');
    b.type='button';
    b.className=classe;
    b.textContent=texto;
    b.setAttribute(atributo,id);
    return b;
  }

  function ajustarHistorico(root=document){
    root.querySelectorAll?.('.history-item').forEach(item=>{
      const actions=item.querySelector('.history-actions');
      if(!actions)return;

      const antigo=actions.querySelector('[data-baixar]');
      if(antigo){
        const id=antigo.getAttribute('data-baixar');
        antigo.remove();
        if(!actions.querySelector('[data-visualizar-arquivo]')) actions.insertBefore(criarBotao('Visualizar','secondary','data-visualizar-arquivo',id),actions.firstChild);
        if(!actions.querySelector('[data-baixar-arquivo]')) actions.insertBefore(criarBotao('Baixar arquivo','secondary','data-baixar-arquivo',id),actions.querySelector('[data-excluir]'));
        if(!actions.querySelector('[data-compartilhar-arquivo]')) actions.insertBefore(criarBotao('Compartilhar','secondary','data-compartilhar-arquivo',id),actions.querySelector('[data-excluir]'));
        actions.querySelector('[data-sem-arquivo]')?.remove();
        return;
      }

      if(actions.querySelector('[data-visualizar-arquivo],[data-baixar-arquivo],[data-compartilhar-arquivo]')) return;
      if(actions.querySelector('[data-sem-arquivo]')) return;

      const aviso=criarBotao('Sem arquivo salvo','secondary','data-sem-arquivo','1');
      aviso.disabled=true;
      actions.insertBefore(aviso,actions.firstChild);
    });
  }

  document.addEventListener('click',e=>{
    const visualizar=e.target.closest?.('[data-visualizar-arquivo]');
    if(visualizar){e.preventDefault();visualizarArquivo(visualizar.getAttribute('data-visualizar-arquivo'));return;}
    const baixar=e.target.closest?.('[data-baixar-arquivo]');
    if(baixar){e.preventDefault();baixarArquivo(baixar.getAttribute('data-baixar-arquivo'));return;}
    const compartilhar=e.target.closest?.('[data-compartilhar-arquivo]');
    if(compartilhar){e.preventDefault();compartilharArquivo(compartilhar.getAttribute('data-compartilhar-arquivo'));}
  });

  const iniciar=()=>{
    ajustarHistorico(document);
    const historico=document.getElementById('historico');
    if(historico){
      new MutationObserver(()=>ajustarHistorico(historico)).observe(historico,{childList:true,subtree:true});
      let tentativas=0;
      const timer=setInterval(()=>{
        ajustarHistorico(historico);
        if(++tentativas>=20)clearInterval(timer);
      },500);
    }
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  else iniciar();
})();
