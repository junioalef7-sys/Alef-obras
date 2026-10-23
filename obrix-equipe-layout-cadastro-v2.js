(()=>{
'use strict';
if(window.__OBRIX_EQUIPE_LAYOUT_CADASTRO_V2)return;window.__OBRIX_EQUIPE_LAYOUT_CADASTRO_V2=true;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=v=>String(v??'').trim()||'Não informado';
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function funcs(){try{return typeof funcionarios!=='undefined'&&Array.isArray(funcionarios)?funcionarios:[]}catch(_){return Array.isArray(window.funcionarios)?window.funcionarios:[]}}
function obrasList(){try{return typeof obras!=='undefined'&&Array.isArray(obras)?obras:[]}catch(_){return Array.isArray(window.obras)?window.obras:[]}}
function achar(id){return funcs().find(f=>String(f.id)===String(id))||null}
function obraNome(id){return obrasList().find(o=>String(o.id)===String(id))?.nome||'Sem obra vinculada'}
function tipoPg(v){return({diaria:'Diária',semana:'Semana',quinzena:'Quinzena',mes:'Mensal'})[String(v||'diaria')]||String(v||'Não informado')}
function campo(rotulo,valor){return `<div class="obrix-v2-campo"><small>${esc(rotulo)}</small><b>${esc(txt(valor))}</b></div>`}
function fechar(sel){document.querySelector(sel)?.remove()}
function detalhe(f){
 fechar('.obrix-v2-detalhe-back');
 const back=document.createElement('div');back.className='modalBack obrix-v2-detalhe-back';
 back.innerHTML=`<div class="modal obrix-v2-detalhe"><div class="obrix-v2-head"><div><h2>${esc(f.nome||'Funcionário')}</h2><p class="muted">Informações do funcionário</p></div><button type="button" class="obrix-v2-x" aria-label="Fechar">×</button></div><div class="obrix-v2-grid">
 ${campo('Nome completo',f.nome)}${campo('Cargo / Função',f.cargo)}${campo('Status',f.ativo===false?'Inativo':'Ativo')}${campo('Obra vinculada',obraNome(f.obra_id))}
 ${campo('Tipo de pagamento',tipoPg(f.tipo_pagamento))}${campo('Valor da diária',f.valor_diaria?money(f.valor_diaria):'Não informado')}${campo('Salário mensal',f.salario_mensal?money(f.salario_mensal):'Não informado')}${campo('Dia de pagamento',f.dia_pagamento)}
 ${campo('CPF',f.cpf)}${campo('Telefone',f.telefone)}${campo('E-mail',f.email)}${campo('Endereço',f.endereco)}
 ${campo('Banco',f.banco)}${campo('Agência',f.agencia)}${campo('Conta',f.conta)}${campo('Tipo de conta',f.tipo_conta)}${campo('Tipo de chave Pix',f.pix_tipo)}${campo('Chave Pix',f.pix_chave)}${campo('Observações',f.observacoes)}
 </div></div>`;
 document.body.appendChild(back);back.querySelector('.obrix-v2-x').onclick=()=>back.remove();
}
function abrirLista(){
 fechar('.obrix-v2-lista-back');fechar('.obrix-v2-detalhe-back');
 const xs=funcs().slice().sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
 const back=document.createElement('div');back.className='modalBack obrix-v2-lista-back';
 back.innerHTML=`<div class="modal obrix-v2-lista"><div class="obrix-v2-head"><div><h2>Funcionários</h2><p class="muted">Selecione um funcionário para consultar todas as informações.</p></div><button type="button" class="obrix-v2-x" aria-label="Fechar">×</button></div><div class="obrix-v2-nomes">${xs.length?xs.map(f=>`<button type="button" data-v2-func="${esc(f.id)}"><span>${esc(f.nome||'Funcionário')}</span><span>›</span></button>`).join(''):'<div class="card muted">Nenhum funcionário cadastrado.</div>'}</div></div>`;
 document.body.appendChild(back);back.querySelector('.obrix-v2-x').onclick=()=>back.remove();
 back.querySelectorAll('[data-v2-func]').forEach(b=>b.onclick=()=>{const f=achar(b.dataset.v2Func);if(f)detalhe(f)});
}
function opcoesObras(){return '<option value="">Sem obra vinculada</option>'+obrasList().map(o=>`<option value="${esc(o.id)}">${esc(o.nome||'Obra')}</option>`).join('')}
function abrirNovo(){
 fechar('.obrix-v2-novo-back');
 const back=document.createElement('div');back.className='modalBack obrix-v2-novo-back';
 back.innerHTML=`<div class="modal obrix-v2-novo"><div class="obrix-v2-head"><div><h2>Novo Funcionário</h2><p class="muted">Cadastro profissional, pessoal e bancário</p></div><button type="button" class="obrix-v2-x" aria-label="Fechar">×</button></div>
 <h3>Dados profissionais</h3><label>Nome completo</label><input class="nome"><label>Cargo / Função</label><input class="cargo" placeholder="Pedreiro, servente, pintor..."><label>Tipo de pagamento</label><select class="tipo"><option value="diaria">Diária</option><option value="semana">Semana</option><option value="quinzena">Quinzena</option><option value="mes">Mês</option></select><label>Valor da diária</label><input class="diaria" type="number" min="0" step="0.01"><label>Salário mensal</label><input class="salario" type="number" min="0" step="0.01"><label>Dia de pagamento mensal</label><input class="dia" type="number" min="1" max="31"><label>Obra vinculada</label><select class="obra">${opcoesObras()}</select>
 <h3>Dados pessoais</h3><label>CPF</label><input class="cpf" inputmode="numeric"><label>Telefone</label><input class="telefone" inputmode="tel"><label>E-mail</label><input class="email" type="email"><label>Endereço</label><input class="endereco">
 <h3>Dados bancários</h3><label>Banco</label><input class="banco"><label>Agência</label><input class="agencia"><label>Conta</label><input class="conta"><label>Tipo de conta</label><input class="tipoConta"><label>Tipo de chave Pix</label><input class="pixTipo" placeholder="CPF, telefone, e-mail, aleatória..."><label>Chave Pix</label><input class="pixChave">
 <label class="obrix-v2-check"><input class="ativo" type="checkbox" checked> Funcionário ativo</label><label>Observações</label><textarea class="obs" rows="3"></textarea><div class="modalActions"><button type="button" class="btn cancelar">Cancelar</button><button type="button" class="btn salvar">Salvar funcionário</button></div></div>`;
 document.body.appendChild(back);back.querySelector('.obrix-v2-x').onclick=()=>back.remove();back.querySelector('.cancelar').onclick=()=>back.remove();
 back.querySelector('.salvar').onclick=async()=>{
  const nome=back.querySelector('.nome').value.trim();if(!nome)return alert('Informe o nome do funcionário.');
  const btn=back.querySelector('.salvar');btn.disabled=true;btn.textContent='Salvando...';
  try{
   const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile();if(!p?.empresa_id)throw new Error('Empresa não identificada.');
   const payload={empresa_id:p.empresa_id,nome,cargo:back.querySelector('.cargo').value.trim()||null,tipo_pagamento:back.querySelector('.tipo').value,valor_diaria:Number(back.querySelector('.diaria').value||0),salario_mensal:Number(back.querySelector('.salario').value||0),dia_pagamento:back.querySelector('.dia').value?Number(back.querySelector('.dia').value):null,obra_id:back.querySelector('.obra').value||null,cpf:back.querySelector('.cpf').value.trim()||null,telefone:back.querySelector('.telefone').value.trim()||null,email:back.querySelector('.email').value.trim()||null,endereco:back.querySelector('.endereco').value.trim()||null,banco:back.querySelector('.banco').value.trim()||null,agencia:back.querySelector('.agencia').value.trim()||null,conta:back.querySelector('.conta').value.trim()||null,tipo_conta:back.querySelector('.tipoConta').value.trim()||null,pix_tipo:back.querySelector('.pixTipo').value.trim()||null,pix_chave:back.querySelector('.pixChave').value.trim()||null,ativo:back.querySelector('.ativo').checked,observacoes:back.querySelector('.obs').value.trim()||null,atualizado_em:new Date().toISOString()};
   const {data,error}=await sb.from('funcionarios').insert(payload).select('id').single();if(error)throw error;if(!data?.id)throw new Error('O cadastro não foi confirmado.');
   back.remove();await window.OBRIX_EQUIPE?.refresh?.();window.OBRIX_EQUIPE_REALTIME_SYNC?.refresh?.();
  }catch(e){alert('Não foi possível cadastrar: '+(e.message||e))}finally{btn.disabled=false;btn.textContent='Salvar funcionário'}
 };
}
function arrumarCartoes(){
 document.querySelectorAll('#listaEquipe .obrix-modelo-card').forEach(card=>{
  const a=card.querySelector('.obrix-modelo-acoes');if(!a)return;
  const d=a.querySelector('[data-acao="diaria"]'),r=a.querySelector('[data-acao="registros"]'),f=a.querySelector('[data-acao="falta"]');
  if(d&&r&&f&&(a.children.length!==3||a.children[0]!==d||a.children[1]!==r||a.children[2]!==f))a.replaceChildren(d,r,f);
 });
}
function arrumarTopo(){
 const box=document.querySelector('#equipe .obrix-equipe-controles');if(!box)return false;
 const pri=box.querySelector('.obrix-equipe-botoes'),sec=box.querySelector('.obrix-equipe-secundario');if(!pri||!sec)return false;
 const lista=pri.querySelector('[data-cmd="lista"]')||box.querySelector('[data-cmd="lista"]'),novo=pri.querySelector('[data-cmd="novo"]')||box.querySelector('[data-cmd="novo"]'),toggle=pri.querySelector('[data-cmd="toggle"]')||box.querySelector('[data-cmd="toggle"]'),exc=pri.querySelector('[data-cmd="excluir"]')||box.querySelector('[data-cmd="excluir"]');
 sec.querySelector('.obrix-atualizar-equipe')?.remove();const pagar=box.querySelector('.obrix-pagar-equipe-topo');const filtro=box.querySelector('.obrix-filtro-equipe');
 if(lista)lista.textContent='👥 Funcionários';if(novo)novo.textContent='＋ Novo Funcionário';
 if(lista&&novo)pri.replaceChildren(lista,novo);
 const nodes=[pagar,toggle,exc,filtro].filter(Boolean);if(nodes.length)sec.replaceChildren(...nodes);
 return true;
}
function aplicar(){arrumarTopo();arrumarCartoes()}
document.addEventListener('click',e=>{
 const lista=e.target.closest?.('#equipe .obrix-equipe-controles [data-cmd="lista"]');if(lista){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();abrirLista();return}
 const novo=e.target.closest?.('#equipe .obrix-equipe-controles [data-cmd="novo"]');if(novo){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();abrirNovo()}
},true);
window.addEventListener('obrix:grupo-pronto',e=>{if(e.detail?.name==='equipe'){setTimeout(aplicar,30);setTimeout(aplicar,220)}});
const listaBox=document.getElementById('listaEquipe');if(listaBox)new MutationObserver(()=>setTimeout(arrumarCartoes,0)).observe(listaBox,{childList:true,subtree:true});
setTimeout(aplicar,400);setTimeout(aplicar,1200);setTimeout(aplicar,2600);
const css=document.createElement('style');css.id='obrixEquipeLayoutCadastroV2Css';css.textContent=`
#equipe .obrix-atualizar-equipe{display:none!important}
#equipe .obrix-equipe-botoes{grid-template-columns:repeat(2,minmax(0,1fr))!important}
#equipe .obrix-equipe-secundario{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
#equipe .obrix-equipe-secundario .obrix-pagar-equipe-topo{grid-column:1/-1!important;justify-self:center!important;width:min(72%,340px)!important;background:#3b82f6!important;color:#fff!important;border-color:#3b82f6!important}
#equipe .obrix-equipe-secundario .obrix-filtro-equipe{grid-column:1/-1!important}
#listaEquipe .obrix-modelo-acoes{grid-template-columns:repeat(3,minmax(0,1fr))!important}
#listaEquipe .obrix-modelo-acoes button{grid-column:auto!important;min-width:0!important}
.obrix-v2-lista-back,.obrix-v2-detalhe-back,.obrix-v2-novo-back{z-index:10020}
.obrix-v2-detalhe-back{z-index:10030}
.obrix-v2-lista,.obrix-v2-detalhe,.obrix-v2-novo{width:min(760px,100%);max-height:92vh;overflow:auto}
.obrix-v2-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.obrix-v2-head h2{margin:0 0 4px}.obrix-v2-head p{margin:0}.obrix-v2-x{border:0;background:transparent;color:inherit;font-size:32px;line-height:1;padding:0 7px}
.obrix-v2-nomes{display:grid;gap:9px}.obrix-v2-nomes>button{width:100%;display:flex;justify-content:space-between;align-items:center;border:1px solid #e2e8f0;background:#fff;color:#0f172a;border-radius:13px;padding:15px;font:inherit;font-weight:900;text-align:left}.obrix-v2-nomes>button span:last-child{font-size:26px;color:#64748b}
.obrix-v2-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.obrix-v2-campo{background:#f8fafc;border:1px solid #e2e8f0;border-radius:11px;padding:11px;min-width:0}.obrix-v2-campo small{display:block;color:#64748b;font-weight:800;margin-bottom:4px}.obrix-v2-campo b{display:block;overflow-wrap:anywhere}
.obrix-v2-novo h3{margin:18px 0 8px}.obrix-v2-novo label{display:block;font-weight:800;margin-top:7px}.obrix-v2-novo input,.obrix-v2-novo select,.obrix-v2-novo textarea{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:10px;margin:5px 0 9px;font:inherit}.obrix-v2-novo .obrix-v2-check{display:flex;align-items:center;gap:8px}.obrix-v2-novo .obrix-v2-check input{width:auto;margin:0}
html[data-theme="dark"] .obrix-v2-nomes>button,body.dark .obrix-v2-nomes>button{background:#0f172a;color:#f8fafc;border-color:#334155}html[data-theme="dark"] .obrix-v2-campo,body.dark .obrix-v2-campo{background:#111827;border-color:#334155}
@media(max-width:620px){.obrix-v2-grid{grid-template-columns:1fr}#listaEquipe .obrix-modelo-acoes{grid-template-columns:repeat(3,minmax(0,1fr))!important}#listaEquipe .obrix-modelo-acoes button{font-size:12px!important;padding:10px 6px!important}.obrix-v2-lista,.obrix-v2-detalhe,.obrix-v2-novo{padding:15px}}
`;document.head.appendChild(css);
window.OBRIX_EQUIPE_LAYOUT_CADASTRO_V2={apply:aplicar,openList:abrirLista,openNew:abrirNovo};
})();