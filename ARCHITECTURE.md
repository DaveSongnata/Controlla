# Manifesto de Arquitetura: Controle de Fiado

## 1. Filosofia: "Akita Mode" (Pragmatismo de Engenharia)

Este projeto rejeita a complexidade desnecessária. Não estamos construindo uma rede social de escala global, estamos construindo um sistema de controle financeiro robusto e confiável.

- **Monolito Primeiro:** Evitamos a fragmentação de microserviços. Todo o domínio de negócio reside em um único processo.
- **Sem Hype, Apenas Resultados:** Escolhemos ferramentas baseadas na maturidade e na velocidade de entrega.
- **Dívida Técnica Zero:** Cada linha de código deve ter um propósito claro. Se não é necessário hoje, não será escrito.

## 2. A Stack Tecnológica

- **Backend:** AdonisJS v6 (O Framework Opinativo). Ele dita a estrutura, segurança e padrões.
- **Frontend:** React + Inertia.js. O React é usado estritamente como a camada de View. O roteamento e o estado da aplicação são controlados pelo Adonis.
- **Compilação:** Vite. Velocidade de desenvolvimento é prioridade.
- **Banco de Dados:** PostgreSQL. Persistência relacional clássica para dados financeiros.

## 3. Padrões de Desenvolvimento

- **Server-Side Routing:** O frontend não conhece rotas. O Adonis despacha componentes Inertia.
- **Single Source of Truth:** Validações de dados ocorrem no Backend (Validators do Adonis). O Frontend apenas reflete os erros.
- **Type Safety:** TypeScript de ponta a ponta. O contrato entre Backend e Frontend é garantido pela tipagem do Inertia.

## 4. Arquitetura Multi-Tenant

- **Isolamento Lógico (Row-level Isolation):** A separação dos inquilinos (lojas/usuários) será feita via coluna `tenant_id` nas tabelas, em vez de schemas separados ou múltiplos bancos. É a abordagem mais enxuta e manutenível para o estágio atual.
- **Segurança de Escopo Restrito:** O backend nunca confiará no frontend para informar o tenant. O AdonisJS usará middlewares para extrair o `tenant_id` do usuário autenticado na sessão e aplicá-lo automaticamente como filtro em todas as queries no banco de dados. Um inquilino nunca pode cruzar a fronteira dos dados de outro.

## 5. Infraestrutura e Deployment

- **Containerização:** Docker para tudo. O ambiente de desenvolvimento deve ser idêntico ao de produção.
- **Deployment Atômico:** Orquestração simples via Makefile para provisionar, migrar e levantar a aplicação de forma automatizada na VPS.

## 6. Design e Interface (Utilitarismo Brutalista)

O sistema deve evitar o aspecto genérico de "AI Slop" (interfaces pasteurizadas, sombras suaves, gradientes sem propósito). O foco é na UX de quem usa WhatsApp o dia todo: precisa ser rápido, óbvio e com alvos de toque enormes (Mobile-First).

- **Estética:** Utilitarismo Brutalista. Alto contraste, elementos delimitados e aspecto de "caderneta física moderna".
- **Paleta de Cores:**
  - **Background:** Branco puro (`#FFFFFF`) ou Cinza Industrial (`#F3F4F6`).
  - **Bordas e Sombras:** Preto puro (`#000000`). Sombras devem ser sólidas (ex: `box-shadow: 4px 4px 0px 0px rgba(0,0,0,1)`), sem nenhum "blur".
  - **Ações e Sinais:** Cores de trânsito saturadas e sem gradiente. Vermelho Brutal para "Dívida", Verde Escuro para "Pago/Receber", Amarelo Vibrante para "Ações Primárias/Novo Fiado".
- **Tipografia:**
  - **Textos Gerais e Nomes:** Fonte nativa do sistema (`font-sans`, `system-ui`). Traz a sensação de app nativo.
  - **Números e Valores Financeiros:** Estritamente Monospace (`JetBrains Mono`, `Space Mono` ou `ui-monospace`). Garante alinhamento vertical perfeito na listagem de dívidas e evita que os números "pulem" na tela.
- **Componentes:** Botões com mínimo de `padding-y` de `1rem` (48px de altura) para garantir a ergonomia no toque. Uso de FAB (Floating Action Button) para a ação principal de "Novo Fiado", posicionado no mesmo local do botão de nova mensagem do WhatsApp.

## 7. Segurança (Paranoia Justificada)

A premissa básica do sistema é: o frontend mente, o backend duvida.

- **Isolamento de Tenant:** O frontend NUNCA envia o `tenant_id` no payload das requisições. O Adonis extrai o identificador do lojista diretamente do cookie/token de sessão e um middleware injeta essa cláusula `WHERE tenant_id = ?` silenciosamente em todas as queries.
- **Validação Estrita (Single Source of Truth):** Zero confiança na tipagem do frontend. Toda entrada de dados passa por um Validator do Adonis antes de tocar no Controller. Se falhar, retorna o erro padronizado para o Inertia renderizar.
- **Proteção de Base:** O pacote `@adonisjs/shield` deve estar ativo em todas as rotas web para garantir proteção contra CSRF, XSS (configuração estrita de headers) e Clickjacking.
- **Rate Limiting:** Rotas de autenticação (login, reset de senha) devem ter limite de requisições por IP para mitigar ataques de força bruta.

## 8. Banco de Dados e Otimização

O Node.js não deve fazer o trabalho que o PostgreSQL foi construído para fazer. O sistema não pode ficar "gordo" ou lento com o tempo.

- **Índices Estratégicos:** Evitar _Full Table Scans_. Toda tabela que cresce diariamente deve ter índices (`B-Tree`) em colunas de busca frequente. Obrigatório: Índices nas colunas `tenant_id`, `cliente_id` e `status_pagamento`. Índices compostos (ex: `tenant_id` + `cliente_id`) devem ser criados para as queries de listagem principal.
- **Integridade Referencial:** O uso de _Foreign Keys_ (FKs) com regras estritas de `ON DELETE RESTRICT` ou `CASCADE` (quando aplicável) é obrigatório. A garantia de consistência dos dados fica no banco, não na aplicação.
- **Cálculos e Agregações:** Somatórias de dívidas totais de um cliente devem ser feitas no banco de dados (`SUM()`, `GROUP BY`) e não carregando um array de milhares de objetos no Adonis para fazer `.reduce()` na memória RAM do servidor.
