export function cents(value) {
  const match = /^(0|[1-9]\d{0,7})(?:\.(\d{1,2}))?$/.exec(String(value))
  if (!match) throw new Error('Valor monetário inválido')
  return Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'))
}

export function pixReceipt(payment, charge, receiver) {
  const txid = payment.provedor_preferencia_id
  if (!txid || charge.txid !== txid || !receiver || charge.chave !== receiver ||
      payment.moeda !== 'BRL' || cents(charge.valor?.original) !== cents(payment.valor)) {
    throw new Error('Identificador, recebedor ou valor Pix divergente')
  }
  if (charge.status !== 'CONCLUIDA') return null
  const entries = charge.pix
  if (!Array.isArray(entries) || entries.length !== 1) throw new Error('Recebimento Pix inconclusivo')
  const pix = entries[0]
  if (pix.txid !== txid || !/^E[a-zA-Z0-9]{31}$/.test(pix.endToEndId) ||
      cents(pix.valor) !== cents(payment.valor) || !Number.isFinite(Date.parse(pix.horario))) {
    throw new Error('Recebimento Pix inválido ou parcial')
  }
  if (Array.isArray(pix.devolucoes) && pix.devolucoes.some(d => d.status === 'DEVOLVIDO' && cents(d.valor) > 0)) return {refund:true}
  if (pix.devolucoes !== undefined && (!Array.isArray(pix.devolucoes) || pix.devolucoes.some(d => d.status !== 'NAO_REALIZADO'))) {
    throw new Error('Pix com devolução requer conciliação')
  }
  return {p_origem:'pix-h',p_cobranca:txid,p_referencia:pix.endToEndId,p_centavos:cents(pix.valor),p_status:charge.status}
}

export function chargeReceipt(payment, charge, eventValue) {
  const id = String(payment.provedor_pagamento_id || '')
  if (!id || String(charge.charge_id) !== id || charge.custom_id !== 'obrix_hml_' + payment.id ||
      charge.total !== cents(payment.valor) || payment.moeda !== 'BRL') throw new Error('Cobrança divergente')
  if (charge.status !== 'paid') return null
  const method = payment.metodo === 'cartao' ? 'credit_card' : 'banking_billet'
  if (charge.payment?.method !== method && charge.payment?.payment_method !== method) throw new Error('Método divergente')
  const received = charge.payment?.paid_value ?? eventValue
  if (!Number.isSafeInteger(received) || received !== charge.total ||
      (eventValue !== undefined && eventValue !== received)) throw new Error('Liquidação integral não comprovada')
  return {p_origem:'cobrancas-h',p_cobranca:id,p_referencia:id,p_centavos:received,p_status:charge.status}
}
export async function settle(admin, payment, receipt) {
  const { data, error } = await admin.rpc('obrix_hml_liquidar_v1', {
    p_id:payment.id,p_empresa:payment.empresa_id,p_moeda:'BRL',...receipt
  })
  if (error || data?.aplicado !== true) throw new Error('Falha ao registrar a liquidação')
  return data
}
export async function state(admin,payment,reference,status){
  const {error}=await admin.rpc('obrix_hml_estado_efi_v1',{p_id:payment.id,p_empresa:payment.empresa_id,p_cobranca:reference,p_estado:status})
  if(error)throw new Error('Falha ao conciliar o estado da cobrança')
}
export async function syncPix(admin,payment,charge,receiver){
  const receipt=pixReceipt(payment,charge,receiver)
  if(receipt && !receipt.refund){await settle(admin,payment,receipt);return 'aprovado'}
  await state(admin,payment,charge.txid,receipt?.refund?'DEVOLVIDO':charge.status)
  return receipt?.refund?'reembolsado':charge.status==='ATIVA'?'pendente':'cancelado'
}
export async function syncCharge(admin,payment,charge,eventValue){
  const receipt=chargeReceipt(payment,charge,eventValue)
  if(receipt){await settle(admin,payment,receipt);return true}
  await state(admin,payment,String(charge.charge_id),charge.status)
  return false
}
