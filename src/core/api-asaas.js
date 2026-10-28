import { runtime } from "./runtime.js";
import { assert, nowIso, uuid } from "./utils.js";
import { audit, isAdmin, isManager, requireAdmin, success } from "./api-base.js";

const ASAAS_SANDBOX_URL = "https://sandbox.asaas.com/api/v3";
const ASAAS_PRODUCTION_URL = "https://api.asaas.com/v3";

/**
 * Normaliza CPF ou CNPJ removendo pontuação
 */
export function normalizeCpfCnpj(raw) {
  return String(raw || "").replace(/\D/g, "");
}

/**
 * Valida formato básico de CPF ou CNPJ
 */
export function isValidCpfCnpj(raw) {
  const digits = normalizeCpfCnpj(raw);
  return digits.length === 11 || digits.length === 14;
}

/**
 * Obtém a URL base da API Asaas conforme o ambiente configurado
 */
export function getAsaasBaseUrl(ambiente) {
  const amb = String(ambiente || "").toLowerCase().trim();
  return amb === "producao" || amb === "production"
    ? ASAAS_PRODUCTION_URL
    : ASAAS_SANDBOX_URL;
}

/**
 * Executa uma requisição HTTP à API do Asaas com tratamento defensivo
 */
export async function fetchAsaasApi(endpoint, options = {}, config = null) {
  const asaasConfig = config || (await runtime.getById("Configuracoes", "Asaas").catch(() => null)) || {};
  const apiKey = String(asaasConfig.ApiKey || asaasConfig.apiKey || "").trim();
  const ambiente = asaasConfig.Ambiente || asaasConfig.ambiente || "sandbox";

  // Se não houver chave real configurada, usa modo mock determinístico para testes e homologação
  if (!apiKey || apiKey.startsWith("simulado_") || apiKey.startsWith("mock_")) {
    return mockAsaasResponse(endpoint, options);
  }

  const baseUrl = getAsaasBaseUrl(ambiente);
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers = {
    "Content-Type": "application/json",
    access_token: apiKey,
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      Array.isArray(data.errors) && data.errors.length
        ? data.errors.map((e) => e.description || e.message).join(", ")
        : data.message || `Erro na API Asaas (HTTP ${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Emulador local/mock da API Asaas para testes unitários e homologação local sem chave ativa
 */
function mockAsaasResponse(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();

  // 1. Clientes (/customers)
  if (endpoint.startsWith("/customers")) {
    if (method === "POST") {
      const body = options.body || {};
      const fakeId = `cus_mock_${uuid().slice(0, 8)}`;
      return Promise.resolve({
        object: "customer",
        id: fakeId,
        name: body.name || "Cliente Teste",
        email: body.email || "cliente@exemplo.com",
        cpfCnpj: body.cpfCnpj || "12345678909",
        mobilePhone: body.mobilePhone || "71997069291",
        dateCreated: nowIso(),
      });
    }
    return Promise.resolve({
      object: "list",
      data: [],
      hasMore: false,
      totalCount: 0,
    });
  }

  // 2. PIX QR Code (/payments/{id}/pixQrCode)
  if (endpoint.includes("/pixQrCode")) {
    const fakePayload =
      "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540567.005802BR5913PONTOFLOW PRO6008SALVADOR62070503***6304ABCD";
    // Imagem SVG mínima em Base64
    const fakeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#ffffff"/><rect x="20" y="20" width="50" height="50" fill="#000"/><rect x="130" y="20" width="50" height="50" fill="#000"/><rect x="20" y="130" width="50" height="50" fill="#000"/><text x="100" y="105" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="#2563EB">PIX ASAAS</text></svg>`;
    const fakeBase64 = Buffer.from(fakeSvg).toString("base64");

    return Promise.resolve({
      encodedImage: fakeBase64,
      payload: fakePayload,
      expirationDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    });
  }

  // 3. Cobranças (/payments)
  if (endpoint.startsWith("/payments")) {
    if (method === "POST") {
      const body = options.body || {};
      const fakePaymentId = `pay_mock_${uuid().slice(0, 10)}`;
      return Promise.resolve({
        object: "payment",
        id: fakePaymentId,
        customer: body.customer || "cus_mock_1234",
        value: Number(body.value) || 67.0,
        netValue: (Number(body.value) || 67.0) * 0.98,
        billingType: body.billingType || "PIX",
        status: "PENDING",
        dueDate: body.dueDate || nowIso().slice(0, 10),
        invoiceUrl: `https://sandbox.asaas.com/i/${fakePaymentId}`,
        bankSlipUrl: body.billingType === "BOLETO" ? `https://sandbox.asaas.com/b/${fakePaymentId}` : null,
        description: body.description || "Assinatura PontoFlow Pro",
        dateCreated: nowIso(),
      });
    }

    // Consulta de status (/payments/{id})
    return Promise.resolve({
      object: "payment",
      id: endpoint.split("/").pop(),
      status: "CONFIRMED",
      value: 67.0,
      billingType: "PIX",
      confirmedDate: nowIso(),
    });
  }

  // 4. Assinaturas Recorrentes (/subscriptions)
  if (endpoint.startsWith("/subscriptions")) {
    if (method === "POST") {
      const body = options.body || {};
      const fakeSubId = `sub_mock_${uuid().slice(0, 10)}`;
      return Promise.resolve({
        object: "subscription",
        id: fakeSubId,
        customer: body.customer || "cus_mock_1234",
        value: Number(body.value) || 67.0,
        billingType: body.billingType || "PIX",
        cycle: body.cycle || "MONTHLY",
        status: "ACTIVE",
        nextDueDate: body.nextDueDate || nowIso().slice(0, 10),
        description: body.description || "Assinatura Recorrente PontoFlow Pro",
        dateCreated: nowIso(),
      });
    }
  }

  return Promise.resolve({ success: true, mock: true });
}

