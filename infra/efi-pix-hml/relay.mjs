// OBRIX — Efí Pix HML | Relay mTLS (REFERÊNCIA, NÃO IMPLANTADO).
// Testar somente em servidor dedicado com DNS, HTTPS e cadeia Efí HML verificados.
// Nunca armazenar certificados de domínio ou segredo HMAC no Git.
import https from 'node:https';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';

const UPSTREAM='https://xavwkfgrnowmusbkbiea.supabase.co/functions/v1/obrix-hml-pix-webhook-inbox-20261119';
const MAX_BYTES=32768;
const env=(name)=>process.env[name]||'';
const load=(name)=>{const val=env(name);if(!val)throw Error('Missing required env: '+name);return val};
const relayKey=load('OBRIX_HML_EFI_PIX_RELAY_HMAC_KEY');
if(Buffer.byteLength(relayKey,'utf8')<32)throw Error('Relay HMAC key must have >=32 bytes');
const options={
  key:readFileSync(load('OBRIX_HML_SERVER_TLS_KEY_PATH')),
  cert:readFileSync(load('OBRIX_HML_SERVER_TLS_CERT_PATH')),
  ca:readFileSync(load('OBRIX_HML_EFI_WEBHOOK_CA_PATH')),
  minVersion:'TLSv1.2',
  requestCert:true,
  rejectUnauthorized:true,
};
const server=https.createServer(options,async(req,res)=>{
  const respond=(status,message)=>{
    if(res.headersSent)return;
    res.writeHead(status,{
      'Content-Type':'text/plain; charset=utf-8',
      'Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff'
    });
    res.end(message);
  };
  // Validar o certificado do cliente na terminação TLS antes do handler.
  if(!req.socket.authorized)return respond(403,'Forbidden');
  let path;
  try{path=new URL(req.url||'','https://invalid.local').pathname}
  catch{return respond(404,'Not Found')}
  if(req.method!=='POST')return respond(405,'Method Not Allowed');
  if(path==='/webhook')return respond(200,'200'); // desafio de cadastro Efí
  if(path!=='/webhook/pix')return respond(404,'Not Found');

  if(!String(req.headers['content-type']||'').toLowerCase().includes('application/json'))
    return respond(415,'Unsupported Media Type');
  const chunks=[];
  let total=0;
  try{
    for await(const chunk of req){
      total+=chunk.length;
      if(total>MAX_BYTES)return respond(413,'Request too large');
      chunks.push(chunk);
    }
    if(total===0)return respond(400,'Empty body');
    const body=Buffer.concat(chunks);
    const timestamp=String(Math.floor(Date.now()/1000));
    const signature='sha256='+createHmac('sha256',relayKey)
      .update(timestamp+'.','utf8').update(body).digest('hex');
    const upstream=await fetch(UPSTREAM,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-obrix-hml-relay-timestamp':timestamp,
        'x-obrix-hml-relay-signature':signature
      },
      body,
      signal:AbortSignal.timeout(12000)
    });
    // A Efí precisa de um ACK; 200 só depois do inbox aceitar o evento.
    if(upstream.status===202)return respond(200,'200');
    return respond(503,'Temporary failure');
  }catch{
    // Não registrar corpo, URL de credenciais, token ou dados do pagador.
    return respond(503,'Temporary failure');
  }
});
server.headersTimeout=15000;
server.requestTimeout=20000;
server.on('tlsClientError',()=>{/* silêncio intencional sobre o cliente */});
const port=Number(env('OBRIX_HML_WEBHOOK_PORT')||'8443');
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid port');
server.listen(port,'0.0.0.0');
