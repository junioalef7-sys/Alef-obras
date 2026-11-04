(()=>{
'use strict';
if(window.__OBRIX_EQUIPE_LAYOUT_V2)return;window.__OBRIX_EQUIPE_LAYOUT_V2=true;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=v=>String(v??'').trim()||'Não informado';
function funcs(){try{return Array.isArray(window.funcionarios)?window.funcionarios:(typeof funcionarios!=='undefined'&&Array.isArray(funcionarios)?funcionarios:[])}catch(_){return[]}}
function obrasList(){try{return Array.isArray(window.obras)?window.obras:(typeof obras!=='undefined'&&Array.isArray(obras)?obras:[])}catch(_){return[]}}
function achar(id){return funcs().find(f=>String(f.id)===String(id))||null}
function obraNome(id){return obrasList().find(o=>String(o.id)===String(id))?.nome||'Sem obra vinculada'}
function campo(rotulo,valor){return `<div class="obrix-pessoal2-campo"><small>${esc(rotulo)}</small><b>${esc(txt(valor))}</b></div>`}
function abrirDetalhes(id){
 const f=achar(id);if(!f)return;
 document.querySelector('.obrix-pessoal2-screen')?.remove();
 const tela=document.createElement('div');tela.className='obrix-pessoal2-screen';
 tela.innerHTML=`<div class="obrix-pessoal2-page"><div class="obrix-pessoal2-head"><button type="button" class="obrix-pessoal2-voltar" aria-label="Voltar">←</button><div><h2>${esc(f.nome||'Funcionário')}</h2><p>${esc(f.cargo||'Funcionário')}</p></div><button type="button" class="obrix-pessoal2-fechar" aria-label="Fechar">×</button></div><div class="obrix-pessoal2-grid">${campo('Nome completo',f.nome)}${campo('Cargo / Função',f.cargo)}${campo('Status',f.ativo===false?'Inativo':'Ativo')}${campo('Obra vinculada',obraNome(f.obra_id))}${campo('CPF',f.cpf)}${campo('Telefone',f.telefone)}${campo('E-mail',f.email)}${campo('Endereço',f.endereco)}${campo('Banco',f.banco)}${campo('Agência',f.agencia)}${campo('Conta',f.conta)}${campo('Tipo de conta',f.tipo_conta)}${campo('Tipo de chave Pix',f.pix_tipo)}${campo('Chave Pix',f.pix_chave)}${campo('Observações',f.observacoes)}</div><button type="button" class="obrix-pessoal2-editar">Editar dados pessoais</button></div>`;
 document.body.appendChild(tela);
 const voltar=()=>tela.remove();tela.querySelector('.obrix-pessoal2-voltar').onclick=voltar;tela.querySelector('.obrix-pessoal2-fechar').onclick=voltar;
 tela.querySelector('.obrix-pessoal2-editar').onclick=()=>{
  const item=[...document.querySelectorAll('.obrix-diretorio-back .obrix-pessoal-item')].find(x=>String(x.dataset.id)===String(id));
  const btn=item?.querySelector('.obrix-pessoal-editar-btn');tela.remove();btn?.click();
 };
}
function reorganizar(){
 const sec=document.querySelector('#equipe .obrix-equipe-controles');if(!sec)return;
 const lista=sec.querySelector('[data-cmd="lista"]'),novo=sec.querySelector('[data-cmd="novo"]'),toggle=sec.querySelector('[data-cmd="toggle"]'),excluir=sec.querySelector('[data-cmd="excluir"]'),filtro=sec.querySelector('.obrix-filtro-equipe'),pagar=sec.querySelector('.obrix-pagar-equipe-topo');
 sec.querySelectorAll('.obrix-atualizar-equipe').forEach(b=>b.remove());
 if(novo)novo.textContent='Novo Funcionário';
 if(lista)lista.style.order='1';if(novo)novo.style.order='2';if(pagar)pagar.style.order='3';if(toggle)toggle.style.order='4';if(excluir)excluir.style.order='5';if(filtro)filtro.style.order='6';
 document.querySelectorAll('#listaEquipe .obrix-modelo-acoes .editar').forEach(b=>b.style.gridColumn='auto');
}
document.addEventListener('click',e=>{
 const b=e.target.closest?.('.obrix-diretorio-back .obrix-pessoal-toggle');if(!b)return;
 const item=b.closest('.obrix-pessoal-item');if(!item)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();abrirDetalhes(item.dataset.id);
},true);
function instalar(){reorganizar();const alvo=document.querySelector('#equipe');if(alvo&&!alvo.__obrixLayoutV2){alvo.__obrixLayoutV2=true;new MutationObserver(()=>reorganizar()).observe(alvo,{childList:true,subtree:true})}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,0),{once:true});else setTimeout(instalar,0);
window.addEventListener('obrix:grupo-pronto',e=>{if(e.detail?.name==='equipe')setTimeout(instalar,0)});
const css=document.createElement('style');css.id='obrixEquipeLayoutV2Css';css.textContent=`
#equipe .obrix-equipe-controles{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:10px!important;margin-bottom:18px!important}
#equipe .obrix-equipe-botoes,#equipe .obrix-equipe-secundario{display:contents!important}
#equipe .obrix-equipe-controles [data-cmd="lista"]{order:1!important}
#equipe .obrix-equipe-controles [data-cmd="novo"]{order:2!important}
#equipe .obrix-pagar-equipe-topo{order:3!important;grid-column:1/-1!important;justify-self:center!important;width:min(280px,78%)!important;background:#3b82f6!important;color:#fff!important;border-color:#3b82f6!important}
#equipe .obrix-equipe-controles [data-cmd="toggle"]{order:4!important}
#equipe .obrix-equipe-controles [data-cmd="excluir"]{order:5!important}
#equipe .obrix-filtro-equipe{order:6!important;grid-column:1/-1!important}
#equipe .obrix-atualizar-equipe{display:none!important}
#listaEquipe .obrix-modelo-acoes .editar{grid-column:auto!important}
.obrix-pessoal2-screen{position:fixed;inset:0;z-index:10060;background:#f4f6f8;color:#0f172a;overflow:auto;padding:max(16px,env(safe-area-inset-top)) 16px max(20px,env(safe-area-inset-bottom))}
.obrix-pessoal2-page{width:min(720px,100%);margin:0 auto}.obrix-pessoal2-head{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;gap:10px;margin-bottom:16px}.obrix-pessoal2-head h2{margin:0;font-size:24px}.obrix-pessoal2-head p{margin:3px 0 0;color:#64748b}.obrix-pessoal2-voltar,.obrix-pessoal2-fechar{width:42px;height:42px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#0f172a;font-size:24px;font-weight:900}.obrix-pessoal2-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.obrix-pessoal2-campo{background:#fff;border:1px solid #e2e8f0;border-radius:13px;padding:12px;min-width:0}.obrix-pessoal2-campo small{display:block;color:#64748b;font-weight:800;margin-bottom:4px}.obrix-pessoal2-campo b{display:block;overflow-wrap:anywhere}.obrix-pessoal2-editar{width:100%;margin-top:14px;min-height:48px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#0f172a;font-weight:900}
html[data-theme="dark"] .obrix-pessoal2-screen,body.dark .obrix-pessoal2-screen{background:#08111c;color:#f8fafc}html[data-theme="dark"] .obrix-pessoal2-voltar,html[data-theme="dark"] .obrix-pessoal2-fechar,html[data-theme="dark"] .obrix-pessoal2-campo,html[data-theme="dark"] .obrix-pessoal2-editar,body.dark .obrix-pessoal2-voltar,body.dark .obrix-pessoal2-fechar,body.dark .obrix-pessoal2-campo,body.dark .obrix-pessoal2-editar{background:#111827;color:#f8fafc;border-color:#334155}html[data-theme="dark"] #equipe .obrix-pagar-equipe-topo,body.dark #equipe .obrix-pagar-equipe-topo{background:#3b82f6!important;border-color:#3b82f6!important;color:#fff!important}
@media(max-width:620px){.obrix-pessoal2-grid{grid-template-columns:1fr}.obrix-pessoal2-head h2{font-size:21px}#equipe .obrix-pagar-equipe-topo{width:min(250px,82%)!important}}
`;document.head.appendChild(css);
window.OBRIX_EQUIPE_LAYOUT_V2={apply:reorganizar,openEmployee:abrirDetalhes};
})();