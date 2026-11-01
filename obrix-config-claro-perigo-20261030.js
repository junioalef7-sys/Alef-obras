(()=>{'use strict';
const carregarPatch=()=>{
  if(document.querySelector('script[data-obrix-ajustes-visuais]'))return;
  const a=document.createElement('script');
  a.src='./obrix-ajustes-visuais-pontuais-20261031.js?v=20261031visual2';
  a.async=false;
  a.dataset.obrixAjustesVisuais='1';
  document.head.appendChild(a)
};
if(document.querySelector('script[data-obrix-config-base]')){carregarPatch();return}
const s=document.createElement('script');
s.src='./obrix-config-claro-perigo-base-20261030.js?v=20261031base2';
s.async=false;
s.dataset.obrixConfigBase='1';
s.onload=carregarPatch;
s.onerror=()=>{console.error('OBRIX: falha ao carregar ajustes base de configuração');carregarPatch()};
document.head.appendChild(s)
})();