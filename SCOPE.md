# Manifesto de Módulos: Controle de Fiado

Este documento define os limites e as responsabilidades de cada módulo do sistema. A regra de ouro se aplica a todos: **Dívida Técnica Zero**. O banco de dados (PostgreSQL) faz o trabalho pesado, o AdonisJS dita as regras e validações, e o React+Inertia foca puramente em renderizar a interface utilitária.

---

## Módulo 1: Autenticação e Fundação (Core)

A base de segurança e isolamento da aplicação.

- **Autenticação:** Telas de Login e Recuperação de Senha.
- **Isolamento Multi-Tenant (Row-level):** O frontend NUNCA trafega o `tenant_id`. Um middleware no Adonis extrai essa informação da sessão autenticada e aplica a restrição `WHERE tenant_id = ?` em TODAS as queries subsequentes.
- **Proteção:** `@adonisjs/shield` configurado para CSRF, XSS e Rate Limiting nas rotas de autenticação.

## Módulo 2: Super Admin (O Dono do Software)

Módulo gerencial isolado, exclusivo para o administrador do SaaS.

- **Gestão de Lojistas:** Tabela administrativa para listar, ativar, suspender ou bloquear contas de inquilinos (lojas).
- **Métricas de Saúde:** Volume de requisições globais e total de lojas ativas, para planejamento de infraestrutura (VPS).

## Módulo 3: Painel do Lojista (Core Business)

O ambiente de trabalho diário. Deve possuir design Utilitarista Brutalista (Mobile-First, alvos de toque gigantes, alto contraste).

- **Dashboard Financeiro:** Visão rápida de "Total na Rua", "Recebido no Mês" e um ranking com os Maiores Devedores (carregado via Materialized Views no Postgres para velocidade extrema).
- **Módulo de Clientes:** Cadastro expresso (Nome e WhatsApp). Diretório com busca e saldo devedor destacado em fonte _monospace_.
- **Módulo de Lançamentos (Caixa):**
  - Ação de "Novo Fiado" via FAB (Floating Action Button).
  - Registrar pagamentos (totais ou parciais).
  - Extrato em linha do tempo mostrando o histórico individual de débitos e créditos.
- **Configurações:** Edição do nome da loja e configuração da **Chave PIX** de recebimento.

## Módulo 4: Portal do Cliente (Cobrança Frictionless)

Focado no devedor. Não há senhas, logins ou barreiras.

- **Link Mágico:** Página web pública, acessível via token único na URL gerado pelo painel do lojista (ex: `/c/token-seguro`).
- **Interface de Quitação:** Exibe a dívida total, o extrato de compras e um botão massivo de "Copiar Chave PIX" do lojista. Otimizado estritamente para visualização via WhatsApp no celular.

## Módulo 5: Inteligência e Dados (Smart Tags)

Uso pragmático do PostgreSQL, sem dependências externas ou filas complexas.

- **Armazenamento e GIN:** As descrições de compra são convertidas em arrays e salvas em uma coluna `JSONB` na tabela de dívidas, que deve possuir um índice `GIN` para buscas ultrarrápidas.
- **Sanitização Implacável:** Antes de salvar, o Adonis obrigatoriamente aplica um pipeline de limpeza na string: `normalize('NFD')`, remoção de acentos, conversão para _lowercase_, _trim_, e remoção de _stopwords_ (o, a, e, de, com). "Água" e "AGUA" sempre viram `"agua"`.
- **Insights de Vendas:** Uso de `jsonb_array_elements` para exibir as tags mais usadas como botões de autocomplete rápido para o caixa, sem a necessidade de um módulo de Controle de Estoque.
- **Score de Calote:** Cálculo de risco nativo em SQL (`CURRENT_DATE - ultima_data_pagamento`). Clientes sem pagamentos parciais há mais de 30 dias recebem flag de alto risco automaticamente.

## Módulo 6: Voice-to-Action (Lançamento por Voz)

O divisor de águas em usabilidade. Lançamento de dados sem o uso das mãos.

- **Frontend (Captura):** Uso exclusivo da API nativa do navegador (`window.SpeechRecognition`). Grava o áudio do lojista e transcreve para uma string bruta.
- **Backend (Parsing Heurístico):** O Adonis recebe a string (ex: "Marcelo lima gastou 20 reais com ovo e farinha") e utiliza Regex para extrair e tipar as informações.
  - Extrai numerais para compor o valor (`20.00`).
  - O que antecede a ação cruza com o banco para tentar dar _match_ no `Cliente`.
  - O que sucede a ação passa pelo pipeline de sanitização do Módulo 5, convertendo-se no array do `JSONB`.
- **Fallback Gracioso:** Se o Regex falhar na estruturação, a string bruta é devolvida ao frontend no campo de descrição para correção manual pelo lojista. O sistema não quebra.
