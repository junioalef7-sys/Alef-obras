import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

// Ferramenta interna EXCLUSIVA para homologação isolada. Não emite cobranças,
// não chama o provedor, não registra pagamentos e nunca expõe segredos.
const REF = "xavwkfgrnowmusbkbiea";
const PIX_HOST = "https://pix-h.api.efipay.com.br";
const COB_HOST = "https://cobrancas-h.api.efipay.com.br";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store"
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" }
  });
}
function env(name: string) { return String(Deno.env.get(name) || "").trim(); }
function onlySandbox(raw: string, expected: string) {
  try {
    const u = new URL(raw);
    const e = new URL(expected);
    return u.protocol === "https:" && u.hostname === e.hostname &&
      (u.port === "" || u.port === "443") && (u.pathname === "/" || u.pathname === "") &&
      u.search === "" && u.hash === "" && u.username === "" && u.password === "";
  } catch { return false; }
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "GET" && req.method !== "POST") return json({ ok: false, error: "Método não permitido." }, 405);

  const url = env("SUPABASE_URL");
  const srv = env("SUPABASE_SERVICE_ROLE_KEY");
  let host = "";
  try { host = new URL(url).hostname; } catch { /* fail closed */ }
  if (host !== REF + ".supabase.co" || !srv) {
    return json({ ok: false, error: "Verificação indisponível fora do ambiente isolado." }, 503);
  }
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return json({ ok: false, error: "Faça login na conta de homologação." }, 401);
  try {
    const admin = createClient(url, srv, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: userData, error: userError } = await admin.auth.getUser(match[1]);
    if (userError || !userData?.user) return json({ ok: false, error: "Sessão de teste inválida." }, 401);
    const { data: perfil, error: profileError } = await admin.from("perfis")
      .select("papel,empresa_id").eq("id", userData.user.id).maybeSingle();
    if (profileError || !perfil?.empresa_id || !["proprietario", "administrador"].includes(String(perfil.papel))) {
      return json({ ok: false, error: "Acesso reservado ao administrador da homologação." }, 403);
    }

    // Somente nomes e flags: valores/segredos nunca saem deste processo.
    const credenciais = Boolean(env("EFI_CLIENT_ID") && env("EFI_CLIENT_SECRET"));
    const pixAmbiente = onlySandbox(env("EFI_PIX_BASE_URL"), PIX_HOST);
    const cobrancasAmbiente = onlySandbox(env("EFI_COBRANCAS_BASE_URL"), COB_HOST);
    const certificadoPix = Boolean(env("EFI_PIX_CERT_PEM") && env("EFI_PIX_KEY_PEM"));
    const chavePix = Boolean(env("EFI_PIX_CHAVE"));
    const webhookPix = Boolean(env("EFI_WEBHOOK_HMAC"));
    const webhookCobrancas = Boolean(env("EFI_COBRANCAS_WEBHOOK_HMAC"));
    const pixPronto = credenciais && pixAmbiente && certificadoPix && chavePix && webhookPix;
    const boletoPronto = credenciais && cobrancasAmbiente && webhookCobrancas;
    return json({
      ok: true,
      ambiente: "homologacao_isolada",
      verificaSomentePresenca: true,
      pix: {
        prontoParaTesteDeAutenticacao: pixPronto,
        credenciaisConfiguradas: credenciais,
        enderecoDeHomologacaoCorreto: pixAmbiente,
        certificadoConfigurado: certificadoPix,
        chavePixConfigurada: chavePix,
        protecaoWebhookConfigurada: webhookPix
      },
      boleto: {
        prontoParaTesteDeAutenticacao: boletoPronto,
        credenciaisConfiguradas: credenciais,
        enderecoDeHomologacaoCorreto: cobrancasAmbiente,
        protecaoWebhookConfigurada: webhookCobrancas
      },
      observacao: "Não houve comunicação com a Efí. A presença das credenciais não comprova sua validade."
    });
  } catch {
    return json({ ok: false, error: "Não foi possível concluir a verificação." }, 500);
  }
});
