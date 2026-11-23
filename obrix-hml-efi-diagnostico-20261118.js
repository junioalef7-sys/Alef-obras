(()=>{
'use strict';
// Diagnóstico da Efí apenas no OBRIX de homologação. Não cria cobranças.
if(window.__OBRIX_HML_PROJECT_REF!=='xavwkfgrnowmusbkbiea')return;
if(window.OBRIX_HML_EFI_DIAGNOSTICO)return;
const id='obrixHmlEfiDiagnostico';
const add=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const label=(ok)=>ok?'Pronto':'Pendente';
function mount(sb,perfil){
  const parent=document.getElementById('assinaturaMain');
  const status=document.getElementById('assStatus');
  if(!parent||!status||!sb?.functions?.invoke||!perfil?.empresa_id)return;
  if(document.getElementById(id))return;
  const box=add('section');box.id=id;box.className='card';
  box.style.cssText='margin:12px 0;padding:16px';
  const h=add('h3','Diagnóstico da Efí — homologação');
  h.style.margin='0 0 8px';
  const p=add('p','Verifica somente se as credenciais de teste estão configuradas. Não gera Pix, boleto nem cobra valores.');
  const btn=add('button','Verificar configuração Efí');btn.type='button';btn.className='btn';
  btn.style.cssText='background:#e87900;color:#fff;border:0;padding:11px 14px;border-radius:10px;font-weight:700';
  const result=add('div');result.setAttribute('role','status');result.setAttribute('aria-live','polite');result.style.cssText='margin-top:12px;white-space:normal;font-size:14px;line-height:1.55';
  const authBtn=add('button','Testar autenticação com a Efí');
  authBtn.type='button';authBtn.className='btn';
  authBtn.style.cssText='display:block;margin-top:12px;background:#223146;color:#fff;border:1px solid #64748b;padding:11px 14px;border-radius:10px;font-weight:700';
  const authResult=add('div');
  authResult.setAttribute('role','status');authResult.setAttribute('aria-live','polite');
  authResult.style.cssText='margin-top:10px;white-space:normal;font-size:14px;line-height:1.5';
  const trialArea=add('div');
  trialArea.style.cssText='margin-top:18px;border-top:1px solid #475569;padding-top:12px';
  const trialTitle=add('h4','Pix simulado — ambiente de homologação');
  const trialNote=add('p','Teste técnico de uma cobrança simulada de R$ 1,00, sem dinheiro real. Não ativa nenhum plano ou assinatura OBRIX. Repetições reutilizam a mesma cobrança.');
  trialNote.style.cssText='font-size:14px;line-height:1.55';
  const createTrial=add('button','Gerar Pix simulado — R$ 1,00');
  const checkTrial=add('button','Consultar confirmação do Pix de teste');
  for(const el of [createTrial,checkTrial]){
    el.type='button';el.className='btn';
    el.style.cssText='margin:5px 8px 5px 0;padding:11px 12px;border:1px solid #64748b;border-radius:10px;background:#223146;color:#fff;font-weight:700';
  }
  const trialResult=add('div');
  trialResult.style.cssText='margin-top:9px;font-size:14px;line-height:1.5';
  trialResult.setAttribute('role','status');trialResult.setAttribute('aria-live','polite');
  const trialStatus={
    CONCLUIDA:'APROVADO — confirmação simulada da Efí. Nenhuma assinatura foi liberada.',
    ATIVA:'PENDENTE — cobrança de teste ativa, ainda sem confirmação.',
    nao_criado:'Ainda não há cobrança simulada para esta conta.'
  };
  async function testarTrial(acao){
    if(createTrial.disabled||checkTrial.disabled)return;
    createTrial.disabled=true;checkTrial.disabled=true;
    trialResult.replaceChildren(add('p','Consultando apenas a Efí de homologação...'));
    try{
      const {data,error}=await sb.functions.invoke('obrix-efi-pix-simulacao-hml-20261119',{body:{acao}});
      if(error||!data?.ok)throw Error(String(data?.erro||error?.message||'Falha no teste'));
      if(data.ambiente!=='homologacao'||data.assinaturaAlterada!==false)
        throw Error('Resultado fora do ambiente isolado');
      trialResult.replaceChildren(add('p',trialStatus[data.estado]||('Status do teste: '+String(data.estado||'desconhecido'))));
      trialResult.append(add('p','Valor de teste: R$ 1,00. Nenhum plano foi ativado.'));
    }catch(e){
      trialResult.replaceChildren(add('p','PENDENTE — '+String(e?.message||'Falha na consulta')));
    }finally{createTrial.disabled=false;checkTrial.disabled=false}
  }
  createTrial.onclick=()=>testarTrial('criar');
  checkTrial.onclick=()=>testarTrial('consultar');
  const webhookTitle=add('h4','Webhook Pix — verificar configuração');
  webhookTitle.style.cssText='margin:20px 0 6px;font-size:16px';
  const webhookInfo=add('p','Consulta somente leitura para identificar se já existe uma URL de webhook vinculada à chave Pix da Efí. Não cadastra, altera ou remove webhooks.');
  webhookInfo.style.cssText='font-size:14px;line-height:1.5';
  const webhookCheck=add('button','Consultar webhook Pix cadastrado');
  webhookCheck.type='button';webhookCheck.className='btn';
  webhookCheck.style.cssText='margin:5px 0;padding:11px 12px;border:1px solid #64748b;border-radius:10px;background:#223146;color:#fff;font-weight:700';
  const webhookOutput=add('p','');webhookOutput.setAttribute('role','status');
  webhookOutput.setAttribute('aria-live','polite');
  webhookOutput.style.cssText='margin:8px 0;font-size:14px;line-height:1.5';
  webhookCheck.addEventListener('click',async()=>{
    if(webhookCheck.disabled)return;
    webhookCheck.disabled=true;webhookOutput.textContent='Consultando a configuração existente na Efí...';
    try{
      const {data,error}=await sb.functions.invoke('obrix-efi-pix-simulacao-hml-20261119',{body:{acao:'webhook-status'}});
      let detalhes=data;
      if(error && error.context && typeof error.context.json==='function'){
        try{detalhes=await error.context.json()}catch{/* responder sem segredos */}
      }
      if(error||!detalhes?.ok){
        const erro=String(detalhes?.erro||'consulta_indisponivel');
        const http=Number(detalhes?.httpEfipay);
        const httpValid=Number.isInteger(http)&&http>=400&&http<=599?http:null;
        const httpLista=Number(detalhes?.consultaListaHttp);
        const httpListaValido=Number.isInteger(httpLista)&&httpLista>=200&&httpLista<=599?httpLista:null;
        const classificacao=String(detalhes?.classificacao||'');
        const aviso400=httpValid===400?
          ' A consulta pela chave foi rejeitada (HTTP 400).'+
          (httpListaValido?' A consulta alternativa da lista também não retornou uma lista válida (HTTP '+httpListaValido+').':'')+
          (classificacao==='valor_invalido'||classificacao==='chave_invalida'
            ?' A Efí indicou parâmetro ou chave inválidos; verificar a chave configurada no ambiente de teste, sem divulgá-la.':''):'';
        const mensagens={
          sem_permissao_webhook_read:'Efí negou a consulta ao webhook (HTTP 403). Verifique a autorização webhook.read.',
          falha_consulta_webhook_pix:aviso400 ||
            'A Efí retornou erro ao consultar o webhook'+(httpValid?' (HTTP '+httpValid+')':'')+'. A configuração ainda não foi determinada.',
          resposta_webhook_sem_url:'A Efí respondeu, mas sem o endereço do webhook.',
          endereco_webhook_invalido:'A Efí retornou um endereço de webhook não reconhecido.',
          consulta_indisponivel:'A função de consulta não respondeu normalmente. Confira a sessão de homologação.'
        };
        throw Error(mensagens[erro]||'Consulta pendente — código de erro não reconhecido.');
      }
      if(detalhes.ambiente!=='homologacao'||detalhes.acao!=='webhook-status'||detalhes.assinaturaAlterada!==false)
        throw Error('Resposta fora da homologação');
      webhookOutput.textContent=({
        nao_configurado:'Nenhum webhook Pix cadastrado para esta chave no ambiente de teste.',
        configurado_no_projeto_isolado:'Existe um webhook Pix apontando para o Supabase isolado. Entrega mTLS e eventos ainda não testados.',
        configurado_em_outro_endereco:'Existe um webhook Pix apontando para outro endereço. Não substituir sem revisão.',
        nao_localizado_na_lista:'A consulta direta foi rejeitada (HTTP 400). A consulta alternativa não localizou a chave Pix no intervalo pesquisado. Isso NÃO confirma ausência de webhook.'
      })[detalhes.configuracao]||'Configuração não reconhecida.';
    }catch(err){
      const code=String(err?.message||'Falha na consulta');
      webhookOutput.textContent=code==='sem_permissao_webhook_read'
        ?'O aplicativo Efí não tem permissão webhook.read para esta consulta.'
        :'PENDENTE — '+code;
    }finally{webhookCheck.disabled=false}
  });
  trialArea.append(trialTitle,trialNote,createTrial,checkTrial,trialResult,
    webhookTitle,webhookInfo,webhookCheck,webhookOutput);
  box.append(h,p,btn,result,authBtn,authResult,trialArea);
  // Na simulacao do trial vencido, a escolha da obra e do funcionario vem antes do diagnostico Efí.
  // Mesmo com ambos os paineis, mantemos a ordem sem qualquer gravacao no backend.
  const limitedPanel=document.getElementById('obrixHmlLimitedPanel');
  (limitedPanel?.isConnected?limitedPanel:status).insertAdjacentElement('afterend',box);
  const statusText=estado=>({
    autenticacao_confirmada:'Conexão autenticada com sucesso',
    credenciais_ou_permissoes_recusadas:'Credenciais recusadas ou sem permissão',
    servico_indisponivel:'Servidor da Efí indisponível — tente novamente',
    resposta_nao_autorizada:'Resposta inesperada da Efí',
    resposta_sem_token:'Servidor respondeu, mas não forneceu token válido',
    falha_na_conexao_ou_certificado:'Falha de conexão ou certificado — verificar configuração',
    certificado_ou_chave_invalida:'Certificado ou chave privada com formato inválido',
    certificado_ou_chave_ilegivel:'Certificado ou chave privada não puderam ser lidos pelo servidor',
    formato_chave_privada_legado:'Chave privada está em formato legado; necessário PKCS#8',
    chave_privada_sem_cabecalho_pkcs8:'Chave privada não está em formato PKCS#8',
    certificado_pem_com_formato_invalido:'O certificado PEM tem formato inválido ou foi colado incompleto',
    certificado_sem_cabecalho:'Certificado incompleto: falta o início BEGIN CERTIFICATE',
    certificado_sem_rodape:'Certificado incompleto: falta o final END CERTIFICATE',
    certificado_incompleto:'Certificado sem conteúdo suficiente — verifique a colagem',
    certificado_caracteres_invalidos:'Certificado contém caracteres incompatíveis com PEM',
    certificado_base64_incompleto:'Certificado com Base64 incompleto — verifique a colagem',
    certificado_base64_ilegivel:'Certificado com conteúdo Base64 ilegível',
    certificado_der_invalido:'Certificado não contém estrutura DER válida',
    chave_privada_sem_cabecalho:'Chave privada sem cabeçalho PEM',
    chave_privada_sem_rodape:'Chave privada incompleta — falta o final PEM',
    chave_privada_incompleto:'Chave privada incompleta — confira a colagem',
    chave_privada_caracteres_invalidos:'Chave privada com caracteres inesperados',
    chave_privada_base64_incompleto:'Chave privada com Base64 incompleto',
    chave_privada_base64_ilegivel:'Chave privada com Base64 ilegível',
    chave_privada_der_invalido:'Chave privada com estrutura DER inválida',

    chave_privada_pem_com_formato_invalido:'A chave privada PEM tem formato inválido ou foi colada incompleta',
    chave_nao_corresponde_ao_certificado:'A chave privada não corresponde ao certificado — verificar o par',
    falha_ao_inicializar_cliente_tls:'Falha ao iniciar conexão segura no Supabase — verificar compatibilidade do runtime',
    falha_na_conexao_tls_com_efi:'Não foi possível estabelecer a conexão TLS com a Efí',
    tempo_limite_na_conexao_tls:'A conexão TLS com a Efí excedeu o tempo limite',
    erro_ao_interpretar_resposta_oauth:'Falha ao interpretar resposta da Efí',
    configuracao_pix_incompleta:'Faltam credenciais ou certificado Pix',
    configuracao_cobrancas_incompleta:'Faltam credenciais de Cobranças',
    endereco_de_homologacao_incorreto:'Endereço incorreto para homologação'
  })[estado]||'Não foi possível autenticar';
  authBtn.addEventListener('click',async()=>{
    if(authBtn.disabled)return;
    authBtn.disabled=true;authBtn.textContent='Testando autenticação...';
    authResult.replaceChildren(add('p','Consultando apenas os endpoints OAuth de homologação. Nenhuma cobrança será emitida.'));
    try{
      const {data,error}=await sb.functions.invoke('obrix-efi-oauth-probe-hml-20261118',{body:{acao:'testar-oauth'}});
      if(error||!data?.ok)throw new Error(String(data?.erro||error?.message||'Falha ao testar autenticação.'));
      if(data.ambiente!=='homologacao_isolada')throw new Error('Resposta fora da homologação.');
      authResult.replaceChildren();
      for(const [name,res] of [['Pix',data.pix],['Cobranças',data.cobrancas]]){
        const row=add('p',name+': '+(res?.ok===true?'APROVADO — ':'PENDENTE — ')+statusText(res?.estado));
        row.style.margin='6px 0';row.style.fontWeight='600';authResult.append(row);
      }
      authResult.append(add('p','Teste apenas de autenticação. Nenhum Pix, boleto ou pagamento foi gerado.'));
    }catch(err){
      authResult.replaceChildren(add('p',String(err?.message||'Falha na comunicação com o diagnóstico.')));
    }finally{
      authBtn.disabled=false;authBtn.textContent='Testar autenticação com a Efí';
    }
  });
  btn.addEventListener('click',async()=>{
    if(btn.disabled)return;
    btn.disabled=true;btn.textContent='Conferindo...';result.replaceChildren(add('p','Verificando configuração do ambiente isolado...'));
    try {
      const {data,error}=await sb.functions.invoke('obrix-efi-preflight-hml-20261118',{body:{acao:'verificacao'}});
      if(error||!data?.ok)throw new Error(String(data?.error||error?.message||'Não foi possível consultar o diagnóstico.'));
      if(data.ambiente!=='homologacao_isolada')throw new Error('Resposta fora do ambiente isolado.');
      const pix=data.pix||{}, bol=data.boleto||{};
      result.replaceChildren();
      const makeRow=(name,ok)=>{
        const row=add('p',name+': '+label(ok===true));
        row.style.margin='5px 0';row.style.fontWeight='500';
        result.append(row);
      };
      makeRow('Pix — configuração básica',pix.prontoParaTesteDeAutenticacao);
      makeRow('Endereço Pix de homologação',pix.enderecoDeHomologacaoCorreto);
      makeRow('Certificado Pix de teste',pix.certificadoConfigurado);
      makeRow('Chave Pix de teste',pix.chavePixConfigurada);
      makeRow('Credenciais OAuth — Pix',pix.credenciaisConfiguradas);
      makeRow('Proteção do webhook Pix',pix.protecaoWebhookConfigurada);
      makeRow('Boletos — configuração básica',bol.prontoParaTesteDeAutenticacao);
      makeRow('Credenciais OAuth — Cobranças',bol.credenciaisConfiguradas);
      makeRow('Endereço de cobranças',bol.enderecoDeHomologacaoCorreto);
      makeRow('Proteção do webhook de cobranças',bol.protecaoWebhookConfigurada);
      result.append(add('p','Importante: este resultado confirma apenas a presença das configurações. A autenticação real com a Efí ainda depende de um teste separado.'));
    }catch(err){
      result.replaceChildren(add('p',String(err?.message||'Falha na verificação.')));
    }finally{
      btn.disabled=false;btn.textContent='Verificar configuração Efí';
    }
  });
}
window.OBRIX_HML_EFI_DIAGNOSTICO={mount};
})();
