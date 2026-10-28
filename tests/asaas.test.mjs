import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createAsaasHandlers,
  normalizeCpfCnpj,
  isValidCpfCnpj,
  getAsaasBaseUrl,
} from "../src/core/api-asaas.js";
import { runtime } from "../src/core/runtime.js";

test("Asaas Integration: validação e normalização de CPF/CNPJ", () => {
  assert.equal(normalizeCpfCnpj("123.456.789-01"), "12345678901");
  assert.equal(normalizeCpfCnpj("12.345.678/0001-90"), "12345678000190");
  assert.equal(normalizeCpfCnpj(""), "");

  assert.equal(isValidCpfCnpj("123.456.789-01"), true);
  assert.equal(isValidCpfCnpj("12.345.678/0001-90"), true);
  assert.equal(isValidCpfCnpj("12345"), false);
  assert.equal(isValidCpfCnpj(""), false);
});

test("Asaas Integration: detecção de URL base sandbox e produção", () => {
  assert.equal(getAsaasBaseUrl("sandbox"), "https://sandbox.asaas.com/api/v3");
  assert.equal(getAsaasBaseUrl("producao"), "https://api.asaas.com/v3");
  assert.equal(getAsaasBaseUrl("production"), "https://api.asaas.com/v3");
  assert.equal(getAsaasBaseUrl(""), "https://sandbox.asaas.com/api/v3");
});

