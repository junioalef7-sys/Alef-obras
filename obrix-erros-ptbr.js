(()=>{'use strict';
if(window.__OBRIX_ERROS_PTBR)return;window.__OBRIX_ERROS_PTBR=true;
const originalAlert=window.alert.bind(window);
function traduz(v){const raw=String(v?.message??v??'').trim();if(!raw)return'Não foi possível concluir a operação.';const s=raw.toLowerCase();
 if(/invalid login credentials|invalid credentials|wrong password|email or password|invalid grant/.test(s))return'E-mail ou senha incorretos.';
 if(/email not confirmed|email.*not confirmed/.test(s))return'Confirme seu e-mail antes de entrar.';
 if(/user not found|no user found/.test(s))return'Usuário não encontrado.';
 if(/invalid email|email.*invalid|valid email/.test(s))return'Informe um endereço de e-mail válido.';
 if(/password.*least|at least.*character|weak password|password.*short/.test(s))return'A senha não atende aos requisitos mínimos.';
 if(/already registered|already been registered|user.*already|email.*already|user.*exists/.test(s))return'Este e-mail já possui cadastro.';
 if(/too many requests|rate limit|request rate/.test(s))return'Muitas tentativas em pouco tempo. Aguarde um momento e tente novamente.';
 if(/network|failed to fetch|fetch failed|load failed|networkerror|offline|internet connection|connection.*failed/.test(s))return'Não foi possível conectar agora. Verifique sua internet e tente novamente.';
 if(/jwt.*expired|token.*expired|session.*expired/.test(s))return'Sua sessão expirou. Entre novamente.';
 if(/auth session missing|session.*missing/.test(s))return'Sessão não encontrada. Entre novamente.';
 if(/permission denied|row-level security|violates row-level security|not authorized|unauthorized|forbidden/.test(s))return'Você não tem permissão para realizar esta operação.';
 if(/duplicate key|unique constraint|already exists/.test(s))return'Este registro já existe.';
 if(/timeout|timed out/.test(s))return'A operação demorou demais. Tente novamente.';
 return raw;
}
window.OBRIX_PT_ERROR=traduz;
window.alert=function(v){return originalAlert(traduz(v))};
function patchMostrar(){const fn=window.mostrarErro;if(typeof fn!=='function'||fn.__obrixPtBr)return;const w=function(e){return fn.call(this,{message:traduz(e)})};w.__obrixPtBr=true;window.mostrarErro=w}
patchMostrar();setTimeout(patchMostrar,300);setTimeout(patchMostrar,1200);
window.addEventListener('pageshow',patchMostrar);window.addEventListener('obrix:session-shell',patchMostrar);
})();