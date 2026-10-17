(function(){
  'use strict';
  let channel=null;
  let timer=null;
  let syncing=false;

  function badge(){
    let el=document.getElementById('obrixRealtimeStatus');
    if(el)return el;
    el=document.createElement('div');
    el.id='obrixRealtimeStatus';
    el.textContent='Sincronização: aguardando login';
    el.style.cssText='position:fixed;right:12px;bottom:12px;z-index:9999;padding:9px 