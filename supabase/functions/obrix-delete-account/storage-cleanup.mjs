/**
 * OBRIX — Limpeza segura e isolada do Supabase Storage.
 * É proibido apagar storage.objects por SQL: apenas Storage API.
 * Sem credenciais embutidas; o chamador injeta um cliente com service-role.
 */
export const STORAGE_PAGE_SIZE=100;
export const STORAGE_DELETE_BATCH=100;
export const STORAGE_MAX_FILES=20000;
export const STORAGE_MAX_DEPTH=12;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertCompany(companyId){
  if(typeof companyId!=='string'||!UUID.test(companyId)){
    throw new Error('Não foi possível identificar a empresa para excluir os arquivos.');
  }
}
function checkPath(path,companyId){
  if(!path.startsWith(companyId+'/')||path.includes('..')||path.includes('//')){
    throw new Error('Foi detectado um caminho de arquivo fora da empresa. A exclusão foi interrompida.');
  }
}
async function listarPasta(storage,bucket,pasta,companyId,depth,context){
  if(depth>STORAGE_MAX_DEPTH)throw new Error('A estrutura de pastas excede o limite seguro para exclusão.');
  let offset=0,rounds=0;
  while(true){
    if(++rounds>1000)throw new Error('A listagem de arquivos não terminou com segurança.');
    const {data,error}=await storage.from(bucket).list(pasta,{
      limit:STORAGE_PAGE_SIZE,offset,
      sortBy:{column:'name',order:'asc'}
    });
    if(error)throw new Error('Falha ao listar fotos e documentos. Nenhum dado da conta foi excluído.');
    if(!Array.isArray(data))throw new Error('A listagem de arquivos não pôde ser confirmada.');
    for(const item of data){
      if(!item||typeof item.name!=='string'||!item.name||item.name==='.'||item.name==='..'
         ||item.name.includes('/')||item.name.includes('\\')){
        throw new Error('Foi encontrado um nome de arquivo inesperado. A exclusão foi interrompida.');
      }
      const path=pasta+'/'+item.name;
      checkPath(path,companyId);
      if(item.id==null){
        await listarPasta(storage,bucket,path,companyId,depth+1,context);
      }else{
        context.files.push(path);
        const size=Number(item.metadata?.size||0);
        if(Number.isFinite(size)&&size>0)context.bytes+=size;
        context.count+=1;
        if(context.count>STORAGE_MAX_FILES){
          throw new Error('A conta excede o limite de exclusão automática. Contate o suporte para concluir a exclusão.');
        }
      }
    }
    if(data.length<STORAGE_PAGE_SIZE)break;
    offset+=STORAGE_PAGE_SIZE;
  }
}
export async function inventariarArquivos(storage,companyId){
  assertCompany(companyId);
  const {data:buckets,error}=await storage.listBuckets();
  if(error||!Array.isArray(buckets))throw new Error('Não foi possível consultar o armazenamento de fotos e documentos.');
  if(buckets.length>1000)throw new Error('Quantidade inesperada de repositórios de arquivos.');
  const inventory=[],context={files:[],bytes:0,count:0};
  for(const entry of buckets){
    const bucket=entry?.id;
    if(typeof bucket!=='string'||!bucket)throw new Error('Repositório de arquivos inválido.');
    const before=context.files.length;
    const previousBytes=context.bytes;
    await listarPasta(storage,bucket,companyId,companyId,0,context);
    inventory.push({
      bucket,
      files:context.files.slice(before),
      bytes:context.bytes-previousBytes
    });
  }
  return {inventory,totalFiles:context.count,totalBytes:context.bytes};
}
export async function excluirArquivosEmpresa(storage,companyId){
  // O inventário de TODOS os buckets termina antes da primeira exclusão.
  const scanned=await inventariarArquivos(storage,companyId);
  let removed=0;
  for(const group of scanned.inventory){
    for(let i=0;i<group.files.length;i+=STORAGE_DELETE_BATCH){
      const batch=group.files.slice(i,i+STORAGE_DELETE_BATCH);
      // O remove() elimina os objetos físicos; deletar linhas storage.objects não elimina os arquivos.
      const {error}=await storage.from(group.bucket).remove(batch);
      if(error){
        throw new Error('A limpeza dos arquivos foi interrompida. A conta não foi excluída. Tente novamente.');
      }
      removed+=batch.length;
    }
  }
  // A confirmação não depende somente da resposta da remoção: relistar todos os buckets.
  const remaining=await inventariarArquivos(storage,companyId);
  if(remaining.totalFiles!==0){
    throw new Error('Ainda existem fotos ou documentos armazenados. A conta não foi excluída. Tente novamente.');
  }
  return {arquivosRemovidos:removed,bytesEstimados:scanned.totalBytes,buckets:scanned.inventory.length};
}
