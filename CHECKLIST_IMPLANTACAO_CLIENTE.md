# ⚡ Checklist Operacional de Implantação em 15 Minutos

> **Mega Brain Squad (Synkra AIOX)**  
> **Objetivo:** Processo industrial padronizado para entregar o sistema rodando para cada novo cliente em 15 minutos, garantindo isolamento total dos dados (LGPD) e custo zero de infraestrutura.

---

## ⏱️ Linha do Tempo (Total: 15 minutos)

```
[00:00 - 05:00] Criação do Projeto no Firebase (Custo Zero)
[05:00 - 08:00] Configuração de Marca, Logo e Cores
[08:00 - 11:00] Publicação em Produção (Vercel ou Firebase Hosting)
[11:00 - 15:00] Cadastro do 1º Administrador com o Cliente & Go-Live
```

---

## 📋 Passo a Passo Detalhado

### 1. Criar o Projeto no Firebase (5 Minutos)
1. Acesse: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Clique em **"Adicionar projeto"**.
   - Nomeie com o nome do cliente (ex.: `pontoflow-restaurante-aurora`).
   - Desative o Google Analytics (para ser mais rápido e direto).
   - Clique em **"Criar projeto"**.
3. No menu lateral, acesse **Build > Authentication**:
   - Clique em **"Primeiros passos"**.
   - Na lista, clique em **E-mail/senha**, marque a primeira opção como ativada e salve.
4. No menu lateral, acesse **Build > Realtime Database**:
   - Clique em **"Criar banco de dados"**.
   - Selecione a região padrão (`us-central1`).
   - Inicie no modo bloqueado e confirme.
5. No Realtime Database, vá na aba **Regras (Rules)**:
   - Abra o arquivo `database.rules.json` deste projeto.
   - Copie tudo, cole no console do Firebase e clique em **"Publicar"**.
6. Clique na engrenagem ⚙️ (Configurações do Projeto) > **Geral**:
   - Role até o final na seção **"Seus aplicativos"** e clique no ícone web `</>`.
   - Dê um apelido (ex.: `Web App`) e clique em **Registrar app**.
   - Copie o bloco de chaves `firebaseConfig`.

---

### 2. Configurar no Código (3 Minutos)
1. Abra o arquivo `src/firebase-config.js` e cole as chaves copiadas:
   ```javascript
   export const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "pontoflow-restaurante-aurora.firebaseapp.com",
     databaseURL: "https://pontoflow-restaurante-aurora-default-rtdb.firebaseio.com",
     projectId: "pontoflow-restaurante-aurora",
     storageBucket: "pontoflow-restaurante-aurora.firebasestorage.app",
     messagingSenderId: "...",
     appId: "..."
   };
   ```

2. Abra o arquivo `src/brand-config.js` e preencha os dados do cliente:
   ```javascript
   export const BRAND = {
     productName: "PontoFlow Aurora",
     companyName: "Restaurante Aurora Ltda",
     shortName: "Aurora Ponto",
     monogram: "A",
     primary: "#1B365D",          // Cor principal do cliente
     primaryDark: "#10223B",
     primarySoft: "#eff6ff",
     accent: "#2563eb",           // Cor de destaque
     background: "#f8fafc",
     adminEmail: "gerente@restauranteaurora.com.br"
   };
   ```

---

### 3. Gerar Build e Publicar (3 Minutos)

No terminal da pasta do projeto:
```bash
# Valida e compila a versão de produção
npm run check
```

#### Para Hospedar Grátis na Vercel (Recomendado):
1. Suba esta pasta para um repositório Git (privado) com o nome do cliente.
2. Na [Vercel](https://vercel.com), clique em **"Add New Project"** e selecione o repositório.
3. Clique em **"Deploy"**.
4. Em 30 segundos você terá o link pronto (ex.: `https://ponto-aurora.vercel.app` ou domínio próprio `ponto.restauranteaurora.com.br`).

---

### 4. Cadastro do 1º Administrador & Entrega (4 Minutos)
1. Acesse o link publicado no navegador do computador ou celular.
2. O sistema detectará automaticamente que o banco está novo e exibirá a tela de **Cadastro do 1º Administrador**.
3. Preencha com os dados do gestor do cliente:
   - Nome completo
   - E-mail corporativo
   - Senha segura provisória
4. Ao clicar em **Criar Administrador**, o sistema já conecta no painel administrativo completo.
5. Acesse **Unidades / Lojas** e cadastre o endereço da loja com as coordenadas de GPS.
6. Envie o link para o cliente no WhatsApp com o manual de uso rápido.

---

## 🔒 Garantias de Segurança & Isolamento
- **LGPD:** Cada cliente possui um banco de dados Firebase isolado. Não existe cruzamento de dados de colaboradores entre empresas diferentes.
- **Custo Zero de Nuvem:** O plano Spark gratuito do Firebase suporta até 100 conexões simultâneas e 1 GB de armazenamento no Realtime Database, o que atende perfeitamente empresas de até 150 colaboradores sem nenhum custo para você.
- **Margem de Lucro:** Todo o valor cobrado do cliente (setup + mensalidade) é **quase 100% de margem líquida para você**.
