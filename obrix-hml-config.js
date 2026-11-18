/* OBRIX — Configuração exclusiva das URLs Preview da Vercel.
 * O valor vazio é proposital: nenhuma prévia acessa a base oficial por acidente.
 * Quando existir uma ramificação Supabase isolada e vazia, preencher SOMENTE o
 * ref de 20 letras dessa ramificação e publicar uma Preview de teste.
 * O ref é público; nunca colocar chaves ou credenciais neste arquivo.
 * O adaptador verifica domínio e origem antes de criar o cliente Supabase.
 */
(function(){
  'use strict';
  if(typeof window.__OBRIX_HML_PROJECT_REF!=='string'){
    window.__OBRIX_HML_PROJECT_REF='xavwkfgrnowmusbkbiea';
  }
})();