test("Asaas Integration: ciclo completo de clientes, cobrança PIX, assinatura e webhook", async () => {
  const tables = new Map();
  const getTable = (name) => {
    if (!tables.has(name)) tables.set(name, new Map());
    return tables.get(name);
  };

  const originalMethods = {
    getById: runtime.getById,
    list: runtime.list,
    upsert: runtime.upsert,
    create: runtime.create,
    requireProfile: runtime.requireProfile,
  };

  runtime.getById = async (table, id) => getTable(table).get(String(id)) || null;
  runtime.list = async (table) => [...getTable(table).values()];
  runtime.create = async (table, record) => {
    const idKey =
      table === "AsaasClientes"
        ? "ClienteID"
        : table === "AsaasCobrancas"
        ? "CobrancaID"
        : table === "AsaasAssinaturas"
        ? "AssinaturaID"
        : table === "AsaasWebhooks"
        ? "EventoID"
        : "id";
    const id = String(record[idKey] || record.id || `rec_${Date.now()}`);
    const saved = { ...record, [idKey]: id };
    getTable(table).set(id, saved);
    return saved;
  };
  runtime.upsert = async (table, record) => {
    const idKey =
      table === "Configuracoes"
        ? "Chave"
        : table === "AsaasClientes"
        ? "ClienteID"
        : table === "AsaasCobrancas"
        ? "CobrancaID"
        : table === "AsaasAssinaturas"
        ? "AssinaturaID"
        : table === "AsaasWebhooks"
        ? "EventoID"
        : "id";
    const id = String(record[idKey] || record.id || `rec_${Date.now()}`);
    const saved = { ...record, [idKey]: id };
    getTable(table).set(id, saved);
    return saved;
  };
  runtime.requireProfile = async () => ({ Perfil: "Administrador" });

  try {
    const handlers = createAsaasHandlers();

    // 1. Configuração do Asaas
    const saveRes = await handlers.asaasConfigSave([
      {
        apiKey: "simulado_token_asaas_12345",
        ambiente: "sandbox",
        emailNotificacao: "financeiro@empresa.com",
      },
    ]);
    assert.equal(saveRes.success, true);

    const configStatus = await handlers.asaasConfigGet();
    assert.equal(configStatus.success, true);
    assert.equal(configStatus.data.configurado, true);
    assert.equal(configStatus.data.ambiente, "sandbox");
    assert.ok(configStatus.data.apiKeyMascarada.includes("****"));

    // 2. Criação/Obtenção de Cliente
    const cliRes = await handlers.asaasCustomerCreateOrGet([
      {
        nome: "Restaurante Sabor da Vila",
        cpfCnpj: "12.345.678/0001-90",
        email: "financeiro@sabordavila.com.br",
        telefone: "71997069291",
      },
    ]);
    assert.equal(cliRes.success, true);
    assert.ok(cliRes.data.AsaasID);
    assert.equal(cliRes.data.Nome, "Restaurante Sabor da Vila");

    // 3. Criação de Cobrança PIX com QR Code
    const cobRes = await handlers.asaasPaymentCreate([
      {
        cliente: cliRes.data,
        valor: 127.0,
        plano: "Pro",
        formaPagamento: "PIX",
        descricao: "Assinatura Mensal PontoFlow Pro",
      },
    ]);
    assert.equal(cobRes.success, true);
    assert.equal(cobRes.data.Valor, 127.0);
    assert.equal(cobRes.data.Plano, "Pro");
    assert.equal(cobRes.data.FormaPagamento, "PIX");
    assert.equal(cobRes.data.Status, "PENDING");
    assert.ok(cobRes.data.PixCopiaCola, "Deve gerar código copia e cola do PIX");
    assert.ok(cobRes.data.PixQrCodeBase64, "Deve gerar imagem Base64 do QR Code");

    // 4. Criação de Assinatura Recorrente Mensal
    const subRes = await handlers.asaasSubscriptionCreate([
      {
        cliente: cliRes.data,
        valor: 67.0,
        plano: "Start",
        formaPagamento: "PIX",
      },
    ]);
    assert.equal(subRes.success, true);
    assert.equal(subRes.data.Valor, 67.0);
    assert.equal(subRes.data.Ciclo, "MENSAL");
    assert.equal(subRes.data.Status, "ACTIVE");

    // 5. Processamento de Webhook de Pagamento Confirmado
    const webhookRes = await handlers.asaasWebhookProcess([
      {
        event: "PAYMENT_CONFIRMED",
        payment: {
          id: cobRes.data.AsaasID,
          value: 127.0,
          status: "CONFIRMED",
          confirmedDate: "2026-10-28T15:00:00Z",
        },
      },
    ]);
    assert.equal(webhookRes.success, true);
    assert.equal(webhookRes.data.processado, true);

    // 6. Verificação do status atualizado na cobrança local
    const cobAtualizada = await runtime.getById("AsaasCobrancas", cobRes.data.CobrancaID);
    assert.equal(cobAtualizada.Status, "CONFIRMED");
    assert.equal(cobAtualizada.PagoEm, "2026-10-28T15:00:00Z");

    // 7. Listagem de cobranças para o administrador
    const listRes = await handlers.asaasPaymentList([{ plano: "Pro" }]);
    assert.equal(listRes.success, true);
    assert.equal(listRes.data.length, 1);
    assert.equal(listRes.data[0].Plano, "Pro");
  } finally {
    runtime.getById = originalMethods.getById;
    runtime.list = originalMethods.list;
    runtime.upsert = originalMethods.upsert;
    runtime.create = originalMethods.create;
    runtime.requireProfile = originalMethods.requireProfile;
  }
});

test("Asaas Integration: asaasQuickSetup inicializa ambiente Sandbox com dados demonstrativos", async () => {
  const tables = new Map();
  const getTable = (name) => {
    if (!tables.has(name)) tables.set(name, new Map());
    return tables.get(name);
  };

  const originalMethods = {
    getById: runtime.getById,
    list: runtime.list,
    upsert: runtime.upsert,
    requireProfile: runtime.requireProfile,
  };

  runtime.getById = async (table, id) => getTable(table).get(String(id)) || null;
  runtime.list = async (table) => [...getTable(table).values()];
  runtime.upsert = async (table, record) => {
    const idKey =
      table === "Configuracoes"
        ? "Chave"
        : table === "AsaasCobrancas"
        ? "CobrancaID"
        : table === "AsaasAssinaturas"
        ? "AssinaturaID"
        : "id";
    const id = String(record[idKey] || record.id || `rec_${Date.now()}`);
    const saved = { ...record, [idKey]: id };
    getTable(table).set(id, saved);
    return saved;
  };
  runtime.requireProfile = async () => ({
    Perfil: "Administrador",
    Email: "glleucekk77@gmail.com",
  });

  try {
    const handlers = createAsaasHandlers();
    const quickRes = await handlers.asaasQuickSetup([]);
    assert.equal(quickRes.success, true);
    assert.equal(quickRes.data.ambiente, "sandbox");

    const config = await handlers.asaasConfigGet();
    assert.equal(config.data.configurado, true);
    assert.equal(config.data.ambiente, "sandbox");

    const listRes = await handlers.asaasPaymentList([]);
    assert.equal(listRes.success, true);
    assert.equal(listRes.data.length, 3);
    assert.equal(listRes.data.estatisticas.totalRecebido, 194);
    assert.equal(listRes.data.estatisticas.pendentes, 1);
    assert.equal(listRes.data.estatisticas.totalAssinaturas, 2);
  } finally {
    runtime.getById = originalMethods.getById;
    runtime.list = originalMethods.list;
    runtime.upsert = originalMethods.upsert;
    runtime.requireProfile = originalMethods.requireProfile;
  }
});

