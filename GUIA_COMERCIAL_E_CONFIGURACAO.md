# 🚀 PontoFlow Pro — Guia Comercial, Configuração e Implantação

> **Versão:** 6.16.45 (White-Label Puro / Pronto para Comercialização)  
> **Conformidade Legal:** Portaria 671 MTE (Ponto Eletrônico REP-P)  
> **Stack:** HTML5, CSS3 iOS Design System, JavaScript Modular (ESM), Vite, Firebase Realtime Database & Auth, PWA Service Worker (Offline-ready).

---

## 📌 1. Visão Geral do Produto

O **PontoFlow Pro** é uma solução completa, modular e white-label de **Ponto Eletrônico, Gestão de Escalas, Folgas e RH Digital**, desenvolvida com foco em alta performance móvel (smartphones de funcionários e tablets corporativos) e conformidade jurídica rigorosa.

### 🌟 Principais Módulos Inclusos

1. **Ponto Eletrônico Inteligente (Portaria 671 MTE)**:
   - Registro de entrada, saída e intervalos com validação de geolocalização por raio configurável por loja/unidade.
   - Captura de selfie obrigatória com detecção biométrica facial anti-fraude.
   - Emissão de comprovante assinado digitalmente com hash criptográfico de autenticidade.
   - Modo Offline com sincronização automática via Service Worker quando a conexão for restabelecida.

2. **Espelho de Ponto Mensal & Assinatura Digital Touch**:
   - Assinatura touch em tela cheia com rotação automática / assistida para **modo paisagem**, garantindo área ampla de assinatura e validade jurídica.
   - Relatório de conferência mensal com cálculo automático de horas extras, adicional noturno, tolerâncias legais e saldo de banco de horas.
   - Exportação em PDF e impressão oficial.

3. **Escala de Folgas & Turnos Inteligente**:
   - Matriz mensal de escalas com regras de CLT (descanso semanal remunerado, folga aos domingos para mulheres, intervalos interjornada).
   - Solicitação e troca de folgas ponto-a-ponto (P2P) com aprovação direta pelo gestor.
   - Alertas de choque de escala e limite de folgas por turno/dia.

4. **Canal de Denúncias Corporativo & Ouvidoria**:
   - Formulário anônimo ou identificado com envio criptografado.
   - Painel exclusivo do Administrador para triagem, atualização de status e registro de providências.

5. **RH Digital & Gestão de Documentos**:
   - Upload de atestados médicos, termos de adesão e holerites.
   - Acompanhamento de entregas de atestados com validação de prazos.

6. **Notificações & Integrações**:
   - Alertas sonoros operacionais para cozinha/salão/loja.
   - Suporte a disparos e webhooks para WhatsApp e notificações push PWA.

---

## 🔒 2. Estado do Código: 100% Puro & Desvinculado

Este pacote foi **completamente sanitizado e expurgado** de qualquer dado pessoal, lojas de teste ou senhas da empresa original:
- ❌ Zero registros de funcionários ou senhas hardcoded.
- ❌ Zero e-mails pessoais nas regras do banco (`database.rules.json`) ou no código-fonte.
- ❌ Zero credenciais de APIs externas vinculadas.
- ✅ Regras de banco de dados baseadas estritamente em RBAC (`Perfil === 'Administrador'`).
- ✅ Sistema de Bootstrap Automático: o primeiro usuário cadastrado no Firebase torna-se automaticamente o Administrador Geral da plataforma.

---

## 🛠️ 3. Como Configurar para um Novo Cliente

