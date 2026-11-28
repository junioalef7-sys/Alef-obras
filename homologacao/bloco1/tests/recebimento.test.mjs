import assert from 'node:assert/strict'
import test from 'node:test'
import {pixReceipt,chargeReceipt,syncPix,syncCharge} from '../supabase/functions/_shared/recebimento.mjs'
const txid='obrix'+'1'.repeat(30), id='E'+'1'.repeat(31)
const p={id:'fixture',valor:'39.90',moeda:'BRL',metodo:'boleto',provedor_preferencia_id:txid,provedor_pagamento_id:'123'}
const pix={txid,chave:'sandbox',status:'CONCLUIDA',valor:{original:'39.90'},pix:[{txid,valor:'39.90',horario:'2026-11-27T14:00:00Z',endToEndId:id}]}
const charge={charge_id:123,custom_id:'obrix_hml_fixture',status:'paid',total:3990,payment:{method:'banking_billet',paid_value:3990}}
test('Pix integral',()=>assert.equal(pixReceipt(p,pix,'sandbox').p_centavos,3990))
for(const [label,change] of Object.entries({recebedor:{chave:'outro'},txid:{txid:'outro'},parcial:{pix:[{...pix.pix[0],valor:'1.00'}]},ausente:{pix:[]},duplicado:{pix:[...pix.pix,...pix.pix]},pendencia_devolucao:{pix:[{...pix.pix[0],devolucoes:[{status:'EM_PROCESSAMENTO'}]}]},identificador:{pix:[{...pix.pix[0],endToEndId:''}]}}))
test('Pix rejeita '+label,()=>assert.throws(()=>pixReceipt(p,{...pix,...change},'sandbox')))
test('Pix pendente',()=>assert.equal(pixReceipt(p,{...pix,status:'ATIVA'},'sandbox'),null))
test('Pix parcialmente devolvido bloqueia ativação',()=>assert.equal(pixReceipt(p,{...pix,pix:[{...pix.pix[0],devolucoes:[{status:'DEVOLVIDO',valor:'1.00'}]}]},'sandbox').refund,true))
for(const method of ['boleto','cartao']){
 const payload={...charge,payment:{method:method==='cartao'?'credit_card':'banking_billet',paid_value:3990}}
 test(method+' pago',()=>assert.equal(chargeReceipt({...p,metodo:method},payload).p_centavos,3990))
 for(const status of ['waiting','identified','approved','settled','canceled','unpaid','refunded'])
 test(method+' '+status,()=>assert.equal(chargeReceipt({...p,metodo:method},{...payload,status}),null))
}
for(const [label,change] of Object.entries({id:{charge_id:124},empresa:{custom_id:'outro'},bruto:{total:10},liquido:{payment:{method:'banking_billet',paid_value:100}},ausente:{payment:{method:'banking_billet'}},metodo:{payment:{method:'credit_card',paid_value:3990}}}))
test('Cobrança rejeita '+label,()=>assert.throws(()=>chargeReceipt(p,{...charge,...change})))
test('Falha transacional impede resposta de sucesso',async()=>{const admin={rpc:async()=>({error:{}})};await assert.rejects(syncPix(admin,p,pix,'sandbox'));await assert.rejects(syncCharge(admin,p,charge))})

