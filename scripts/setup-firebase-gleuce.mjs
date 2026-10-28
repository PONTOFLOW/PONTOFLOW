import { execSync } from "node:child_process";

const PROJECT_ID = "jornada-conveniencia-5jc-a4829";
const ADMIN_EMAIL = "glleucekk77@gmail.com";
const ADMIN_UID = "q6i4Dcha3uYEgzQWvKxrPAhHfow2";
const ADMIN_NAME = "Gleuce Dias";
const STORE_ID = "4fcb2b6f-d203-46aa-82b6-f53c89def238";
const STORE_NAME = "Conveniência 5Jc";

console.log("==> Iniciando sincronizacao e cadastro automatico no Firebase Realtime Database...");

function dbSet(path, data) {
  const jsonStr = JSON.stringify(data);
  const cmd = `npx firebase-tools database:set ${path} -d '${jsonStr.replace(/'/g, `'\\''`)}' -f --project ${PROJECT_ID}`;
  console.log(`[RTDB SET] ${path}`);
  execSync(cmd, { stdio: "inherit" });
}

// 1. Meta / Inicializacao
dbSet("/gestao-folgas/v2/meta", {
  initialized: true,
  bootstrapOwner: ADMIN_UID,
  createdAt: new Date().toISOString(),
  createdBy: ADMIN_UID,
  ownerEmail: ADMIN_EMAIL,
  version: "6.16.45-production",
});

// 2. Perfil de Acesso Administrador
dbSet(`/gestao-folgas/v2/access/${ADMIN_UID}`, {
  UsuarioID: ADMIN_UID,
  Nome: ADMIN_NAME,
  Email: ADMIN_EMAIL,
  Cargo: "Administrador Geral",
  Perfil: "Administrador",
  LojaID: "",
  NomeLoja: "Todas as Lojas",
  Ativo: true,
  FuncionarioID: "func_gleuce_admin",
  PrimeiroAcesso: false,
  DataCriacao: new Date().toISOString(),
  DataAtualizacao: new Date().toISOString(),
  UltimoAcesso: new Date().toISOString(),
});

// 3. Tabela Funcionarios
dbSet("/gestao-folgas/v2/tables/Funcionarios/func_gleuce_admin", {
  FuncionarioID: "func_gleuce_admin",
  Nome: ADMIN_NAME,
  Email: ADMIN_EMAIL,
  Cargo: "Administrador Geral",
  Perfil: "Administrador",
  AuthUID: ADMIN_UID,
  LojaID: "",
  NomeLoja: "Todas as Lojas",
  Ativo: true,
  SaldoFolgas: 0,
  DataCriacao: new Date().toISOString(),
  DataAtualizacao: new Date().toISOString(),
});

// 4. Tabela Lojas
dbSet(`/gestao-folgas/v2/tables/Lojas/${STORE_ID}`, {
  LojaID: STORE_ID,
  NomeLoja: STORE_NAME,
  CodigoLoja: "1",
  Ativa: true,
  DiasFuncionamento: "1,2,3,4,5,6",
  LimiteFolgasPorDia: 1,
  ResponsavelEmail: ADMIN_EMAIL,
  ResponsavelNome: ADMIN_NAME,
  CriadoPor: ADMIN_EMAIL,
  DataCriacao: new Date().toISOString(),
  DataAtualizacao: new Date().toISOString(),
});

// 5. Tabela Configuracoes
const configs = {
  "Nome da empresa": "PontoFlow Pro - Grupo House 190",
  "Fuso horário": "America/Fortaleza",
  "País ou região": "BR",
  "Exigir aprovação": "true",
  "Limite padrão de funcionários de folga por dia": "1",
  "Permitir folga em feriado": "true",
  "Permitir meia folga": "true",
  "Permitir pedidos aos fins de semana": "true",
  "Prazo máximo para pedido": "180",
  "Prazo mínimo de antecedência": "3",
};

for (const [chave, valor] of Object.entries(configs)) {
  const encKey = encodeURIComponent(chave).replaceAll(".", "%2E");
  dbSet(`/gestao-folgas/v2/tables/Configuracoes/${encKey}`, {
    Chave: chave,
    Valor: valor,
    Descricao: chave,
    AtualizadoPor: ADMIN_EMAIL,
    DataAtualizacao: new Date().toISOString(),
  });
}

console.log("==> Cadastro e sincronizacao concluidos com sucesso!");
