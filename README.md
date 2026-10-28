# PontoFlow Pro — Sistema Inteligente de Ponto Eletrônico & Gestão de RH

Aplicação PWA completa para **Ponto Eletrônico (Portaria 671 MTE)**, **Escalas de Folgas Inteligentes**, **Banco de Horas**, **Documentos de RH** e **Canal de Denúncias**.

Arquitetura moderna, modular, sem dependência de servidores caros, operando sobre o **Firebase Realtime Database & Authentication** e executável em qualquer navegador moderno ou smartphone via PWA.

---

## 🚀 Central de Documentação & Kit de Vendas

O projeto já vem acompanhado do ecossistema completo para você começar a comercializar e implantar imediatamente:

- 💼 **[KIT_DE_VENDAS_PONTOFLOW.md](KIT_DE_VENDAS_PONTOFLOW.md)**: Planos de preços, modelos de monetização (SaaS Recorrente e Licença), público-alvo (ICP) e comparativo de mercado.
- 💳 **[ASAAS_GUIA_E_INTEGRACAO.md](ASAAS_GUIA_E_INTEGRACAO.md)**: Guia completo de integração do gateway financeiro Asaas (API v3), emissão de PIX dinâmico com QR Code, boletos, assinaturas recorrentes e webhooks automáticos.
- 🎯 **[PITCH_E_SCRIPTS_DE_VENDAS.md](PITCH_E_SCRIPTS_DE_VENDAS.md)**: Scripts para WhatsApp, Cold Call de 90s, Roteiro de Demonstração ao vivo de 15 minutos e Quebra de Objeções.
- 📄 **[PROPOSTA_COMERCIAL_MODELO.md](PROPOSTA_COMERCIAL_MODELO.md)**: Modelo pronto de proposta comercial e contrato de prestação de serviços com escopo, prazos e garantia.
- ⚡ **[CHECKLIST_IMPLANTACAO_CLIENTE.md](CHECKLIST_IMPLANTACAO_CLIENTE.md)**: Passo a passo para configurar e entregar o sistema rodando para um novo cliente em apenas 15 minutos.
- 🌐 **[public/vendas.html](public/vendas.html)**: Landing page comercial moderna (Apple iOS Design System) com calculadora interativa de ROI pronta para apresentação ou captação de clientes.
- 🛠️ **[GUIA_COMERCIAL_E_CONFIGURACAO.md](GUIA_COMERCIAL_E_CONFIGURACAO.md)**: Guia técnico de configuração do Firebase, regras de segurança e white-label.

---

## ⚡ Começo Rápido

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Insira as credenciais do seu projeto Firebase em `src/firebase-config.js`.
3. Configure a marca e cores da empresa em `src/brand-config.js`.
4. Publique as regras de segurança `database.rules.json` no console do Firebase.
5. Inicie o ambiente de desenvolvimento:
   ```bash
   npm run dev
   ```

6. Para validar o código e gerar a versão final para produção:
   ```bash
   npm run check
   ```

---

## 🛡️ Destaques Operacionais & Jurídicos

- **Conformidade Portaria 671 MTE:** Relatório espelho mensal com assinatura touch digital em tela cheia paisagem.
- **Biometria & Anti-Fraude:** Validação de raio de geolocalização e selfie obrigatória.
- **Multi-Lojas e Filiais:** Gestão unificada com controle de acesso por perfil (Administrador, Gerente, Funcionário).
- **Offline First:** Funcionamento contínuo em quedas de sinal com sincronização automática via Service Worker.
