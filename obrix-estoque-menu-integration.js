(()=>{
'use strict';
function initEstoqueMenu(){
  const tabs=document.querySelector('.tabs');
  const obrasPanel=document.getElementById('obrasPanel');
  const equipePanel=document.getElementById('equipePanel');
  const tabObras=document.getElementById('tabObras');
  const tabEquipe=document.getElementById('tabEquipe');
  if(!tabs||!obrasPanel||!equipePanel||!tabObras||!tabEquipe||document.getElementById('tabEstoque'))return;

  const tab=document.createElement('button');
  tab.id='tabEstoque';
  tab.type='button';
  tab.textContent='Estoque';
  tabs.appendChild(tab);

  const panel=document.createElement('div');
  panel.id='estoquePanel';
  panel.className='card hidden';
  panel.innerHTML=`
    <div class="sectionHead">
      <div>
        <h2>Estoque</h2>
        <div class="subline">Materiais, locais, entradas, saídas, transferências e inventário.</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">
      <a class="btn" style="text-decoration:none;text-align:center" href="./obrix-estoque-test.html?v=214">Central de estoque</a>
      <a class="btn light" style="text-decoration:none;text-align:center" href="./obrix-estoque-entrada-test.html?v=214">Entrada de material</a>
      <a class="btn light" style="text-decoration:none;text-align:center" href="./obrix-estoque-saida-test.html?v=214">Saída de material</a>
      <a class="btn" style="text-decoration:none;text-align:center" href="./obrix-estoque-transferencia-test.html?v=214">Transferência</a>
      <a class="btn" style="text-decoration:none;text-align:center;grid-column:1/-1" href="./obrix-estoque-ajuste-test.html?v=214">Ajuste / Inventário</a>
    </div>`;
  equipePanel.insertAdjacentElement('afterend',panel);

  function setActive(which){
    [tabObras,tabEquipe,tab].forEach(b=>b.classList.remove('active'));
    [obrasPanel,equipePanel,panel].forEach(p=>p.classList.add('hidden'));
    if(which==='obras'){tabObras.classList.add('active');obrasPanel.classList.remove('hidden');}
    else if(which==='equipe'){tabEquipe.classList.add('active');equipePanel.classList.remove('hidden');}
    else {tab.classList.add('active');panel.classList.remove('hidden');}
  }

  tab.addEventListener('click',()=>setActive('estoque'));
  tabObras.addEventListener('click',()=>setActive('obras'));
  tabEquipe.addEventListener('click',()=>setActive('equipe'));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initEstoqueMenu);
else initEstoqueMenu();
})();
