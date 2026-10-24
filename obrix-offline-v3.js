(()=>{'use strict';
if(window.__OBRIX_OFFLINE_V3)return;window.__OBRIX_OFFLINE_V3=true;

const VERSION=3;
const SNAP_PREFIX='obrix_offline_v3_snapshot:';
const ID_KEY='obrix_offline_v3_identity';
const LOCK_KEY='obrix_offline_v3_logged_out';
const BASE_KEY='obrix_offline_base_v3';
const OLD_BASE_KEY='obrix_offline_base_v2';
const OLD_ID_KEY='obrix_offline_identity_v1';
const V2_DB_PREFIX='obrix_offline_v2_db:';
const OBRAS_PREFIX='obrix_obras_cache_v1:';
const EQUIPE_PREFIX='obrix_equipe_cache_v1:';
const FIN_PREFIX='obrix_financeiro_cache_v1:';
const TABLES=['obras','servicos_extras','checklist_itens','funcionarios','diarias','faltas','vales','bonus_extras','financeiro','pagamentos_equipe','pagamento_diarias','pagamento_vales','pagamento_bonus_extras','orcamentos','orcamento_itens','materiais','estoques','estoque_saldos','estoque_movimentacoes','relatorios_fotograficos','fotos_obra','diarios_obra','diario_equipe','diario_atividades','documentos','relatorios','clientes','fornecedores','compras','compra_itens','relatorio_fotos','notas'];
const BASE_MODULES=['./obrix-theme-main.js?v=20261024offlinev3','./obrix-brand-main.js?v=20261024offlinev3','./obrix-home-clean.js?v=20261024offlinev3','./obrix-financeiro-main.js?v=20261024offlinev3','./obrix-estoque-main.js?v=20261024offlinev3','./obrix-equipe-main.js?v=20261024offlinev3','./obrix-obras-main.js?v=20261024offlinev3','./obrix-menu-main.js?v=20261024offlinev3','./obrix-nav-active.js?v=20261024offlinev3','./obrix-ajustes-ui-final.js?v=20261024offlinev3'];
const GROUPS={
 financeiro:['./obrix-financeiro-resumo-obras.js','./obrix-financeiro-resumo-geral.js','./obrix-financeiro-protecao-estoque.js','./obrix-financeiro-busca.js','./obrix-financeiro-filtros-layout.js','./obrix-financeiro-grafico-receitas.js','./obrix-blindagem-financeiro.js'],
 equipe:['./obrix-equipe-controles-guard.js','./obrix-equipe-total-pago.js','./obrix-equipe-lista-vertical.js','./obrix-equipe-diretorio-pessoal.js','./obrix-equipe-botoes-neutros-v1.js','./obrix-equipe-estoque-fix-v1.js'],
 estoque:['./obrix-estoque-saida-obra.js','./obrix-estoque-operacoes-main.js','./obrix-estoque-estorno-final.js'],
 obras:['./obrix-obras-busca.js','./obrix-obras-pagamentos.js','./obrix-checklist-v2.js']
};
const FEATURES={
 diario:['./obrix-diario-main.js','./obrix-diario-equipe.js'],
 orcamentos:['./obrix-orcamentos-main.js','./obrix-orcamentos-itens-topo.js','./obrix-orcamentos-rascunho-print.js'],
 relatorios:['./obrix-relatorios-v2.js','./obrix-relatorios-mobile-fix.js','./obrix-relatorios-complementos.js','./obrix-relatorio-financeiro-obra.js','./obrix-relatorio-diario.js'],
 documentos:['./obrix-documentos-main.js','./obrix-documentos-direto.js'],
 notas:['./obrix-notas-main.js'],
 backup:['./obrix-backup-v2.js','./obrix-backup-import-run.js','./obrix-backup-completo.js'],
 config:['./obrix-config-main.js']
};
const read=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(_){return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
const arr=v=>Array.isArray(v)?v:[];
const clone=v=>{try{return JSON.parse(JSON.stringify(v))}catch(_){return v}};
const now=()=>new Date().toISOString();
const has=v=>Array.isArray(v)&&v.length>0;
const same=(a,b)=>a!=null&&b!=null&&String(a)===String(b);
const isOffline=()=>!navigator.onLine||window.__OBRIX_FORCE_OFFLINE===true||document.documentElement.dataset.obrixOfflineV3==='1';
const pathOf=s=>{try{return new URL(s,location.href).pathname}catch(_){return s}};
const loaded=new Set();
let active=false,runtimeReady=false,runtimePromise=null,current=null;

function keysByPrefix(prefix){const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';if(k.startsWith(prefix)&&k.length>prefix.length)out.push(k.slice(prefix.length))}}catch(_){}return out}
function identity(){return read(ID_KEY,null)||read(OLD_ID_KEY,null)||read(BASE_KEY,null)?.profile||read(OLD_BASE_KEY,null)?.profile||null}
function candidateIds(){const ids=new Set();[SNAP_PREFIX,V2_DB_PREFIX,OBRAS_PREFIX,EQUIPE_PREFIX,FIN_PREFIX].forEach(p=>keysByPrefix(p).forEach(x=>ids.add(x)));const i=identity();if(i?.empresa_id)ids.add(String(i.empresa_id));return [...ids]}
function chooseEmpresa(){const b3=read(BASE_KEY,null),b2=read(OLD_BASE_KEY,null),i=identity();if(b3?.profile?.empresa_id)return String(b3.profile.empresa_id);if(b2?.profile?.empresa_id)return String(b2.profile.empresa_id);if(i?.empresa_id)return String(i.empresa_id);const ids=candidateIds();if(ids.length===1)return ids[0];const scored=ids.map(id=>{const s=read(SNAP_PREFIX+id,null),db=read(V2_DB_PREFIX+id,null),ec=read(EQUIPE_PREFIX+id,null),fc=read(FIN_PREFIX+id,null);const stamp=s?.savedAt||s?.updatedAt||db?.savedAt||ec?.savedAt||fc?.savedAt||'';return{id,stamp}}).filter(x=>x.stamp).sort((a,b)=>String(b.stamp).localeCompare(String(a.stamp)));return scored.length===1?scored[0].id:null}
function pick(...sets){for(const x of sets)if(has(x))return arr(x);return[]}
function assemble(eid=chooseEmpresa()){
 if(!eid)return null;
 const snap=read(SNAP_PREFIX+eid,null),b3=read(BASE_KEY,null),b2=read(OLD_BASE_KEY,null),db=read(V2_DB_PREFIX+eid,null),oc=read(OBRAS_PREFIX+eid,[]),ec=read(EQUIPE_PREFIX+eid,null)||{},fc=read(FIN_PREFIX+eid,null)||{},id=identity()||{};
 const sb=snap&&same(snap?.profile?.empresa_id,eid)?snap:null,bb=b3&&same(b3?.profile?.empresa_id,eid)?b3:(b2&&same(b2?.profile?.empresa_id,eid)?b2:null),dt=db?.tables&&typeof db.tables==='object'?db.tables:{};
 const tables={...(dt||{}),...(sb?.tables||{})};
 const obras=pick(sb?.obras,tables.obras,bb?.obras,oc),funcionarios=pick(sb?.funcionarios,tables.funcionarios,bb?.funcionarios,ec.funcionarios),financeiro=pick(sb?.financeiro,tables.financeiro,bb?.financeiro,fc.financeiro),extras=pick(sb?.extras,tables.servicos_extras,bb?.extras,fc.extras),diarias=pick(sb?.diarias,tables.diarias,bb?.diarias,ec.diarias),vales=pick(sb?.vales,tables.vales,bb?.vales),bonus=pick(sb?.bonus,tables.bonus_extras,bb?.bonus),faltas=pick(sb?.faltas,tables.faltas,bb?.faltas,ec.faltas),checklists=pick(sb?.checklists,tables.checklist_itens,bb?.checklists,bb?.checklist_itens,fc.checklists);
 const profile={...(same(id?.empresa_id,eid)?id:{}),...(bb?.profile||{}),...(sb?.profile||{}),empresa_id:eid};
 if(!profile.email){const typed=(document.getElementById('email')?.value||'').trim();if(typed)profile.email=typed}
 const out={version:VERSION,profile,obras,funcionarios,financeiro,extras,diarias,vales,bonus,faltas,checklists,tables:{...tables,obras,funcionarios,financeiro,servicos_extras:extras,diarias,vales,bonus_extras:bonus,faltas,checklist_itens:checklists},savedAt:sb?.savedAt||bb?.updatedAt||db?.savedAt||ec?.savedAt||fc?.savedAt||null};
 return out;
}
function persistCompat(s){
 if(!s?.profile?.empresa_id)return false;const eid=String(s.profile.empresa_id),stamp=now();
 const base={profile:clone(s.profile),obras:clone(s.obras),funcionarios:clone(s.funcionarios),financeiro:clone(s.financeiro),extras:clone(s.extras),diarias:clone(s.diarias),vales:clone(s.vales),bonus:clone(s.bonus),faltas:clone(s.faltas),checklists:clone(s.checklists),updatedAt:s.savedAt||stamp};
 write(BASE_KEY,base);write(OLD_ID_KEY,{empresa_id:eid,nome:s.profile.nome||'',email:s.profile.email||'',papel:s.profile.papel||'',updatedAt:stamp});write(ID_KEY,{empresa_id:eid,nome:s.profile.nome||'',email:s.profile.email||'',papel:s.profile.papel||'',updatedAt:stamp});
 write(OBRAS_PREFIX+eid,clone(s.obras));write(EQUIPE_PREFIX+eid,{funcionarios:clone(s.funcionarios),diarias:clone(s.diarias),faltas:clone(s.faltas),savedAt:stamp});write(FIN_PREFIX+eid,{financeiro:clone(s.financeiro),extras:clone(s.extras),checklists:clone(s.checklists),savedAt:stamp});
 const oldDb=read(V2_DB_PREFIX+eid,null)||{version:2,tables:{}};oldDb.tables={...(oldDb.tables||{}),...(clone(s.tables)||{})};oldDb.savedAt=s.savedAt||stamp;write(V2_DB_PREFIX+eid,oldDb);return true;
}
function capture(reason='capture'){
 const eid=chooseEmpresa();if(!eid)return false;const assembled=assemble(eid);if(!assembled)return false;
 const globals={obras:window.obras,funcionarios:window.funcionarios,financeiro:window.financeiro,extras:window.extras,diarias:window.diarias,vales:window.vales,bonus:window.bonus};
 for(const [k,v] of Object.entries(globals))if(Array.isArray(v)&&v.length)assembled[k]=clone(v);
 assembled.tables={...(assembled.tables||{}),obras:assembled.obras,funcionarios:assembled.funcionarios,financeiro:assembled.financeiro,servicos_extras:assembled.extras,diarias:assembled.diarias,vales:assembled.vales,bonus_extras:assembled.bonus,faltas:assembled.faltas,checklist_itens:assembled.checklists};assembled.savedAt=now();assembled.reason=reason;
 write(SNAP_PREFIX+eid,assembled);persistCompat(assembled);current=assembled;return true;
}
function expose(s){window.__OBRIX_OFFLINE_V3_BASE=s;window.obras=clone(s.obras);window.funcionarios=clone(s.funcionarios);window.financeiro=clone(s.financeiro);window.extras=clone(s.extras);window.diarias=clone(s.diarias);window.vales=clone(s.vales);window.bonus=clone(s.bonus)}
function showError(msg){const e=document.getElementById('erro');if(e){e.textContent=msg;e.classList.remove('hidden')}}
function clearError(){document.getElementById('erro')?.classList.add('hidden')}
function openShell(s,reason){const login=document.getElementById('login'),app=document.getElementById('app'),u=document.getElementById('usuario');login?.classList.add('hidden');app?.classList.remove('hidden');if(u)u.textContent=s.profile.nome||s.profile.email||'';document.documentElement.dataset.obrixOffline='1';document.documentElement.dataset.obrixOfflineV3='1';document.documentElement.dataset.obrixOfflineBoot=reason;expose(s);normalizeBottom();window.dispatchEvent(new CustomEvent('obrix:offline-v3-ready',{detail:{reason,empresa_id:s.profile.empresa_id,obras:s.obras.length,funcionarios:s.funcionarios.length,financeiro:s.financeiro.length}}))}
function loggedOut(){return read(LOCK_KEY,false)===true}
function setLoggedOut(v){if(v)write(LOCK_KEY,true);else try{localStorage.removeItem(LOCK_KEY)}catch(_){}}
function activateData(reason='offline-v3'){const s=assemble();if(!s?.profile?.empresa_id)return false;current=s;persistCompat(s);openShell(s,reason);return true}

function normalizeBottom(){const box=document.querySelector('#app>.bottom');if(!box)return;const bs=[...box.querySelectorAll('button')];const labels=['Início','Financeiro','Equipe','Menu'];bs.slice(0,4).forEach((b,i)=>{b.textContent=labels[i];b.dataset.obrixOfflineV3Nav=String(i);if(i===3)b.id='bMenu'});for(let i=4;i<bs.length;i++)bs[i].remove();box.dataset.obrixOfflineV3='1'}
function hideScreens(){['inicio','obras','equipe','financeiroMain','estoqueMain','menuMain','diarioMain','notasMain','documentosMain','orcamentosMain','relatoriosMain','backupMain','configMain','assinaturaMain','offlineV3Financeiro','offlineV3Menu'].forEach(id=>document.getElementById(id)?.classList.add('hidden'))}
function activeBottom(i){document.querySelectorAll('#app>.bottom button').forEach((b,j)=>b.classList.toggle('active',i===j))}
function ensureMain(id){let m=document.getElementById(id);if(m)return m;const app=document.getElementById('app'),bottom=app?.querySelector('.bottom');if(!app||!bottom)return null;m=document.createElement('main');m.id=id;m.className='hidden';app.insertBefore(m,bottom);return m}
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
function renderFallbackFinance(){const m=ensureMain('offlineV3Financeiro');if(!m||!current)return;const rows=arr(current.financeiro).filter(x=>!x.status_lancamento||x.status_lancamento==='ativo'),rec=rows.filter(x=>x.tipo==='receita').reduce((s,x)=>s+Number(x.valor||0),0),des=rows.filter(x=>x.tipo==='despesa').reduce((s,x)=>s+Number(x.valor||0),0);m.innerHTML=`<div class="hero"><h1>Financeiro</h1><p>Dados disponíveis no aparelho</p></div><div class="grid"><div class="mini"><small>Receitas</small><b>${money(rec)}</b></div><div class="mini"><small>Despesas</small><b>${money(des)}</b></div><div class="mini"><small>Resultado</small><b>${money(rec-des)}</b></div></div><div class="card"><h3>Lançamentos</h3>${rows.slice(0,100).map(x=>`<div class="item"><b>${esc(x.descricao||x.categoria||x.tipo||'Lançamento')}</b><div class="muted">${esc(x.data||'')} • ${money(x.valor)}</div></div>`).join('')||'<div class="muted">Nenhum lançamento salvo.</div>'}</div>`}
function renderFallbackMenu(){const m=ensureMain('offlineV3Menu');if(!m)return;m.innerHTML=`<div class="hero"><h1>Menu</h1><p>Modo offline</p></div><div class="nav"><button data-offv3-go="obras">Obras<span>Dados salvos</span></button><button data-offv3-go="equipe">Equipe<span>Dados salvos</span></button><button data-offv3-go="financeiro">Financeiro<span>Dados salvos</span></button><button data-offv3-go="estoque">Estoque<span>Dados locais</span></button></div><div class="card"><b>Offline ativo</b><p class="muted">Os dados deste aparelho permanecem salvos e não são apagados ao sair da conta.</p></div>`}
function renderCoreLists(){try{window.renderObras?.();window.renderEquipe?.()}catch(_){}const ob=document.getElementById('listaObras'),eq=document.getElementById('listaEquipe');if(ob&&current&&!ob.children.length)ob.innerHTML=current.obras.map(o=>`<div class="card item"><h3>${esc(o.nome||'Obra')}</h3><div class="muted">${esc(o.cliente||'')} • ${esc(o.status||'')}</div></div>`).join('')||'<div class="card muted">Nenhuma obra cadastrada.</div>';if(eq&&current&&!eq.children.length)eq.innerHTML=current.funcionarios.map(f=>`<div class="card item"><h3>${esc(f.nome||'Funcionário')}</h3><div class="muted">${esc(f.cargo||'')} • ${f.ativo===false?'Inativo':'Ativo'}</div></div>`).join('')||'<div class="card muted">Nenhum funcionário cadastrado.</div>'}
function paintHome(){if(!current)return;const total=current.obras.reduce((s,o)=>s+Number(o.valor_contrato||0),0)+current.extras.reduce((s,x)=>s+Number(x.valor||0),0),recebido=current.financeiro.filter(x=>x.tipo==='receita'&&(!x.status_lancamento||x.status_lancamento==='ativo')).reduce((s,x)=>s+Number(x.valor||0),0);const c=document.getElementById('contratado'),r=document.getElementById('receber');if(c)c.textContent=money(total);if(r)r.textContent=money(Math.max(0,total-recebido));renderCoreLists()}
function loadScript(src){const p=pathOf(src);if(loaded.has(p)||[...document.scripts].some(s=>s.src&&pathOf(s.src)===p))return Promise.resolve(true);return new Promise(resolve=>{const s=document.createElement('script');s.src=src;s.async=false;let done=false;const end=ok=>{if(done)return;done=true;if(ok)loaded.add(p);resolve(ok)};s.onload=()=>end(true);s.onerror=()=>end(false);document.body.appendChild(s);setTimeout(()=>end(false),6500)})}
async function loadList(xs){let ok=true;for(const x of xs)if(!await loadScript(x))ok=false;return ok}
async function runtime(){if(runtimeReady)return true;if(runtimePromise)return runtimePromise;runtimePromise=(async()=>{await loadScript('./obrix-offline-v2.js?v=20261024offlinev3');try{window.OBRIX_OFFLINE_V2?.activate?.()}catch(_){}await loadList(BASE_MODULES);runtimeReady=true;normalizeBottom();paintHome();return true})().finally(()=>{runtimePromise=null});return runtimePromise}
async function loadGroup(name){const xs=GROUPS[name]||[];return loadList(xs)}
async function loadFeature(name){if(name==='assinatura')return false;return loadList(FEATURES[name]||[])}
async function route(name){if(!active&&!isOffline())return false;await runtime();normalizeBottom();if(name==='inicio'||name==='dashboard'){hideScreens();document.getElementById('inicio')?.classList.remove('hidden');activeBottom(0);paintHome();return true}if(name==='obras'){await loadGroup('obras');hideScreens();document.getElementById('obras')?.classList.remove('hidden');activeBottom(-1);renderCoreLists();try{window.OBRIX_OBRAS?.render?.()}catch(_){}return true}if(name==='equipe'){await loadGroup('equipe');hideScreens();document.getElementById('equipe')?.classList.remove('hidden');activeBottom(2);renderCoreLists();try{window.OBRIX_EQUIPE_MODELO?.render?.()}catch(_){}return true}if(name==='financeiro'){await loadGroup('financeiro');if(window.OBRIX_FIN?.open){try{window.OBRIX_FIN.open();activeBottom(1);return true}catch(_){}}hideScreens();renderFallbackFinance();document.getElementById('offlineV3Financeiro')?.classList.remove('hidden');activeBottom(1);return true}if(name==='estoque'){await loadGroup('estoque');if(window.OBRIX_EST?.open){try{window.OBRIX_EST.open();activeBottom(-1);return true}catch(_){}}return false}if(name==='menu'){hideScreens();renderFallbackMenu();document.getElementById('offlineV3Menu')?.classList.remove('hidden');activeBottom(3);return true}if(FEATURES[name]){await loadFeature(name);const map={diario:'OBRIX_DIARIO',orcamentos:'OBRIX_ORC',relatorios:'OBRIX_RELATORIOS',documentos:'OBRIX_DOCUMENTOS',notas:'OBRIX_NOTAS',backup:'OBRIX_BACKUP',config:'OBRIX_CONFIG'};try{window[map[name]]?.open?.();return true}catch(_){return false}}return false}
function offlineLogin(){clearError();const s=assemble();if(!s?.profile?.empresa_id){showError('Modo offline ainda não preparado neste aparelho. Entre uma vez com internet para salvar os dados.');return false}const typed=(document.getElementById('email')?.value||'').trim().toLowerCase(),cached=String(s.profile.email||'').trim().toLowerCase();if(typed&&cached&&typed!==cached){showError('Sem internet, este aparelho só pode abrir a conta salva localmente.');return false}setLoggedOut(false);active=true;current=s;persistCompat(s);openShell(s,'login-offline-v3');runtime().then(()=>route('inicio'));return true}
function offlineLogout(){setLoggedOut(true);capture('offline-logout');active=false;document.documentElement.removeAttribute('data-obrix-offline-v3');document.getElementById('app')?.classList.add('hidden');document.getElementById('login')?.classList.remove('hidden');const p=document.getElementById('senha');if(p)p.value='';clearError()}
function clickCapture(e){if(!isOffline())return;const el=e.target?.closest?.('button,a,[data-offv3-go],[data-go]');if(!el)return;if(el.id==='entrar'){e.preventDefault();e.stopImmediatePropagation();offlineLogin();return}if(el.id==='sair'||el.id==='menuSair'){e.preventDefault();e.stopImmediatePropagation();offlineLogout();return}const b=el.closest?.('#app>.bottom button');if(b){const i=[...document.querySelectorAll('#app>.bottom button')].indexOf(b);e.preventDefault();e.stopImmediatePropagation();route(['inicio','financeiro','equipe','menu'][i]||'inicio');return}const go=el.dataset?.offv3Go;if(go){e.preventDefault();e.stopImmediatePropagation();route(go)}}
async function start(reason='offline-v3'){
 if(!isOffline()){active=false;capture('online-start');return false}
 active=true;document.documentElement.dataset.obrixOfflineV3='1';if(loggedOut()){document.getElementById('app')?.classList.add('hidden');document.getElementById('login')?.classList.remove('hidden');return true}
 if(!activateData(reason)){document.getElementById('app')?.classList.add('hidden');document.getElementById('login')?.classList.remove('hidden');showError('Modo offline ainda não preparado neste aparelho. Entre uma vez com internet.');return false}
 await runtime();await route('inicio');return true
}
function owns(){return isOffline()||active}

document.addEventListener('click',clickCapture,true);
window.addEventListener('offline',()=>setTimeout(()=>start('connection-lost-v3'),0));
window.addEventListener('online',()=>{capture('back-online');document.documentElement.removeAttribute('data-obrix-offline-v3');active=false});
window.addEventListener('obrix:offline-base-atualizada',()=>capture('base-updated'));
window.addEventListener('obrix:offline-v2-change',()=>capture('v2-change'));
window.addEventListener('pageshow',()=>{if(isOffline())setTimeout(()=>start('pageshow-v3'),0);else setTimeout(()=>capture('pageshow-online'),300)});
document.addEventListener('visibilitychange',()=>{if(document.hidden)capture('hidden');else if(isOffline())start('resume-v3');else capture('resume-online')});
setTimeout(()=>{if(isOffline())start('early-v3');else capture('online-1')},120);
setTimeout(()=>{if(!isOffline())capture('online-2')},1500);
setTimeout(()=>{if(!isOffline())capture('online-3')},5000);
if(!navigator.onLine){window.__OBRIX_OFFLINE_BOOTSTRAP=true;window.__OBRIX_SESSION_OFFLINE_FIX=true}
window.OBRIX_OFFLINE_V3={version:VERSION,start,route,capture,assemble,active:()=>active,owns,loadGroup,loadFeature,status:()=>{const s=current||assemble();return{version:VERSION,active,available:!!s?.profile?.empresa_id,empresa_id:s?.profile?.empresa_id||null,obras:s?.obras?.length||0,funcionarios:s?.funcionarios?.length||0,financeiro:s?.financeiro?.length||0,savedAt:s?.savedAt||null}}};
})();