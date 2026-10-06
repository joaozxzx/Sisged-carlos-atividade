# SISGED - Front-end (MVP estático)

Versão **somente front-end** do SISGED, feita para hospedagem estática (GitHub Pages e Cloudflare Pages).
Usa HTML, CSS, JavaScript e Bootstrap 5 (via CDN). Não há PHP, banco de dados nem autenticação real.

## Como testar localmente
Abra `index.html` no navegador (ou use a extensão Live Server do VS Code).
Escolha um perfil (Coordenação, Instrutor ou Aluno) e navegue por Painel, Turmas e Salas.

## Estrutura
- `index.html` — login simulado
- `dashboard.html` — painel
- `turmas/` e `salas/` — listagem e formulário (cadastro, edição, exclusão e busca)
- `assets/css`, `assets/js`, `assets/img` — estilos, scripts (inclui os dados fictícios em `dados.js`) e logos

## Limitações do MVP
- Login apenas simulado: não protege nada de verdade.
- Dados fictícios guardados no `localStorage` do navegador: não são compartilhados entre usuários.
- Módulos de alunos, instrutores e aulas não fazem parte deste MVP.
- Para uma versão completa seria necessário backend (PHP/API), banco MySQL/MariaDB e autenticação real.
