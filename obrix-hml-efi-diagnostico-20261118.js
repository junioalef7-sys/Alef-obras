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
  box.append(h,p,btn,result,authBtn,authResult);
  status.insertAdjacentElement('afterend',box);
  const statusText=estado=>({
    autenticacao_confirmada:'Conexão autenticada com sucesso',
    credenciais_ou_permissoes_recusadas:'Credenciais recusadas ou sem permissão',
    servico_indisponivel:'Servidor da Efí indisponível — tente novamente',
    resposta_nao_autorizada:'Resposta inesperada da Efí',
    resposta_sem_token:'Servidor respondeu, mas não forneceu token válido',
    falha_na_conexao_ou_certificado:'Falha de conexão ou certificado — verificar configuração',
    certificado_ou_chave_invalida:'Certificado ou chave privada com formato inválido',
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
