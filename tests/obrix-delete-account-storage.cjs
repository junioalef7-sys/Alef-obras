/**
 * Testes da limpeza física de arquivos por empresa.
 * Executar: node --test tests/obrix-delete-account-storage.cjs
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const url=pathToFileURL(path.join(__dirname,'../supabase/functions/obrix-delete-account/storage-cleanup.mjs')).href;
const COMPANY='760a3847-fba3-40cf-bf5b-444c6f8305eb';
const OTHER='ec70a79d-42ce-47af-8831-986a01b152c5';

class Store {
  constructor(initial={},options={}){
    this.data=new Map(Object.entries(initial).map(([bucket,files])=>[bucket,new Map(files.map(f=>[f.path,f.size]))]));
    this.options=options;this.calls=[];this.lists=[];
  }
  async listBuckets(){
    if(this.options.bucketsError)return{error:new Error('API indisponível')};
    return {data:[...this.data.keys()].map(id=>({id})),error:null};
  }
  from(bucket){
    return {
      list:async (folder,{limit,offset})=>{
        this.lists.push({bucket,folder,limit,offset});
        if(this.options.listError)return{error:new Error('Listagem falhou')};
        const entries=new Map();
        for(const [path,size] of this.data.get(bucket)||[]){
          if(!path.startsWith(folder+'/'))continue;
          const rest=path.slice(folder.length+1),slash=rest.indexOf('/');
          if(slash!==-1){
            const name=rest.slice(0,slash);
            entries.set(name,{name,id:null,metadata:null});
          }else entries.set(rest,{name:rest,id:'file',metadata:{size}});
        }
        return{data:[...entries.values()].sort((a,b)=>a.name.localeCompare(b.name))
          .slice(offset,offset+limit),error:null};
      },
      remove:async paths=>{
        this.calls.push({bucket,paths});
        if(this.options.removeError)return{error:new Error('Remoção falhou')};
        if(!this.options.fakeSuccess)paths.forEach(p=>this.data.get(bucket).delete(p));
        return{error:null};
      }
    };
  }
}

test('remove fotos, documentos e capas da empresa sem tocar em outra',async()=>{
  const {excluirArquivosEmpresa}=await import(url);
  const photos=Array.from({length:242},(_,i)=>({path:COMPANY+'/obra/img-'+i+'.jpg',size:1000}));
  const store=new Store({'relatorio-fotografico':photos.concat([{path:OTHER+'/foto.jpg',size:55}]),
    'obrix-fotos':[{path:COMPANY+'/capas/1/capa.webp',size:40}],
    'obrix-documentos':[{path:COMPANY+'/obra/contrato.pdf',size:100}]});
  const result=await excluirArquivosEmpresa(store,COMPANY);
  assert.equal(result.arquivosRemovidos,244);
  assert.equal(result.bytesEstimados,242140);
  assert.equal(store.data.get('relatorio-fotografico').size,1);
  assert.ok(store.data.get('relatorio-fotografico').has(OTHER+'/foto.jpg'));
  assert.equal(store.calls.length,5);
  assert.ok(store.calls.every(c=>c.paths.every(p=>p.startsWith(COMPANY+'/'))));
});
test('pagina pastas com mais de 100 arquivos',async()=>{
  const {excluirArquivosEmpresa}=await import(url);
  const files=Array.from({length:218},(_,i)=>({path:COMPANY+'/file-'+String(i).padStart(4,'0')+'.png',size:10}));
  const store=new Store({'obrix-fotos':files});
  const result=await excluirArquivosEmpresa(store,COMPANY);
  assert.equal(result.arquivosRemovidos,218);
  assert.deepEqual(store.calls.map(c=>c.paths.length),[100,100,18]);
});
test('falha de inventário não remove qualquer arquivo',async()=>{
  const {excluirArquivosEmpresa}=await import(url);
  const store=new Store({'obrix-fotos':[{path:COMPANY+'/pic.jpg',size:10}]},{listError:true});
  await assert.rejects(excluirArquivosEmpresa(store,COMPANY));
  assert.equal(store.calls.length,0);
});
test('falha de remoção rejeita confirmação',async()=>{
  const {excluirArquivosEmpresa}=await import(url);
  const store=new Store({'obrix-fotos':[{path:COMPANY+'/pic.jpg',size:10}]},{removeError:true});
  await assert.rejects(excluirArquivosEmpresa(store,COMPANY));
  assert.equal(store.data.get('obrix-fotos').size,1);
});
test('resposta de sucesso falsa é detectada por releitura',async()=>{
  const {excluirArquivosEmpresa}=await import(url);
  const store=new Store({'obrix-fotos':[{path:COMPANY+'/pic.jpg',size:10}]},{fakeSuccess:true});
  await assert.rejects(excluirArquivosEmpresa(store,COMPANY),/Ainda existem/);
});
test('erro ao listar buckets interrompe exclusão',async()=>{
  const {excluirArquivosEmpresa}=await import(url);
  const store=new Store({'obrix-fotos':[{path:COMPANY+'/pic.jpg',size:10}]},{bucketsError:true});
  await assert.rejects(excluirArquivosEmpresa(store,COMPANY));
  assert.equal(store.calls.length,0);
});
test('identificador inválido nunca dispara remoção',async()=>{
  const {excluirArquivosEmpresa}=await import(url);
  const store=new Store({'obrix-fotos':[]});
  await assert.rejects(excluirArquivosEmpresa(store,''));
  assert.equal(store.calls.length,0);
});
test('empresa sem arquivos não afeta outra empresa',async()=>{
  const {excluirArquivosEmpresa}=await import(url);
  const store=new Store({'obrix-fotos':[{path:OTHER+'/pic.jpg',size:10}]});
  const result=await excluirArquivosEmpresa(store,COMPANY);
  assert.equal(result.arquivosRemovidos,0);
  assert.equal(store.calls.length,0);
  assert.equal(store.data.get('obrix-fotos').size,1);
});
