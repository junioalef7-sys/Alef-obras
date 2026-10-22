(()=>{'use strict';
if(window.__OBRIX_OFFLINE_BACKUP_EMERGENCIA)return;window.__OBRIX_OFFLINE_BACKUP_EMERGENCIA=true;
const FORMAT='obrix-offline-emergency-backup',SCHEMA=1,PACKAGE='obrix-offline-v21',BASE='obrix_offline_base_v3';
const $=id=>document.getElementById(id),now=()=>new Date().toISOString(),fmt=v=>{try{return new Date(v).toLocaleString('pt-BR')}catch{return String(v||'—')}};
let last=null,running=false;
function parse(k,d=null){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch{return d}}
function empresa(){return parse(BASE,null)?.profile?.empresa_id||null}
function arr(v){return Array.isArray(v)?v:[]}
function mine(key,type='direct'){const e=empresa(),q=arr(parse(key,[]));if(!e)return[];return q.filter(x=>String(type==='payload'?x?.payload?.empresa_id:x?.empresa_id||'')===String(e))}
function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return null}}
function cachesFor(e){return{
  obras:clone(parse('obrix_obras_cache_v1:'+e,[])),
  equipe:clone(parse('obrix_equipe_cache_v1:'+e,{funcionarios:[],diarias:[],faltas:[]})),
  estoque:clone(parse('obrix_estoque_cache_v1:'+e,{materiais:[],estoques:[],saldos:[]})),
  financeiro:clone(parse('obrix_financeiro_cache_v1:'+e,{financeiro:[],extras:[],checklists:[]})),
  diario:clone(parse('obrix_diario_cache_v3:'+e,[])),
  notas:clone(parse('obrix_notas_cache_v1:'+e,[])),
  checklist:clone(parse('obrix_checklist_cache_v1:'+e,[]))
}}
function queues(){return{
  obras:clone(mine('obrix_obras_offline_v1')),
  equipe:clone(mine('obrix_equipe_offline_v1')),
  estoque:clone(mine('obrix_estoque_offline_v1')),
  diario:clone(mine('obrix_diario_offline_v4','payload')),
  notas:clone(mine('obrix_notas_offline_v1')),
  checklist:clone(mine('obrix_checklist_offline_v1'))
}}
function countCache(c){return{
  obras:arr(c.obras).length,
  funcionarios:arr(c.equipe?.funcionarios).length,
  materiais:arr(c.estoque?.materiais).length,
  financeiro:arr(c.financeiro?.financeiro).length,
  diario:arr(c.diario).length,
  notas:arr(c.notas).length,
  checklist:arr(c.checklist).length
}}
function countQueues(q){const perModule={};let total=0;for(const [k,v] of Object.entries(q)){perModule[k]=arr(v).length;total+=perModule[k]}return{total,perModule}}
async function sha256(text){try{if(!crypto?.subtle)return null;const data=new TextEncoder().encode(text),buf=await crypto.subtle.digest('SHA-256',data);return[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}catch{return null}}
async function build(){const e=empresa();if(!e)throw new Error('Não foi encontrada uma empresa na sessão local deste aparelho.');const c=cachesFor(e),q=queues(),payload={format:FORMAT,schema:SCHEMA,package:PACKAGE,generatedAt:now(),empresa_id:String(e),confidential:true,containsAuth:false,containsPassword:false,containsToken:false,counts:{cache:countCache(c),queues:countQueues(q)},data:{caches:c,queues:q}};const raw=JSON.stringify(payload),hash=await sha256(raw);return{...payload,integrity:{algorithm:hash?'SHA-256':'indisponível',hash}}}
function filename(b){const d=(b.generatedAt||now()).replace(/[:.]/g,'-');return`OBRIX-backup-emergencia-${d}.json`}
async function generate(download=true){if(running)return last;running=true;renderBusy(true);try{const b=await build(),text=JSON.stringify(b,null,2);last={at:b.generatedAt,backup:b,size:new Blob([text]).size};if(download){const blob=new Blob([text],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename(b);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);window.OBRIX_OFFLINE_HISTORICO?.add?.('backup','sistema','Backup de emergência gerado',`${b.counts.queues.total} pendência(s) incluída(s).`,'ok')}render();return b}catch(e){last={at:now(),error:e?.message||String(e)};render();alert(last.error);return null}finally{running=false;renderBusy(false)}}
async function copySummary(){const b=last?.backup||await generate(false);if(!b)return;const c=b.counts.cache,q=b.counts.queues,text=[`OBRIX Backup de Emergência Offline`,`Gerado: ${fmt(b.generatedAt)}`,`Pacote: ${b.package}`,`Obras: ${c.obras} • Equipe: ${c.funcionarios} • Estoque: ${c.materiais}`,`Financeiro: ${c.financeiro} • Diário: ${c.diario} • Notas: ${c.notas} • Checklist: ${c.checklist}`,`Pendências preservadas: ${q.total}`,`Integridade: ${b.integrity?.algorithm||'—'} ${b.integrity?.hash||''}`].join('\n');try{await navigator.clipboard.writeText(text);alert('Resumo do backup copiado.')}catch{alert(text)}}
function ensure(){const main=$('offlineCentralMain');if(!main)return false;let sec=$('offlineBackupEmergencia');if(sec)return true;sec=document.createElement('section');sec.id='offlineBackupEmergencia';sec.className='card offlineBackupEmergencia';sec.innerHTML='<div class="offlineBackupHead"><div><strong>Backup de Emergência Offline</strong><small class="muted">Salva uma cópia manual dos dados e filas que já estão guardados neste aparelho. Não inclui senha, token nem sessão de autenticação.</small></div><span class="offlineBackupBadge">Manual</span></div><div id="offlineBackupState" class="offlineBackupState"><b>Nenhum backup gerado nesta abertura</b><span>O arquivo pode conter dados de obras, notas e valores. Guarde-o em local privado.</span></div><div id="offlineBackupMeta" class="offlineBackupMeta"></div><div class="offlineBackupActions"><button type="button" class="btn" id="offlineBackupRun">Gerar backup JSON</button><button type="button" id="offlineBackupCopy">Copiar resumo</button></div><small class="muted">Esta etapa apenas exporta. Ela não altera nem apaga dados e não restaura arquivos automaticamente.</small>';const storage=$('offlineArmazenamento'),repair=$('offlineReparo'),approval=$('offlineAprovacao'),actions=main.querySelector('.offlineCentralAcoes');if(storage)storage.after(sec);else if(repair)repair.after(sec);else if(approval)main.insertBefore(sec,approval);else actions?.before(sec);$('offlineBackupRun').onclick=()=>generate(true);$('offlineBackupCopy').onclick=copySummary;render();return true}
function renderBusy(on){ensure();const b=$('offlineBackupRun');if(b){b.disabled=on;b.textContent=on?'Gerando...':'Gerar backup JSON'}}
function render(){if(!ensure())return;const box=$('offlineBackupState'),meta=$('offlineBackupMeta');if(!box||!meta)return;if(last?.error){box.className='offlineBackupState bad';box.innerHTML=`<b>Não foi possível gerar o backup</b><span>${last.error}</span>`;meta.innerHTML='';return}if(last?.backup){const b=last.backup,c=b.counts.cache,q=b.counts.queues;box.className='offlineBackupState ok';box.innerHTML='<b>Backup preparado com sucesso</b><span>O arquivo foi montado sem senha, token ou sessão de autenticação.</span>';meta.innerHTML=`<span><b>Gerado:</b> ${fmt(b.generatedAt)}</span><span><b>Dados:</b> ${c.obras} obras • ${c.funcionarios} funcionários • ${c.materiais} materiais</span><span><b>Pendências:</b> ${q.total}</span><span><b>Tamanho:</b> ${Math.max(1,Math.round((last.size||0)/1024))} KB</span><span><b>SHA-256:</b> ${b.integrity?.hash?b.integrity.hash.slice(0,12)+'…':'indisponível'}</span>`;return}box.className='offlineBackupState';box.innerHTML='<b>Nenhum backup gerado nesta abertura</b><span>Use “Gerar backup JSON” para salvar uma cópia do estado offline atual.</span>';meta.innerHTML=''}
new MutationObserver(()=>ensure()).observe(document.documentElement,{childList:true,subtree:true});['pageshow','online','offline'].forEach(ev=>window.addEventListener(ev,()=>setTimeout(ensure,300)));const css=document.createElement('style');css.textContent=`.offlineBackupHead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.offlineBackupHead small{display:block;margin-top:4px}.offlineBackupBadge{padding:7px 10px;border-radius:999px;background:#e0f2fe;color:#075985;font-size:12px;font-weight:950}.offlineBackupState{margin:12px 0;padding:11px;border-radius:11px;background:#f8fafc;display:grid;gap:3px}.offlineBackupState.ok{background:#ecfdf5;color:#166534}.offlineBackupState.bad{background:#fef2f2;color:#991b1b}.offlineBackupMeta{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px}.offlineBackupMeta span{background:#f1f5f9;border-radius:9px;padding:7px 9px;font-size:11px;color:#475569}.offlineBackupActions{display:flex;gap:8px;margin-bottom:9px}.offlineBackupActions button{border:1px solid #cbd5e1;background:#fff;color:#0f172a;border-radius:9px;padding:9px 11px;font-weight:900}html[data-theme="dark"] .offlineBackupEmergencia{background:#0d1928;border-color:#26384d;color:#f8fafc}html[data-theme="dark"] .offlineBackupMeta span{background:#172235;color:#cbd5e1}html[data-theme="dark"] .offlineBackupActions button{background:#172235;color:#fff;border-color:#334155}@media(max-width:700px){.offlineBackupHead{display:grid}.offlineBackupActions{display:grid;grid-template-columns:1fr 1fr}}`;document.head.appendChild(css);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(ensure,1000));else setTimeout(ensure,1000);window.OBRIX_OFFLINE_BACKUP_EMERGENCIA={generate,status:()=>last,build};
})();