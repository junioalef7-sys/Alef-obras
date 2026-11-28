import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
function efiBaseUrl() { return (Deno.env.get('EFI_PIX_BASE_URL') || 'https://pix-h.api.efipay.com.br').replace(/\/$/, '') }
function required(name: string) {
  const value = (Deno.env.get(name) || '').trim()
  if (!value) throw new Error(`${name} não configurado.`)
  return value
}
function pem(name:string) {
    if(name==='EFI_PIX_CERT_PEM'){
      const cert=(Deno.env.get(name)||'').trim();
      if(cert)return cert.replace(/\\n/g,'\n');
      const b64=(Deno.env.get('EFI_PIX_CERT_B64')||'').trim();
      if(!b64||!/^[A-Za-z0-9+/]*={0,2}$/.test(b64))throw Error('Certificado sandbox ausente')
      return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(b64),c=>c.charCodeAt(0))).trim()
    }
    return required(name).replace(/\\n/g,'\n');
  }
function makeClient() { return Deno.createHttpClient({ cert: pem('EFI_PIX_CERT_PEM'), key: pem('EFI_PIX_KEY_PEM') }) }

async function derivedWebhookHmac(serviceKey:string){
  const enc=new TextEncoder()
  const key=await crypto.subtle.importKey('raw',enc.encode(serviceKey),{name:'HMAC',hash:'SHA-256'},false,['sign'])
  const sig=await crypto.subtle.sign('HMAC',key,enc.encode('OBRIX_EFI_WEBHOOK_V1'))
  return Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('')
}
async function webhookHmac(serviceKey:string){
  const configured=(Deno.env.get('EFI_WEBHOOK_HMAC')||'').trim()
  return configured || await derivedWebhookHmac(serviceKey)
}
async function getToken(baseUrl: string, client: Deno.HttpClient) {
  const basic = btoa(`${required('EFI_PIX_CLIENT_ID')}:${required('EFI_PIX_CLIENT_SECRET')}`)
  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST', client,
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data?.access_token) throw new Error(`Falha na autenticação Efí (${response.status}).`)
  return String(data.access_token)
}
async function efiFetch(baseUrl: string, client: Deno.HttpClient, token: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init, client,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json', ...(init.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  return { response, data }
}
async function ensureWebhook(baseUrl:string, client:Deno.HttpClient, token:string, pixKey:string, supabaseUrl:string, serviceKey:string){
  const hmac=await webhookHmac(serviceKey)
  const webhookUrl=`${supabaseUrl}/functions/v1/efi-webhook?hmac=${encodeURIComponent(hmac)}&ignorar=`
  const {response,data}=await efiFetch(baseUrl,client,token,`/v2/webhook/${encodeURIComponent(pixKey)}`,{
    method:'PUT', headers:{'x-skip-mtls-checking':'true'}, body:JSON.stringify({webhookUrl}),
  })
  if(!response.ok) throw new Error(`Não foi possível configurar o webhook da Efí (${response.status}).`)
  return data
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  // Fail-closed: nunca executar fora do banco e das APIs de homologacao.
  let host='';try{host=new URL(supabaseUrl).hostname}catch{}
  if(host!=='xavwkfgrnowmusbkbiea.supabase.co'
     || (Deno.env.get('EFI_PIX_BASE_URL')||'').trim()!=='https://pix-h.api.efipay.com.br'
     || ((Deno.env.get('EFI_COBRANCAS_BASE_URL')||'').trim().replace(/\/$/,'') && (Deno.env.get('EFI_COBRANCAS_BASE_URL')||'').trim().replace(/\/$/,'')!=='https://cobrancas-h.api.efipay.com.br'))
    return json({error:'Ambiente nao autorizado para a funcao de teste.'},503)
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const accessToken = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!accessToken) return json({ error: 'Não autenticado.' }, 401)

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: userData, error: userError } = await admin.auth.getUser(accessToken)
  const user = userData?.user
  if (userError || !user) return json({ error: 'Sessão inválida.' }, 401)
  if(!['231e8d54-eee8-4ba9-b632-077c38179706','cf50c1d8-6c07-468d-92d0-e2291325bd02'].includes(user.id)) return json({error:'Acesso reservado a testers HML.'},403)


  let body: any = {}
  try { body = await req.json() } catch { return json({ error: 'JSON inválido.' }, 400) }

  const plano = String(body?.plano || '').toLowerCase()
  const integral = body.serie === 'bloco1-hml-v1'
  if (integral && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(body.requestId || '')) return json({error:'Pedido inválido'},400)
  const requestId = integral ? `bloco1:${user.id}:${plano}:${body.requestId}` : `hml_pix_${user.id}_${plano}_unico`
  if (!['mensal', 'anual'].includes(plano)) return json({ error: 'Plano inválido.' }, 400)

  const { data: perfil, error: perfilError } = await admin.from('perfis').select('empresa_id').eq('id', user.id).single()
  if (perfilError || !perfil?.empresa_id) return json({ error: 'Perfil sem empresa vinculada.' }, 403)
  const { data: assinatura, error: assinaturaError } = await admin.from('assinaturas').select('id').eq('empresa_id', perfil.empresa_id).single()
  if (assinaturaError || !assinatura?.id) return json({ error: 'Assinatura não encontrada.' }, 404)
  const { data: planoDb, error: planoError } = await admin.from('planos_assinatura')
    .select('codigo,nome,valor,periodo,ativo').eq('codigo', plano).eq('ativo', true).single()
  if (planoError || !planoDb) return json({ error: 'Plano indisponível.' }, 404)

  const baseUrl = efiBaseUrl()
  const homologacao = baseUrl.includes('pix-h.api.efipay.com.br')
  const amount = homologacao && !integral ? '1.00' : Number(planoDb.valor).toFixed(2)

  const { data: existente } = await admin.from('pagamentos_assinatura')
    .select('id,status,checkout_url,pix_copia_cola,vencimento,detalhes')
    .eq('provedor', 'efi').eq('idempotency_key', requestId).maybeSingle()

  const veioDaHomologacao = existente?.detalhes?.homologacao_teste === true
  const podeRetentar = false // evita emitir um segundo Pix sandbox na mesma conta/plano
  if (existente && !podeRetentar) {
    let qrData = existente.detalhes?.efi_qrcode || null
    let checkoutUrl = existente.checkout_url || null

    const locId = existente.detalhes?.efi?.loc?.id
    if (!qrData?.imagemQrcode && locId) {
      let client: Deno.HttpClient | null = null
      try {
        client = makeClient()
        const token = await getToken(baseUrl, client)
        const qrResult = await efiFetch(baseUrl, client, token, `/v2/loc/${encodeURIComponent(String(locId))}/qrcode`)
        if (qrResult.response.ok && qrResult.data) {
          qrData = qrResult.data
          checkoutUrl = qrData?.linkVisualizacao ? String(qrData.linkVisualizacao) : checkoutUrl
          await admin.from('pagamentos_assinatura').update({
            checkout_url: checkoutUrl,
            detalhes: {
              ...(existente.detalhes || {}),
              efi_qrcode: qrData,
              qr_recuperado_em: new Date().toISOString(),
            },
          }).eq('id', existente.id)
        }
      } catch (_) {
        // Mantém a cobrança existente mesmo se a consulta visual do QR falhar.
      } finally {
        client?.close()
      }
    }

    return json({
      pagamentoId: existente.id, status: existente.status, checkoutUrl,
      pixCopiaCola: existente.pix_copia_cola, qrCodeImage: qrData?.imagemQrcode || null,
      vencimento: existente.vencimento, reutilizado: true,
    })
  }

  let pagamento: { id: string } | null = null
  if (podeRetentar && existente?.id) {
    const { data: retry, error: retryError } = await admin.from('pagamentos_assinatura').update({
      status: 'criado', checkout_url: null, pix_copia_cola: null, vencimento: null, aprovado_em: null,
      provedor_recurso_tipo: null, provedor_preferencia_id: null, provedor_pagamento_id: null,
      detalhes: { tentativa_anterior: existente.detalhes || null, retentativa_em: new Date().toISOString(), migracao_para_producao: veioDaHomologacao && !homologacao },
    }).eq('id', existente.id).select('id').single()
    if (retryError || !retry?.id) return json({ error: 'Não foi possível reiniciar a cobrança Pix.' }, 500)
    pagamento = retry
  } else {
    const { data: novo, error: pagamentoError } = await admin.from('pagamentos_assinatura').insert({
      empresa_id: perfil.empresa_id, assinatura_id: assinatura.id, provedor: 'efi', metodo: 'pix', plano,
      status: 'criado', valor: planoDb.valor, moeda: 'BRL', idempotency_key: requestId,
    }).select('id').single()
    if (pagamentoError || !novo?.id) return json({ error: 'Não foi possível iniciar o pagamento.' }, 500)
    pagamento = novo
  }

  let client: Deno.HttpClient | null = null
  try {
    const pixKey = required('EFI_PIX_CHAVE')
    client = makeClient()
    const token = await getToken(baseUrl, client)
    if(false) await ensureWebhook(baseUrl,client,token,pixKey,supabaseUrl,serviceKey)

    const txid = `obrix${String(pagamento.id).replace(/-/g, '').slice(0, 30)}`
    const expiresSeconds = 24 * 60 * 60
    const expiresAt = new Date(Date.now() + expiresSeconds * 1000).toISOString()
    const chargePayload = {
      calendario: { expiracao: expiresSeconds }, valor: { original: amount }, chave: pixKey,
      solicitacaoPagador: `OBRIX - ${planoDb.nome || plano}`.slice(0, 140),
      infoAdicionais: [
        { nome: 'Pagamento OBRIX', valor: String(pagamento.id) }, { nome: 'Plano', valor: plano },
        ...(homologacao ? [{ nome: 'Homologação', valor: integral ? 'Plano integral em sandbox' : 'Teste R$ 1,00' }] : []),
      ],
    }

    let { response: chargeResponse, data: chargeData } = await efiFetch(baseUrl, client, token, `/v2/cob/${encodeURIComponent(txid)}`, { method: 'PUT', body: JSON.stringify(chargePayload) })
    if (chargeResponse.status === 409) {
      const existingCharge = await efiFetch(baseUrl, client, token, `/v2/cob/${encodeURIComponent(txid)}`)
      chargeResponse = existingCharge.response
      chargeData = existingCharge.data
    }
    if (!chargeResponse.ok || chargeData?.txid !== txid || chargeData?.valor?.original !== amount) {
      await admin.from('pagamentos_assinatura').update({
        status: 'rejeitado', detalhes: { efi: chargeData, httpStatus: chargeResponse.status, homologacao_teste: homologacao, efi_valor_cobrado: amount },
      }).eq('id', pagamento.id)
      return json({ error: 'A Efí não conseguiu criar a cobrança Pix.', httpEfipay:chargeResponse.status }, 502)
    }

    let qrData: any = null
    const locId = chargeData?.loc?.id
    if (locId) {
      const qrResult = await efiFetch(baseUrl, client, token, `/v2/loc/${encodeURIComponent(String(locId))}/qrcode`)
      if (qrResult.response.ok) qrData = qrResult.data
    }

    const pixCopiaCola = String(chargeData?.pixCopiaECola || qrData?.qrcode || '')
    const checkoutUrl = qrData?.linkVisualizacao ? String(qrData.linkVisualizacao) : null
    const providerStatus = String(chargeData?.status || '').toUpperCase()
    const approved = false // HML nao confirma nem ativa assinatura
    const { error: saveError } = await admin.from('pagamentos_assinatura').update({
      status: approved ? 'aprovado' : 'pendente', provedor_recurso_tipo: 'pix_cob', provedor_preferencia_id: txid,
      checkout_url: checkoutUrl, pix_copia_cola: pixCopiaCola || null, vencimento: expiresAt,
      aprovado_em: approved ? new Date().toISOString() : null,
      detalhes: { ...(integral ? {serie:'bloco1-hml-v1'} : {}), efi: chargeData, efi_qrcode: qrData, homologacao_teste: homologacao, efi_valor_cobrado: amount, valor_plano: Number(planoDb.valor).toFixed(2), webhook_configurado: !homologacao },
    }).eq('id', pagamento.id)
    if (saveError) return json({ error: 'Cobrança criada, mas houve falha ao salvar localmente.' }, 500)

    if (false && approved) {
      const { error: applyError } = await admin.rpc('obrix_aplicar_pagamento_assinatura', { p_pagamento_id: pagamento.id })
      if (applyError) return json({ error: 'Pagamento confirmado, mas falhou ao ativar a assinatura.' }, 500)
    }
    return json({
      pagamentoId: pagamento.id, status: approved ? 'aprovado' : 'pendente', metodo: 'pix', pixCopiaCola: pixCopiaCola || null,
      qrCodeImage: qrData?.imagemQrcode || null, checkoutUrl, vencimento: expiresAt, txid, aplicado: approved,
      homologacao, valorCobranca: amount, webhookConfigurado: !homologacao,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await admin.from('pagamentos_assinatura').update({ status: 'rejeitado', detalhes: { erro: message } }).eq('id', pagamento.id)
    return json({ error: message }, 503)
  } finally { client?.close() }
})
