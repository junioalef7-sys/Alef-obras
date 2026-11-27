// Only the intentionally disclosed supplier fields; never return environment contents wholesale.
module.exports = function(req,res){
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Método não permitido'});}
  if(process.env.VERCEL_ENV!=='preview'||process.env.VERCEL_GIT_COMMIT_REF!=='test/obrix-legal-20261127')return res.status(404).json({error:'Indisponível'});
  try{
    const p=JSON.parse(process.env.OBRIX_LEGAL_PROVIDER||'null');
    if(!p||!['nome','cpf','endereco'].every(k=>typeof p[k]==='string'&&p[k].trim()))return res.status(503).json({error:'Identificação indisponível'});
    return res.status(200).json({nome:p.nome,cpf:p.cpf,endereco:p.endereco});
  }catch(_){return res.status(503).json({error:'Identificação indisponível'});}
};