### Passo 1: Criar o Projeto no Firebase (Custo Zero / Plano Spark)
1. Acesse o [Console do Firebase](https://console.firebase.google.com/) com a conta do seu cliente ou da sua revenda.
2. Clique em **"Adicionar projeto"** e dê um nome (ex.: `pontoflow-cliente-xyz`). Desative o Google Analytics (opcional) e crie o projeto.
3. No menu lateral, acesse **Build > Authentication**:
   - Clique em **"Primeiros passos"** (Get Started).
   - Na aba **Sign-in method**, selecione **E-mail/senha**, ative a primeira opção e salve.
4. No menu lateral, acesse **Build > Realtime Database**:
   - Clique em **"Criar banco de dados"** (Create Database).
   - Escolha a localização (ex.: `us-central1`).
   - Inicie em modo bloqueado.

### Passo 2: Configurar as Credenciais no Sistema
1. No Console do Firebase, clique na engrenagem ⚙️ (Configurações do Projeto) > **Geral**.
2. Na seção **Seus aplicativos**, clique no ícone Web (`</>`), dê um apelido (ex.: `PontoFlow Web`) e registre o app.
3. Copie o objeto `firebaseConfig` exibido e cole no arquivo `src/firebase-config.js`:

```javascript
export const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
```

### Passo 3: Aplicar as Regras de Segurança no Firebase
1. No Firebase Console, vá em **Realtime Database > Regras (Rules)**.
2. Copie todo o conteúdo do arquivo `database.rules.json` deste pacote e cole no editor de regras do Firebase.
3. Clique em **"Publicar"** (Publish).
*(As regras já vêm pré-configuradas para permitir que o 1º usuário registrado se torne Administrador de forma segura).*

### Passo 4: Personalizar Marca & Cores (White-Label)
Edite o arquivo `src/brand-config.js` para aplicar a identidade visual do cliente:

```javascript
export const BRAND_CONFIG = {
  appName: "Nome do Cliente",         // Ex: "Supermercado Silva Ponto"
  appMonogram: "S",                   // Letra do ícone/avatar
  companyName: "Grupo Silva Ltda",    // Razão Social ou Nome Fantasia
  appSubtitle: "Sistema de Ponto e Escalas",
  primaryColor: "#1B365D",            // Cor principal da marca
  accentColor: "#D97706",             // Cor de destaque
  supportEmail: "suporte@silva.com.br",
  adminEmail: "rh@silva.com.br"
};
```

---

## 💻 4. Executando Localmente e Criando o 1º Administrador

1. Abra o terminal na pasta do projeto e instale as dependências:
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse a URL exibida no navegador (ex.: `http://localhost:5173`).
4. Na tela inicial, o sistema detectará que o banco de dados está virgem e exibirá o assistente para **Cadastro do 1º Administrador**.
5. Preencha o nome, e-mail e senha do gestor do cliente.
6. Pronto! O acesso administrativo estará liberado para cadastrar as lojas/filiais, cargos e funcionários.

---

## 🧪 5. Testes Automatizados & Qualidade de Código

O PontoFlow Pro inclui suíte de testes de regressão automatizados para garantir que nenhuma alteração quebre fluxos críticos:

```bash
# Executa os 207 testes unitários e de integração
npm test

# Executa teste, build e injeção do Service Worker PWA
npm run check
```

---

## 🌐 6. Publicação em Produção (Hospedagem)

Por ser uma aplicação SPA/PWA estática que se comunica diretamente com o Firebase via SDK seguro, o PontoFlow Pro pode ser hospedado a custo zero ou ultra-baixo em qualquer provedor:

### Opção A: Vercel / Netlify (Recomendado pela simplicidade)
1. Conecte o repositório Git na [Vercel](https://vercel.com) ou [Netlify](https://netlify.com).
2. Configure o Build Command: `npm run build`
3. Configure o Output Directory: `dist`
4. Clique em Deploy.

### Opção B: Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Escolha a pasta "dist" e configure como SPA (reescrever URLs para /index.html)
npm run build
firebase deploy --only hosting
```

### Opção C: GitHub Pages
O repositório já inclui o fluxo pronto em `.github/workflows/pages.yml`. Basta ativar o GitHub Pages nas configurações do repositório apontando para **GitHub Actions**.

---

## 📋 7. Argumentos Comerciais para Venda do Software

Ao apresentar o PontoFlow Pro para novos clientes, destaque:

1. **Sem Mensalidades por Usuário:** Ao contrário de soluções tradicionais de ponto que cobram R$ 10 a R$ 25 por funcionário/mês, seu cliente pode hospedar a custo irrisório no Firebase Spark.
2. **Conformidade Portaria 671 MTE:** Relatório espelho mensal com assinatura touch na tela do celular do colaborador e comprovante criptografado.
3. **Redução Drástica de Fraudes:** Validação simultânea de geolocalização e selfie do colaborador no momento exato do registro.
4. **PWA Instalável:** Não exige publicação na Apple App Store ou Google Play Store; o funcionário adiciona o app diretamente à tela inicial do celular pelo navegador.
5. **Autonomia Total:** O cliente tem banco de dados próprio e independente, garantindo privacidade e controle total dos dados de RH.
