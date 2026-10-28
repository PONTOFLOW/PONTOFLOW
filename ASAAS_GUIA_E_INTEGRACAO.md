# Guia de Integracao e Operacao do Asaas (API v3) — PontoFlow Pro

Este documento estabelece o guia oficial de configuracao, homologacao e operacao do gateway de pagamentos **Asaas** no ecossistema do **PontoFlow Pro (Grupo House 190)**.

---

## 1. Visao Geral da Arquitetura

O modulo financeiro do Asaas foi desenvolvido com arquitetura defensiva, suporte nativo a offline/mock para desenvolvimento continuo e integracao transparente com o painel administrativo e a landing page de conversao:

```
[Cliente / Lead]
       |
       v (public/vendas.html)
[Modal Checkout Seguro Asaas]
       |
       +---> [PIX Instantaneo (QR Code + Copia e Cola)]
       +---> [Boleto Bancario Registrado]
       +---> [Cartao de Credito com Recorrencia]
       |
       v
[Backend API PontoFlow (src/core/api-asaas.js)]
       |
       +---> [Asaas API v3 (https://api.asaas.com/v3)]
       |           |
       |           v
       |    [Webhook de Notificacao (/api?action=asaasWebhookProcess)]
       |           |
       v           v
[Tabelas Firebase / Memoria (AsaasClientes, AsaasCobrancas, AsaasAssinaturas)]
       |
       v
[Painel Admin House 190 (Financeiro & Asaas)]
```

---

## 2. Planos Comerciais Homologados

Conforme a diretriz de alta competitividade e precos acessiveis para o setor de alimentacao, varejo e servicos, os planos estao parametrizados com valor fixo por empresa (sem cobranca por funcionario):

| Plano | Mensalidade | Setup / Implantacao | Capacidade | Recursos Chave |
| :--- | :--- | :--- | :--- | :--- |
| **Start** | **R$ 67,00 / mes** | R$ 150,00 (taxa unica) | Ate 15 colaboradores | Ponto mobile com GPS, espelho assinado digitalmente, suporte via WhatsApp. |
| **Pro** | **R$ 127,00 / mes** | R$ 250,00 (taxa unica) | Ate 45 colaboradores | Selfie biometrica anti-fraude, gestao de escalas e folgas, banco de horas, ouvidoria. |
| **Enterprise** | **R$ 197,00 / mes** | R$ 390,00 (taxa unica) | Ilimitado | Multi-lojas/filiais, relatorios para contabilidade, treinamento gerencial, SLA prioritario 2h. |

*Canal Oficial de Atendimento e Vendas:* **(71) 99706-9291** (`5571997069291`).

---

## 3. Como Obter a Chave de API (Access Token)

### A. Ambiente de Testes (Sandbox)
1. Acesse o portal de homologacao: [https://sandbox.asaas.com](https://sandbox.asaas.com) e crie uma conta gratuita.
2. No menu lateral, acesse **Minha Conta** > **Integracoes**.
3. Na aba **Chaves de API**, clique em **Gerar nova chave de API**.
4. Copie o Access Token gerado (comeca com `$aact_...`).

### B. Ambiente de Producao (Pagamentos Reais)
1. Acesse o portal oficial: [https://www.asaas.com](https://www.asaas.com) e realize o login com a conta aprovada.
2. No menu lateral, va em **Minha Conta** > **Integracoes** > **Chaves de API**.
3. Gere a chave de producao e armazene com seguranca.

---

## 4. Como Configurar no PontoFlow Pro

1. Entre no sistema como **Administrador**.
2. No menu lateral de navegacao, clique em **Financeiro & Asaas** (na secao *Administracao*).
3. Selecione a aba **Configuracao da API**.
4. Preencha os campos:
   - **Chave de API (Access Token):** Cole o token obtido no Asaas.
   - **Ambiente de Execucao:** Selecione `Sandbox (Ambiente de Testes)` ou `Producao (Pagamentos Reais)`.
   - **E-mail para Alertas Financeiros:** Informe o e-mail que recebera notificacoes internas.
   - **Token de Validacao do Webhook:** Defina um token secreto para validacao das requisicoes.
5. Clique em **Salvar Configuracoes do Asaas**.

---

## 5. Configuracao do Webhook no Painel do Asaas

Para que o PontoFlow receba a confirmacao de pagamento automaticamente em tempo real:

1. No painel do Asaas, acesse **Minha Conta** > **Integracoes** > **Webhooks**.
2. Clique na secao **Cobancas** > **Adicionar Webhook** (ou editar o webhook principal).
3. No campo **URL da API**, cole a URL informada no painel do PontoFlow:
   `https://[SEU-DOMINIO]/api?action=asaasWebhookProcess`
4. Selecione a versao **v3**.
5. Em **Eventos**, marque as seguintes opcoes:
   - `PAYMENT_RECEIVED` (Pagamento recebido)
   - `PAYMENT_CONFIRMED` (Pagamento confirmado em saldo)
   - `PAYMENT_OVERDUE` (Cobranca vencida)
   - `PAYMENT_REFUNDED` (Pagamento estornado)
   - `PAYMENT_DELETED` (Cobranca removida)
6. Em **Fila de sincronizacao**, selecione **Ativa**.
7. Salve as configuracoes.

---

## 6. Funcionalidades Disponiveis no Painel

- **Dashboard Financeiro (KPIs):**
  - Total faturado no mes via PIX, Boleto e Cartao.
  - Quantidade de cobrancas pendentes e vencidas.
  - Numero de assinaturas ativas com recorrencia automatica.
- **Gerador Manual de Cobrancas & Assinaturas:**
  - Presets instantaneos dos planos (Start R$ 67, Pro R$ 127, Enterprise R$ 197).
  - Emissao de cobranca unica (setup) ou assinatura recorrente mensal.
  - Geracao automatica do QR Code PIX e codigo Copia e Cola na tela.
  - Botao de envio direto dos dados de cobranca para o WhatsApp do cliente.
- **Historico & Verificacao Ativa:**
  - Tabela com filtros de status (`PENDING`, `RECEIVED`, `CONFIRMED`, `OVERDUE`).
  - Botao de consulta em tempo real no Asaas para atualizar status de pagamentos pendentes.
  - Link direto para a fatura oficial no Asaas.

---

## 7. Checkout Publico (Landing Page de Vendas)

A landing page `public/vendas.html` conta com um checkout moderno no padrao Apple iOS:
1. Ao clicar em **Assinar Online (Pix / Cartao)** em qualquer um dos planos, o modal de checkout seguro se abre.
2. O lead insere os dados da empresa (Razao Social, CNPJ/CPF, WhatsApp e E-mail).
3. Ao submeter, o sistema gera o PIX dinamico com QR Code visual e Copia e Cola.
4. O cliente pode pagar imediatamente e clicar em **Confirmar Ativacao no WhatsApp: (71) 99706-9291** para iniciar o onboarding.

---

## 8. Testes e Homologacao Automatizada

A suite de testes automatizados cobre 100% dos fluxos do Asaas atraves do comando:
```bash
npm test
```
Resultados cobertos no arquivo `tests/asaas.test.mjs`:
- Normalizacao de CPF e CNPJ.
- Deteccao automatica de endpoints Sandbox vs Producao.
- Criacao de cliente e cobrancas com mock deterministico offline.
- Criacao de assinaturas mensais recorrentes.
- Recebimento e liquidacao de eventos de Webhook.
- Validacao estrita de componentes de UI em `src/legacy/Index.html`, `src/legacy/Scripts.html` e `public/vendas.html`.
- Auditoria de compliance de **ZERO EMOJIS OPERACIONAIS**.
