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
  box.append(h,p,btn,result);
  status.insertAdjacentElement('afterend',box);
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
      makeRow('Credenciais OAuth',pix.credenciaisConfiguradas);
      makeRow('Proteção do webhook Pix',pix.protecaoWebhookConfigurada);
      makeRow('Boletos — configuração básica',bol.prontoParaTesteDeAutenticacao);
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