/**
 * Cria os handlers da API do Asaas integrados ao sistema PontoFlow Pro
 */
export function createAsaasHandlers() {
  return {
    /**
     * Obtém as configurações e status da integração com o Asaas
     */
    async asaasConfigGet() {
      const config = (await runtime.getById("Configuracoes", "Asaas").catch(() => null)) || {};
      const apiKey = String(config.ApiKey || config.apiKey || "");
      const isConfigured = Boolean(apiKey.trim());

      const maskedKey = isConfigured
        ? `${apiKey.slice(0, 4)}********${apiKey.slice(-4)}`
        : "";

      return success({
        configurado: isConfigured,
        ambiente: config.Ambiente || "sandbox",
        apiKeyMascarada: maskedKey,
        chaveOriginalParcial: maskedKey,
        emailNotificacao: config.EmailNotificacao || "",
        webhookAtivo: Boolean(config.WebhookAtivo),
        modoSimulado: !isConfigured || apiKey.startsWith("simulado_") || apiKey.startsWith("mock_"),
        ultimaAtualizacao: config.UltimaAtualizacao || null,
      });
    },

    /**
     * Salva as credenciais e parâmetros da integração com o Asaas
     */
    async asaasConfigSave(args) {
      const profile = await runtime.requireProfile();
      requireAdmin(profile);
      const [payload = {}] = args;
      const { apiKey = "", ambiente = "sandbox", emailNotificacao = "", webhookToken = "" } = payload;

      const cleanKey = String(apiKey).trim();
      assert(cleanKey, "A Chave de API (Access Token) do Asaas é obrigatória.");

      const cleanAmbiente = String(ambiente).toLowerCase() === "producao" ? "producao" : "sandbox";

      const record = {
        Chave: "Asaas",
        ConfigID: "Asaas",
        ApiKey: cleanKey,
        Ambiente: cleanAmbiente,
        EmailNotificacao: String(emailNotificacao).trim(),
        WebhookToken: String(webhookToken).trim() || uuid(),
        WebhookAtivo: true,
        UltimaAtualizacao: nowIso(),
      };

      await runtime.upsert("Configuracoes", record);

      await audit("Configuração Asaas Atualizada", {
        ambiente: cleanAmbiente,
        configurado: true,
      });

      return success({
        mensagem: `Integração Asaas configurada com sucesso em modo ${cleanAmbiente}.`,
        ambiente: cleanAmbiente,
      });
    },

    /**
     * Configuração Rápida do Asaas (Modo Sandbox / Demonstração)
     * Ativa a integração com chave simulada e dados iniciais de cobrança
     */
    async asaasQuickSetup(args = []) {
      const profile = await runtime.requireProfile();
      requireAdmin(profile);

      const cleanKey = "simulado_token_asaas_pontoflow";
      const cleanAmbiente = "sandbox";
      const email = profile.Email || "glleucekk77@gmail.com";

      const record = {
        Chave: "Asaas",
        ConfigID: "Asaas",
        ApiKey: cleanKey,
        Ambiente: cleanAmbiente,
        EmailNotificacao: email,
        WebhookToken: "whsec_pontoflow_demo",
        WebhookAtivo: true,
        UltimaAtualizacao: nowIso(),
      };

      await runtime.upsert("Configuracoes", record);

      // Popula dados demonstrativos se a tabela de cobranças estiver vazia
      const cobrancasExistentes = (await runtime.list("AsaasCobrancas").catch(() => [])) || [];
      if (!cobrancasExistentes.length) {
        const demoCharges = [
          {
            CobrancaID: "cob_demo_01",
            AsaasPaymentID: "pay_demo_01",
            ClienteNome: "Padaria e Confeitaria Central Ltda",
            ClienteEmail: "financeiro@padariacentral.com.br",
            ClienteCpfCnpj: "12345678000190",
            ClienteTelefone: "71997069291",
            Plano: "Start",
            Valor: 67.0,
            FormaPagamento: "PIX",
            Status: "RECEIVED",
            Vencimento: nowIso().slice(0, 10),
            InvoiceUrl: "https://sandbox.asaas.com/i/pay_demo_01",
            CriadoEm: nowIso(),
          },
          {
            CobrancaID: "cob_demo_02",
            AsaasPaymentID: "pay_demo_02",
            ClienteNome: "Hamburgueria & Restaurante House",
            ClienteEmail: "financeiro@house.com.br",
            ClienteCpfCnpj: "98765432000110",
            ClienteTelefone: "71997069291",
            Plano: "Pro",
            Valor: 127.0,
            FormaPagamento: "PIX",
            Status: "RECEIVED",
            Vencimento: nowIso().slice(0, 10),
            InvoiceUrl: "https://sandbox.asaas.com/i/pay_demo_02",
            CriadoEm: nowIso(),
          },
          {
            CobrancaID: "cob_demo_03",
            AsaasPaymentID: "pay_demo_03",
            ClienteNome: "Rede Supermercados Bahia Sul",
            ClienteEmail: "contato@bahiasul.com.br",
            ClienteCpfCnpj: "45123789000155",
            ClienteTelefone: "71997069291",
            Plano: "Enterprise",
            Valor: 197.0,
            FormaPagamento: "BOLETO",
            Status: "PENDING",
            Vencimento: nowIso().slice(0, 10),
            InvoiceUrl: "https://sandbox.asaas.com/i/pay_demo_03",
            CriadoEm: nowIso(),
          },
        ];

        for (const c of demoCharges) {
          await runtime.upsert("AsaasCobrancas", c);
        }
      }

      const assinaturasExistentes = (await runtime.list("AsaasAssinaturas").catch(() => [])) || [];
      if (!assinaturasExistentes.length) {
        const demoSubs = [
          {
            AssinaturaID: "sub_demo_01",
            AsaasSubscriptionID: "sub_demo_01",
            ClienteNome: "Padaria e Confeitaria Central Ltda",
            Plano: "Start",
            Valor: 67.0,
            Status: "ACTIVE",
            FormaPagamento: "PIX",
            Ciclo: "MENSAL",
            CriadoEm: nowIso(),
          },
          {
            AssinaturaID: "sub_demo_02",
            AsaasSubscriptionID: "sub_demo_02",
            ClienteNome: "Hamburgueria & Restaurante House",
            Plano: "Pro",
            Valor: 127.0,
            Status: "ACTIVE",
            FormaPagamento: "PIX",
            Ciclo: "MENSAL",
            CriadoEm: nowIso(),
          },
        ];
        for (const s of demoSubs) {
          await runtime.upsert("AsaasAssinaturas", s);
        }
      }

      await audit("Configuração Rápida Asaas Concluída", {
        ambiente: cleanAmbiente,
        configurado: true,
      });

      return success({
        mensagem: "Integração Asaas configurada com sucesso em modo Sandbox com dados demonstrativos.",
        ambiente: cleanAmbiente,
      });
    },

    /**
     * Cria ou localiza um cliente no Asaas
     */
    async asaasCustomerCreateOrGet(args) {
      const [payload = {}] = args;
      const { nome, cpfCnpj, email, telefone } = payload;

      assert(nome && String(nome).trim().length >= 3, "Nome completo ou Razão Social é obrigatório.");
      assert(email && String(email).includes("@"), "E-mail de cobrança válido é obrigatório.");

      const cleanCpfCnpj = normalizeCpfCnpj(cpfCnpj);
      const cleanPhone = String(telefone || "").replace(/\D/g, "");

      // Verifica se já temos este cliente salvo localmente
      const clientesLocais = (await runtime.list("AsaasClientes").catch(() => [])) || [];
      const clienteExistente = clientesLocais.find(
        (c) =>
          (cleanCpfCnpj && c.CpfCnpj === cleanCpfCnpj) ||
          c.Email?.toLowerCase() === email.toLowerCase(),
      );

      if (clienteExistente && clienteExistente.AsaasID) {
        return success(clienteExistente);
      }

      // Cria cliente no Asaas
      const asaasRes = await fetchAsaasApi("/customers", {
        method: "POST",
        body: {
          name: String(nome).trim(),
          cpfCnpj: cleanCpfCnpj || undefined,
          email: String(email).trim().toLowerCase(),
          mobilePhone: cleanPhone || undefined,
          notificationDisabled: false,
        },
      });

      const localRecord = {
        ClienteID: asaasRes.id || `cli_${Date.now()}`,
        AsaasID: asaasRes.id,
        Nome: String(nome).trim(),
        CpfCnpj: cleanCpfCnpj,
        Email: String(email).trim().toLowerCase(),
        Telefone: cleanPhone,
        DataCriacao: nowIso(),
      };

      await runtime.upsert("AsaasClientes", localRecord);

      return success(localRecord);
    },

    /**
     * Cria uma cobrança avulsa ou mensalidade com suporte a PIX, Boleto e Cartão
     */
    async asaasPaymentCreate(args) {
      const [payload = {}] = args;
      const {
        cliente,
        valor,
        formaPagamento = "PIX",
        descricao = "Assinatura PontoFlow Pro",
        plano = "Pro",
        diasVencimento = 3,
        identificadorExterno = "",
      } = payload;

      const numValor = Number(valor);
      assert(!isNaN(numValor) && numValor > 0, "Valor da cobrança deve ser maior que zero.");

      // Garante cliente criado/obtido
      let clienteAsaas = cliente;
      if (!clienteAsaas || !clienteAsaas.AsaasID) {
        assert(cliente && typeof cliente === "object", "Dados do cliente pagador são obrigatórios.");
        const cliRes = await createAsaasHandlers().asaasCustomerCreateOrGet([cliente]);
        clienteAsaas = cliRes.data;
      }

      const forma = String(formaPagamento).toUpperCase();
      const billingType = ["PIX", "BOLETO", "CREDIT_CARD"].includes(forma) ? forma : "PIX";

      const dueDateObj = new Date();
      dueDateObj.setDate(dueDateObj.getDate() + Math.max(1, Number(diasVencimento) || 3));
      const dueDate = dueDateObj.toISOString().slice(0, 10);

      // Dispara criação no Asaas
      const asaasPayment = await fetchAsaasApi("/payments", {
        method: "POST",
        body: {
          customer: clienteAsaas.AsaasID,
          billingType,
          value: numValor,
          dueDate,
          description: `${descricao} - Plano ${plano}`,
          externalReference: identificadorExterno || `pf_${Date.now()}`,
          postalService: false,
        },
      });

      // Se for PIX, já busca o QR Code e código Copia e Cola imediatamente
      let pixData = null;
      if (billingType === "PIX" && asaasPayment.id) {
        try {
          pixData = await fetchAsaasApi(`/payments/${asaasPayment.id}/pixQrCode`);
        } catch (err) {
          console.warn("[asaas] Falha ao gerar QR Code PIX imediato:", err);
        }
      }

      const cobrancaRecord = {
        CobrancaID: asaasPayment.id || `cob_${Date.now()}`,
        AsaasID: asaasPayment.id,
        ClienteID: clienteAsaas.ClienteID || clienteAsaas.AsaasID,
        ClienteNome: clienteAsaas.Nome,
        ClienteEmail: clienteAsaas.Email,
        Valor: numValor,
        Plano: plano,
        FormaPagamento: billingType,
        Status: asaasPayment.status || "PENDING",
        DataVencimento: dueDate,
        LinkFatura: asaasPayment.invoiceUrl || "",
        LinkBoleto: asaasPayment.bankSlipUrl || "",
        PixCopiaCola: pixData?.payload || "",
        PixQrCodeBase64: pixData?.encodedImage || "",
        PixExpiraEm: pixData?.expirationDate || "",
        CriadoEm: nowIso(),
        PagoEm: null,
      };

      await runtime.upsert("AsaasCobrancas", cobrancaRecord);

      return success(cobrancaRecord);
    },

    /**
     * Cria uma assinatura recorrente mensal automática no Asaas
     */
    async asaasSubscriptionCreate(args) {
      const [payload = {}] = args;
      const {
        cliente,
        valor,
        formaPagamento = "PIX",
        descricao = "Assinatura Mensal PontoFlow Pro",
        plano = "Pro",
      } = payload;

      const numValor = Number(valor);
      assert(!isNaN(numValor) && numValor > 0, "Valor da assinatura deve ser válido.");

      let clienteAsaas = cliente;
      if (!clienteAsaas || !clienteAsaas.AsaasID) {
        const cliRes = await createAsaasHandlers().asaasCustomerCreateOrGet([cliente]);
        clienteAsaas = cliRes.data;
      }

      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + 3);

      const asaasSub = await fetchAsaasApi("/subscriptions", {
        method: "POST",
        body: {
          customer: clienteAsaas.AsaasID,
          billingType: formaPagamento.toUpperCase() === "BOLETO" ? "BOLETO" : "PIX",
          value: numValor,
          nextDueDate: nextDueDate.toISOString().slice(0, 10),
          cycle: "MONTHLY",
          description: `${descricao} - Plano ${plano}`,
        },
      });

      const subRecord = {
        AssinaturaID: asaasSub.id || `sub_${Date.now()}`,
        AsaasID: asaasSub.id,
        ClienteID: clienteAsaas.ClienteID || clienteAsaas.AsaasID,
        ClienteNome: clienteAsaas.Nome,
        Valor: numValor,
        Plano: plano,
        Ciclo: "MENSAL",
        Status: asaasSub.status || "ACTIVE",
        ProximoVencimento: asaasSub.nextDueDate || nextDueDate.toISOString().slice(0, 10),
        CriadoEm: nowIso(),
      };

      await runtime.upsert("AsaasAssinaturas", subRecord);

      return success(subRecord);
    },

    /**
     * Consulta o status em tempo real de uma cobrança no Asaas
     */
    async asaasPaymentCheckStatus(args) {
      const [cobrancaId] = args || [];
      assert(cobrancaId, "Identificador da cobrança não informado.");

      const localCob = await runtime.getById("AsaasCobrancas", cobrancaId).catch(() => null);
      const asaasId = localCob?.AsaasID || cobrancaId;

      const remoteStatus = await fetchAsaasApi(`/payments/${asaasId}`);

      if (localCob && remoteStatus.status) {
        const isPaid =
          remoteStatus.status === "RECEIVED" ||
          remoteStatus.status === "CONFIRMED" ||
          remoteStatus.status === "RECEIVED_IN_CASH";

        const updated = {
          ...localCob,
          Status: remoteStatus.status,
          PagoEm: isPaid ? remoteStatus.confirmedDate || nowIso() : localCob.PagoEm,
          UltimaVerificacao: nowIso(),
        };
        await runtime.upsert("AsaasCobrancas", updated);
        return success(updated);
      }

      return success(remoteStatus);
    },

    /**
     * Lista cobranças locais geradas pelo Asaas
     */
    async asaasPaymentList(args) {
      const profile = await runtime.requireProfile();
      requireAdmin(profile);
      const [filtros = {}] = args;
      const list = (await runtime.list("AsaasCobrancas").catch(() => [])) || [];

      let filtered = [...list];
      if (filtros.status) {
        filtered = filtered.filter((c) => c.Status === filtros.status);
      }
      if (filtros.plano) {
        filtered = filtered.filter((c) => c.Plano === filtros.plano);
      }

      filtered.sort((a, b) => new Date(b.CriadoEm || 0) - new Date(a.CriadoEm || 0));

      const assinaturas = (await runtime.list("AsaasAssinaturas").catch(() => [])) || [];
      const totalRecebido = list
        .filter((c) => c.Status === "RECEIVED" || c.Status === "CONFIRMED")
        .reduce((sum, c) => sum + (Number(c.Valor) || 0), 0);
      const pendentes = list.filter((c) => c.Status === "PENDING").length;
      const totalAssinaturas = assinaturas.filter((s) => s.Status === "ACTIVE").length;

      filtered.cobrancas = filtered;
      filtered.estatisticas = {
        totalRecebido,
        pendentes,
        totalAssinaturas,
      };

      return success(filtered);
    },

    /**
     * Processa notificações de webhook recebidas do Asaas
     */
    async asaasWebhookProcess(args) {
      const [payload = {}] = args;
      const { event, payment = {} } = payload;
      assert(event, "Evento de webhook do Asaas não especificado.");

      const eventId = `ev_${Date.now()}_${uuid().slice(0, 6)}`;
      const logRecord = {
        EventoID: eventId,
        Evento: event,
        PaymentID: payment.id || "",
        Valor: payment.value || 0,
        Status: payment.status || "",
        DataRecebimento: nowIso(),
        Payload: payload,
      };

      await runtime.upsert("AsaasWebhooks", logRecord);

      // Se for pagamento confirmado/recebido, atualiza a cobrança correspondente
      if (
        event === "PAYMENT_CONFIRMED" ||
        event === "PAYMENT_RECEIVED" ||
        event === "PAYMENT_RECEIVED_IN_CASH"
      ) {
        const cobrancas = (await runtime.list("AsaasCobrancas").catch(() => [])) || [];
        const cob = cobrancas.find((c) => c.AsaasID === payment.id || c.CobrancaID === payment.id);

        if (cob) {
          const updated = {
            ...cob,
            Status: "CONFIRMED",
            PagoEm: payment.confirmedDate || nowIso(),
          };
          await runtime.upsert("AsaasCobrancas", updated);
        }
      }

      return success({ processado: true, eventoId: eventId });
    },
  };
}
