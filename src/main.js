import "./brand.js";
import "./journey.js";
import "./tasks.js";
import "./documents.js";
import "./whistleblower.js";
import "./copilot.js";
import { createApi } from "./core/api.js";
import { installGoogleAppsScriptBridge } from "./core/bridge.js";
import "./pwa.js";
import "./push.js";
import {
  firebaseConfigurationProblems,
  runtime,
} from "./core/runtime.js";
import * as takeatCredit from "./core/takeat-credit.js";

const api = createApi();
window.__GESTAO_FIREBASE__ = { runtime, api };
window.__GESTAO_TAKEAT_CREDIT__ = takeatCredit;

const signalApiReady = () => {
  window.__GESTAO_API_STATUS__ = "ready";
  window.__GESTAO_API_READY__ = Promise.resolve();
  window.__resolveGestaoApiReady__?.();
  window.dispatchEvent(new CustomEvent("gestao-api-ready"));
};

const signalApiFailure = (error) => {
  window.__GESTAO_API_STATUS__ = "failed";
  window.__rejectGestaoApiReady__?.(error);
};

const waitForDom = () =>
  document.readyState === "loading"
    ? new Promise((resolve) =>
        document.addEventListener("DOMContentLoaded", resolve, { once: true }),
      )
    : Promise.resolve();

const hideApplicationSurfaces = () => {
  document.querySelector("#loadingOverlay")?.classList.add("hidden");
  document.querySelector("#loginScreen")?.classList.add("hidden");
  document.querySelector("#app")?.classList.add("hidden");
  document.querySelector("#unauthorized")?.classList.add("hidden");
};

const setupShell = (content) => {
  document.querySelector("#firebaseSetupScreen")?.remove();
  const section = document.createElement("section");
  section.id = "firebaseSetupScreen";
  section.className = "login-screen";
  section.innerHTML = `
    <div class="login-shell">
      <div class="login-brand-panel">
        <div class="login-brand-content">
          <div class="brand-logo login-logo" aria-label="PontoFlow Pro">P</div>
          <strong class="login-group-name">PontoFlow Pro</strong>
          <span class="eyebrow">INSTALAÇÃO FIREBASE</span>
          <h1>Seu sistema.<br>Agora independente.</h1>
          <p>Instância independente com Ponto Eletrônico (Portaria 671 MTE), Escala de Folgas e Gestão de RH.</p>
          <div class="login-feature"><i>✓</i><span>Sem dependência de servidores caros</span></div>
          <div class="login-feature"><i>✓</i><span>Publicação automática pelo GitHub</span></div>
          <div class="login-feature"><i>✓</i><span>Isolamento total e autônomo</span></div>
        </div>
      </div>
      <div class="login-form-panel">${content}</div>
    </div>`;
  document.body.appendChild(section);
  return section;
};

const showConfigurationRequired = (problems) => {
  hideApplicationSurfaces();
  setupShell(`
    <div class="login-card">
      <span class="eyebrow">FALTA CONECTAR O FIREBASE</span>
      <h2>Complete a configuração</h2>
      <p>Abra <code>src/firebase-config.js</code> e substitua os campos de exemplo pelos dados do seu aplicativo Web.</p>
      <div class="setup-notice">
        <strong>Campos pendentes</strong>
        <p>${problems.join(", ")}</p>
      </div>
      <p class="reset-password-hint">Depois salve o arquivo e execute novamente <code>npm run dev</code>.</p>
    </div>`);
};

const bindSetupForm = (form) => {
  if (!form || form.__bound) return;
  form.__bound = true;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const error = form.querySelector("#setupInitialError");
    error?.classList.add("hidden");
    if (button) {
      button.disabled = true;
      button.textContent = "Criando estrutura…";
    }
    try {
      await runtime.setupInitialAdmin({
        name: form.querySelector("#setupAdminName")?.value,
        email: form.querySelector("#setupAdminEmail")?.value,
        password: form.querySelector("#setupAdminPassword")?.value,
        company: form.querySelector("#setupCompanyName")?.value,
      });
      const token = await runtime.auth.currentUser.getIdToken();
      if (typeof window.storeSessionToken_ === "function") {
        window.storeSessionToken_(
          token,
          true,
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        );
      } else {
        localStorage.setItem("gf-session-token", token);
        sessionStorage.setItem("gf-session-token", token);
      }
      location.reload();
    } catch (failure) {
      const message =
        failure?.message || "Não foi possível concluir a configuração.";
      if (/configuration-not-found/i.test(message)) {
        if (error) error.textContent = "O Firebase Authentication precisa ser ativado no console: acesse Authentication > Primeiros passos e ative E-mail/senha.";
      } else if (/PERMISSION_DENIED|permission[- ]denied/i.test(message)) {
        if (error) error.textContent = "O Firebase bloqueou o banco. Publique database.rules.json no Realtime Database e clique novamente em Criar sistema.";
      } else {
        if (error) error.textContent = message;
      }
      error?.classList.remove("hidden");
      if (button) {
        button.disabled = false;
        button.textContent = "Criar sistema";
      }
    }
  });
};

