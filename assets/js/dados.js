// SISGED - dados simulados (MVP front-end, sem backend).
// Todos os dados abaixo são FICTÍCIOS. As alterações ficam salvas apenas no
// navegador de quem usa (localStorage) e não são compartilhadas entre usuários.
const CHAVE_DADOS = 'sisged_dados_v1';

const SEED = {
  instrutores: [
    { id: 1, nome: 'Carlos Mendes' }, { id: 2, nome: 'Ana Paula Ribeiro' }, { id: 3, nome: 'Roberto Alves' }
  ],
  alunos: [
    { id: 1, nome: 'Lucas Ferreira' }, { id: 2, nome: 'Mariana Costa' }, { id: 3, nome: 'Pedro Santos' },
    { id: 4, nome: 'Juliana Lima' }, { id: 5, nome: 'Rafael Souza' }, { id: 6, nome: 'Beatriz Rocha' }
  ],
  salas: [
    { id: 1, nome: 'Laboratório de Informática 1', capacidade: 24, localizacao: 'Bloco A - 1º andar', recursos: 'Computadores, projetor' },
    { id: 2, nome: 'Sala 101', capacidade: 30, localizacao: 'Bloco B - Térreo', recursos: 'Projetor, ar-condicionado' },
    { id: 3, nome: 'Oficina de Eletrotécnica', capacidade: 16, localizacao: 'Bloco C - Térreo', recursos: 'Bancadas, kits didáticos' },
    { id: 4, nome: 'Laboratório de Redes', capacidade: 20, localizacao: 'Bloco A - 2º andar', recursos: 'Switches, roteadores, racks' }
  ],
  turmas: [
    { id: 1, nome: 'DS-2026-A', disciplina: 'Programação Web', instrutor_id: 1, data_inicio: '2026-02-02', data_fim: '2026-12-11', turno: 'Manhã' },
    { id: 2, nome: 'RED-2026-A', disciplina: 'Redes de Computadores', instrutor_id: 2, data_inicio: '2026-02-02', data_fim: '2026-12-11', turno: 'Tarde' },
    { id: 3, nome: 'ELT-2026-A', disciplina: 'Instalações Elétricas', instrutor_id: 3, data_inicio: '2026-03-02', data_fim: '2026-12-18', turno: 'Noite' }
  ],
  matriculas: [
    { turma_id: 1, aluno_id: 1 }, { turma_id: 1, aluno_id: 2 }, { turma_id: 1, aluno_id: 3 },
    { turma_id: 2, aluno_id: 3 }, { turma_id: 2, aluno_id: 4 }, { turma_id: 2, aluno_id: 5 },
    { turma_id: 3, aluno_id: 6 }, { turma_id: 3, aluno_id: 5 }
  ],
  // "offset" = dias a partir de hoje, para que as próximas aulas sempre apareçam no painel
  aulas: [
    { id: 1, turma_id: 1, sala_id: 1, instrutor_id: 1, offset: 1, ini: '08:00', fim: '12:00', status: 'Agendada' },
    { id: 2, turma_id: 2, sala_id: 4, instrutor_id: 2, offset: 1, ini: '13:30', fim: '17:30', status: 'Agendada' },
    { id: 3, turma_id: 3, sala_id: 3, instrutor_id: 3, offset: 2, ini: '19:00', fim: '22:00', status: 'Agendada' },
    { id: 4, turma_id: 1, sala_id: 1, instrutor_id: 1, offset: 3, ini: '08:00', fim: '12:00', status: 'Agendada' },
    { id: 5, turma_id: 2, sala_id: 4, instrutor_id: 2, offset: 4, ini: '13:30', fim: '17:30', status: 'Agendada' },
    { id: 6, turma_id: 3, sala_id: 3, instrutor_id: 3, offset: 5, ini: '19:00', fim: '22:00', status: 'Agendada' },
    { id: 7, turma_id: 1, sala_id: 1, instrutor_id: 1, offset: 8, ini: '08:00', fim: '12:00', status: 'Agendada' },
    { id: 8, turma_id: 2, sala_id: 4, instrutor_id: 2, offset: 8, ini: '13:30', fim: '17:30', status: 'Agendada' },
    { id: 9, turma_id: 1, sala_id: 1, instrutor_id: 1, offset: -2, ini: '08:00', fim: '12:00', status: 'Realizada' }
  ]
};

let memoria = null;

function carregar() {
  if (memoria) return memoria;
  try {
    const txt = localStorage.getItem(CHAVE_DADOS);
    if (txt) { memoria = JSON.parse(txt); return memoria; }
  } catch (_) { /* storage indisponível: usa dados em memória */ }
  memoria = JSON.parse(JSON.stringify(SEED));
  return memoria;
}
function salvar() {
  try { localStorage.setItem(CHAVE_DADOS, JSON.stringify(memoria)); } catch (_) {}
}
function restaurarDados() {
  memoria = JSON.parse(JSON.stringify(SEED));
  salvar();
}

// ---------- utilitários ----------
function e(valor) { // escapa HTML (evita injeção de código nos dados digitados)
  return String(valor ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function formatarData(iso) {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}
function dataComOffset(dias) {
  const d = new Date(); d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function proximoId(lista) { return lista.reduce((m, x) => Math.max(m, x.id), 0) + 1; }

// Próximas aulas agendadas, já com nomes de turma/sala/instrutor e data real
function aulasFuturas(d) {
  const nome = (lista, id) => (lista.find(x => x.id === id) || {}).nome || '—';
  return d.aulas
    .filter(a => a.status === 'Agendada' && a.offset >= 0)
    .map(a => ({ ...a, data: dataComOffset(a.offset), turma_nome: nome(d.turmas, a.turma_id),
                 sala_nome: nome(d.salas, a.sala_id), instrutor_nome: nome(d.instrutores, a.instrutor_id) }))
    .sort((x, y) => x.data.localeCompare(y.data) || x.ini.localeCompare(y.ini));
}
