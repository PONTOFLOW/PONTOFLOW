import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(__dirname, "../public/demo-screens");
mkdirSync(outputDir, { recursive: true });

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log("Iniciando Chrome Headless para capturar telas reais do PontoFlow Pro...");
  const chromeProc = spawn(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    [
      "--headless=new",
      "--disable-gpu",
      "--remote-debugging-port=9222",
      "--window-size=1280,840",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  let connected = false;
  let wsUrl = null;

  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch("http://localhost:9222/json/version");
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        connected = true;
        break;
      }
    } catch (_) {}
  }

  if (!connected || !wsUrl) {
    chromeProc.kill();
    throw new Error("Não foi possível conectar ao Chrome CDP na porta 9222");
  }

  console.log("Conectado ao Chrome CDP via WebSocket:", wsUrl);
  const ws = new WebSocket(wsUrl);

  let msgId = 1;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
  };

  await new Promise((r) => (ws.onopen = r));

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const targetRes = await send("Target.createTarget", { url: "http://localhost:5173/" });
  const targetId = targetRes.result.targetId;
  const pageRes = await fetch("http://localhost:9222/json");
  const pages = await pageRes.json();
  const targetPage = pages.find((p) => p.id === targetId);

  const pageWs = new WebSocket(targetPage.webSocketDebuggerUrl);
  await new Promise((r) => (pageWs.onopen = r));

  let pageMsgId = 1;
  const pageCallbacks = new Map();
  pageWs.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pageCallbacks.has(msg.id)) {
      pageCallbacks.get(msg.id)(msg);
      pageCallbacks.delete(msg.id);
    }
  };

  function sendPage(method, params = {}) {
    return new Promise((resolve) => {
      const id = pageMsgId++;
      pageCallbacks.set(id, resolve);
      pageWs.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendPage("Page.enable");
  await sendPage("Runtime.enable");
  await sendPage("DOM.enable");
  await sendPage("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 840,
    deviceScaleFactor: 1.5,
    mobile: false,
  });

  await sleep(3500);

  // 1. Tela de Login Real
  console.log("Capturando: 1. Tela de Login Real...");
  const snap1 = await sendPage("Page.captureScreenshot", { format: "png" });
  writeFileSync(resolve(outputDir, "01-login-real.png"), Buffer.from(snap1.result.data, "base64"));

  // 2. Inicializar Estado Real e ir para o Dashboard
  console.log("Configurando dados reais de demonstração...");
  await sendPage("Runtime.evaluate", {
    expression: `
      (() => {
        window.state = window.state || {};
        window.state.user = {
          ID: "USR-001",
          Nome: "Diretoria & RH",
          Perfil: "Administrador",
          Email: "rh@empresa.com",
          Loja: "Loja 01 - Matriz Centro",
          Cargo: "Diretor Geral"
        };
        window.state.stores = [
          { ID: "LJ-1", Nome: "Loja 01 - Matriz Centro", RaioGPS: 50, Lat: -12.9777, Lng: -38.5016, Endereco: "Av. Principal, 100 - Centro", TotalFuncionarios: 18, Ativa: true },
          { ID: "LJ-2", Nome: "Loja 02 - Shopping", RaioGPS: 60, Lat: -12.9820, Lng: -38.4900, Endereco: "Shopping Center, Piso L2", TotalFuncionarios: 12, Ativa: true }
        ];
        window.state.employees = [
          { ID: "EMP-1", Nome: "Carlos Silva", Cargo: "Líder de Cozinha", Loja: "Loja 01 - Matriz Centro", Status: "Ativo", Telefone: "71997069291" },
          { ID: "EMP-2", Nome: "Mariana Souza", Cargo: "Atendimento & Salão", Loja: "Loja 01 - Matriz Centro", Status: "Ativo", Telefone: "71997069291" },
          { ID: "EMP-3", Nome: "Lucas Ferreira", Cargo: "Auxiliar de Cozinha", Loja: "Loja 01 - Matriz Centro", Status: "Ativo", Telefone: "71997069291" },
          { ID: "EMP-4", Nome: "Fernanda Lima", Cargo: "Operadora de Caixa", Loja: "Loja 02 - Shopping", Status: "Ativo", Telefone: "71997069291" }
        ];

        window.state.dashboard = {
          totalFuncionarios: 30,
          trabalhandoHoje: 14,
          emFolga: 5,
          pendenciasAprovacao: 2,
          bancoHorasPositivo: "128h 30m"
        };

        if (typeof hideLogin === "function") hideLogin();
        const appEl = document.getElementById("app");
        if (appEl) appEl.classList.remove("hidden");
        const loginEl = document.getElementById("loginScreen");
        if (loginEl) loginEl.classList.add("hidden");

        if (typeof switchView === "function") switchView("dashboard");
        if (typeof renderDashboard === "function") renderDashboard();
      })()
    `,
  });

  await sleep(1500);
  console.log("Capturando: 2. Painel Dashboard Real...");
  const snap2 = await sendPage("Page.captureScreenshot", { format: "png" });
  writeFileSync(resolve(outputDir, "02-dashboard-real.png"), Buffer.from(snap2.result.data, "base64"));

  // 3. Ponto Eletrônico Inteligente com selfie & cerca GPS
  console.log("Navegando para: 3. Ponto Eletrônico...");
  await sendPage("Runtime.evaluate", {
    expression: `
      (() => {
        if (typeof switchView === "function") switchView("timeclock");
        const clockEl = document.getElementById("view-timeclock");
        if (clockEl) {
          clockEl.classList.add("active");
          const punchBox = clockEl.querySelector(".clock-action-panel") || clockEl.querySelector(".panel");
          if (punchBox) {
            const statusBadge = punchBox.querySelector(".badge");
            if (statusBadge) statusBadge.textContent = "Dentro do Raio (42m) • GPS Válido";
          }
        }
      })()
    `,
  });
  await sleep(1500);
  console.log("Capturando: 3. Ponto Eletrônico Real...");
  const snap3 = await sendPage("Page.captureScreenshot", { format: "png" });
  writeFileSync(resolve(outputDir, "03-ponto-eletronico-real.png"), Buffer.from(snap3.result.data, "base64"));

  // 4. Espelho de Ponto & Documentos com Assinatura Digital Touch Paisagem
  console.log("Navegando para: 4. Documentos & Espelho de Ponto...");
  await sendPage("Runtime.evaluate", {
    expression: `
      (() => {
        if (typeof switchView === "function") switchView("documents");
        if (typeof window.initDocumentsModule === "function") {
          window.initDocumentsModule({
            user: window.state.user,
            stores: window.state.stores,
            employees: window.state.employees,
            isManager: true,
            isAdmin: true
          });
        }
      })()
    `,
  });
  await sleep(2000);
  console.log("Capturando: 4. Documentos & Espelho de Ponto Real...");
  const snap4 = await sendPage("Page.captureScreenshot", { format: "png" });
  writeFileSync(resolve(outputDir, "04-documentos-espelho-real.png"), Buffer.from(snap4.result.data, "base64"));

  // 5. Escala de Folgas & Turnos
  console.log("Navegando para: 5. Escala de Folgas...");
  await sendPage("Runtime.evaluate", {
    expression: `
      (() => {
        if (typeof switchView === "function") switchView("shift-plan");
        if (typeof publishJourney_ === "function") publishJourney_();
      })()
    `,
  });
  await sleep(1500);
  console.log("Capturando: 5. Escala de Folgas Real...");
  const snap5 = await sendPage("Page.captureScreenshot", { format: "png" });
  writeFileSync(resolve(outputDir, "05-escala-folgas-real.png"), Buffer.from(snap5.result.data, "base64"));

  // 6. Canal de Denúncias & Ouvidoria
  console.log("Navegando para: 6. Canal de Denúncias...");
  await sendPage("Runtime.evaluate", {
    expression: `
      (() => {
        if (typeof switchView === "function") switchView("whistleblower");
        if (typeof window.initWhistleblowerModule === "function") {
          window.initWhistleblowerModule({
            user: window.state.user,
            lojas: window.state.stores
          });
        }
      })()
    `,
  });
  await sleep(1800);
  console.log("Capturando: 6. Canal de Denúncias Real...");
  const snap6 = await sendPage("Page.captureScreenshot", { format: "png" });
  writeFileSync(resolve(outputDir, "06-canal-denuncias-real.png"), Buffer.from(snap6.result.data, "base64"));

  // 7. Lojas & Unidades com GPS
  console.log("Navegando para: 7. Lojas e Perímetros GPS...");
  await sendPage("Runtime.evaluate", {
    expression: `
      (() => {
        if (typeof switchView === "function") switchView("stores");
        if (typeof renderStores === "function") renderStores();
      })()
    `,
  });
  await sleep(1500);
  console.log("Capturando: 7. Lojas & GPS Real...");
  const snap7 = await sendPage("Page.captureScreenshot", { format: "png" });
  writeFileSync(resolve(outputDir, "07-lojas-gps-real.png"), Buffer.from(snap7.result.data, "base64"));

  // 8. Conexão WhatsApp & Comunicação
  console.log("Navegando para: 8. Conexão WhatsApp...");
  await sendPage("Runtime.evaluate", {
    expression: `
      (() => {
        if (typeof switchView === "function") switchView("whatsapp");
        const statusEl = document.getElementById("waStatusBadge");
        if (statusEl) {
          statusEl.textContent = "Conectado • Instância Ativa";
          statusEl.className = "badge badge-success";
        }
      })()
    `,
  });
  await sleep(1500);
  console.log("Capturando: 8. Conexão WhatsApp Real...");
  const snap8 = await sendPage("Page.captureScreenshot", { format: "png" });
  writeFileSync(resolve(outputDir, "08-conexao-whatsapp-real.png"), Buffer.from(snap8.result.data, "base64"));

  // 9. Smartphone Mobile Real (iPhone 14 Pro Max)
  console.log("Capturando: 9. Ponto em Viewport Smartphone Mobile...");
  await sendPage("Emulation.setDeviceMetricsOverride", {
    width: 414,
    height: 896,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sendPage("Runtime.evaluate", {
    expression: `
      (() => {
        if (typeof switchView === "function") switchView("timeclock");
      })()
    `,
  });
  await sleep(1500);
  const snap9 = await sendPage("Page.captureScreenshot", { format: "png" });
  writeFileSync(resolve(outputDir, "09-smartphone-ponto-real.png"), Buffer.from(snap9.result.data, "base64"));

  // 10. Smartphone Mobile Documentos & Espelho
  console.log("Capturando: 10. Documentos em Viewport Smartphone Mobile...");
  await sendPage("Runtime.evaluate", {
    expression: `
      (() => {
        if (typeof switchView === "function") switchView("documents");
        if (typeof window.initDocumentsModule === "function") {
          window.initDocumentsModule({
            user: window.state.user,
            stores: window.state.stores,
            employees: window.state.employees,
            isManager: true,
            isAdmin: true
          });
        }
      })()
    `,
  });
  await sleep(1500);
  const snap10 = await sendPage("Page.captureScreenshot", { format: "png" });
  writeFileSync(resolve(outputDir, "10-smartphone-documentos-real.png"), Buffer.from(snap10.result.data, "base64"));

  // Finalizar
  pageWs.close();
  ws.close();
  chromeProc.kill();
  console.log("Todas as 10 telas reais foram capturadas com sucesso em public/demo-screens/!");
}

run().catch((err) => {
  console.error("Erro na captura de telas:", err);
  process.exit(1);
});