const showInitialSetup = () => {
  const loginScreen = document.querySelector("#loginScreen");
  const loginForm = document.querySelector("#loginForm");
  const setupForm = document.querySelector("#firebaseInitialSetupForm");
  const loadingOverlay = document.querySelector("#loadingOverlay");

  loadingOverlay?.classList.add("hidden");
  if (loginScreen && setupForm && loginForm) {
    loginScreen.classList.remove("hidden");
    loginForm.classList.add("hidden");
    setupForm.classList.remove("hidden");
    bindSetupForm(setupForm);
  } else {
    hideApplicationSurfaces();
    const section = setupShell(`
      <form id="firebaseInitialSetupForm" class="login-card">
        <span class="eyebrow">PRIMEIRO ACESSO</span>
        <h2>Crie o administrador</h2>
        <p>Esta etapa aparece uma única vez. O primeiro acesso será o administrador do sistema.</p>
        <label>Nome completo
          <input id="setupAdminName" autocomplete="name" required placeholder="Nome do administrador">
        </label>
        <label>E-mail
          <input id="setupAdminEmail" type="email" autocomplete="username" required value="glleucekk77@gmail.com" placeholder="admin@suaempresa.com">
        </label>
        <label>Senha
          <input id="setupAdminPassword" type="password" autocomplete="new-password" minlength="10" required placeholder="Mínimo 10 caracteres">
        </label>
        <label>Nome da empresa
          <input id="setupCompanyName" required value="PontoFlow">
        </label>
        <button class="btn btn-primary login-submit" type="submit">Criar sistema</button>
        <p id="setupInitialError" class="login-error hidden"></p>
      </form>`);
    bindSetupForm(section.querySelector("#firebaseInitialSetupForm"));
  }
};

waitForDom().then(() => {
  const setupForm = document.querySelector("#firebaseInitialSetupForm");
  if (setupForm) bindSetupForm(setupForm);

  const btnGoToSetup = document.querySelector("#btnGoToSetup");
  const btnBack = document.querySelector("#btnBackToLoginCard");
  const loginForm = document.querySelector("#loginForm");

  btnGoToSetup?.addEventListener("click", () => {
    loginForm?.classList.add("hidden");
    setupForm?.classList.remove("hidden");
    document.querySelector("#setupAdminName")?.focus();
  });

  btnBack?.addEventListener("click", () => {
    setupForm?.classList.add("hidden");
    loginForm?.classList.remove("hidden");
  });
});

const problems = firebaseConfigurationProblems();
if (problems.length) {
  signalApiFailure(new Error("A configuração do Firebase está incompleta."));
  waitForDom().then(() => showConfigurationRequired(problems));
} else {
  try {
    runtime.initialize();
    installGoogleAppsScriptBridge(api);
    signalApiReady();
    runtime
      .ready()
      .then(async () => {
        await waitForDom();
        if (!(await runtime.isInitialized())) showInitialSetup();
      })
      .catch(async (error) => {
        signalApiFailure(error);
        await waitForDom();
        hideApplicationSurfaces();
        setupShell(`
          <div class="login-card">
            <span class="eyebrow">CONEXÃO NÃO CONCLUÍDA</span>
            <h2>Verifique o Firebase</h2>
            <p class="login-error">${String(
              error?.message || "Não foi possível conectar.",
            )}</p>
            <button class="btn btn-primary login-submit" onclick="location.reload()">Tentar novamente</button>
          </div>`);
      });
  } catch (error) {
    signalApiFailure(error);
    waitForDom().then(() => {
      hideApplicationSurfaces();
      setupShell(`
        <div class="login-card">
          <span class="eyebrow">CONEXÃO NÃO CONCLUÍDA</span>
          <h2>Verifique o Firebase</h2>
          <p class="login-error">${String(
            error?.message || "Não foi possível conectar.",
          )}</p>
          <button class="btn btn-primary login-submit" onclick="location.reload()">Tentar novamente</button>
        </div>`);
    });
  }
}