test("ZERO EMOJIS: Verificação estrita nos novos arquivos do Asaas", async () => {
  const asaasCode = await readFile(
    new URL("../src/core/api-asaas.js", import.meta.url),
    "utf8"
  );

  // Regex para emojis
  const emojiRegex =
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;

  const matches = asaasCode.match(emojiRegex) || [];
  assert.equal(
    matches.length,
    0,
    `Arquivo api-asaas.js não deve conter emojis operacionais. Encontrados: ${matches.join(" ")}`
  );
});

test("Asaas UI Integration: validação de componentes em Index.html, Scripts.html e vendas.html", async () => {
  const indexHtml = await readFile(
    new URL("../src/legacy/Index.html", import.meta.url),
    "utf8"
  );
  const scriptsHtml = await readFile(
    new URL("../src/legacy/Scripts.html", import.meta.url),
    "utf8"
  );
  const vendasHtml = await readFile(
    new URL("../public/vendas.html", import.meta.url),
    "utf8"
  );

  // 1. Index.html deve possuir a rota de navegação e a view de faturamento Asaas
  assert.ok(indexHtml.includes('data-view="asaas-billing"'), "Index.html deve conter botão para asaas-billing");
  assert.ok(indexHtml.includes('id="view-asaas-billing"'), "Index.html deve conter a section view-asaas-billing");
  assert.ok(indexHtml.includes('id="asaasConfigApiKey"'), "Index.html deve conter campo de chave de API Asaas");

  // 2. Scripts.html deve registrar as funções em FN e conter o carregador da view
  assert.ok(scriptsHtml.includes('asaasConfigGet: "asaasConfigGet"'), "Scripts.html deve conter asaasConfigGet em FN");
  assert.ok(scriptsHtml.includes('"asaas-billing"'), "Scripts.html deve conter asaas-billing nas adminViews");
  assert.ok(scriptsHtml.includes("loadAsaasBillingView"), "Scripts.html deve conter loadAsaasBillingView");

  // 3. vendas.html deve conter o modal de checkout do Asaas com Pix e contato oficial
  assert.ok(vendasHtml.includes('id="asaasCheckoutModal"'), "vendas.html deve conter o modal de checkout do Asaas");
  assert.ok(vendasHtml.includes("btn-open-checkout"), "vendas.html deve conter botões de abertura de checkout");
  assert.ok(vendasHtml.includes("71997069291"), "vendas.html deve conter o telefone oficial (71) 99706-9291");
  assert.ok(vendasHtml.includes("R$ 67"), "vendas.html deve conter o plano Start de R$ 67");
  assert.ok(vendasHtml.includes("R$ 127"), "vendas.html deve conter o plano Pro de R$ 127");
  assert.ok(vendasHtml.includes("R$ 197"), "vendas.html deve conter o plano Enterprise de R$ 197");

  // 4. Verificação de zero emojis operacionais nos trechos novos
  const asaasSectionMatch = indexHtml.match(/<section id="view-asaas-billing"[\s\S]*?<\/section>/);
  assert.ok(asaasSectionMatch, "Deve encontrar a section do Asaas no Index.html");
  
  const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;
  const indexEmojis = asaasSectionMatch[0].match(emojiRegex) || [];
  assert.equal(indexEmojis.length, 0, `Section Asaas não deve conter emojis operacionais. Encontrados: ${indexEmojis.join(" ")}`);
});
