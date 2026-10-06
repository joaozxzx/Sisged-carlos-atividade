// SISGED - script.js (front-end estático com dados simulados)
// Login simulado, controle de perfil no navegador e telas de Painel, Salas e Turmas.
const BASE = document.body.dataset.base || '';
const PAGINA = document.body.dataset.pagina;
const $ = id => document.getElementById(id);

// ---------- sessão simulada (não é segurança real: qualquer pessoa pode alterá-la) ----------
function sessao() { try { return JSON.parse(sessionStorage.getItem('sisged_sessao')); } catch (_) { return null; } }
function entrar(perfil) {
  const d = carregar();
  let s = { nome: 'Coordenação', perfil: 'coordenacao', refId: 0 };
  if (perfil === 'instrutor') s = { nome: d.instrutores[0].nome, perfil, refId: d.instrutores[0].id };
  if (perfil === 'aluno') s = { nome: d.alunos[0].nome, perfil, refId: d.alunos[0].id };
  try { sessionStorage.setItem('sisged_sessao', JSON.stringify(s)); } catch (_) {}
  location.href = BASE + 'dashboard.html';
}
function sair() { try { sessionStorage.removeItem('sisged_sessao'); } catch (_) {} location.href = BASE + 'index.html'; }
function exigirLogin() { const s = sessao(); if (!s) { location.replace(BASE + 'index.html'); return null; } return s; }
function exigirPerfil(perfis) {
  const s = exigirLogin();
  if (s && !perfis.includes(s.perfil)) { location.replace(BASE + 'dashboard.html'); return null; }
  return s;
}

// ---------- layout comum ----------
function montarLayout() {
  const s = exigirLogin(); if (!s) return;
  $('usuario-nome').textContent = s.nome + ' (' + s.perfil + ')';
  $('btn-sair').addEventListener('click', sair);
  document.querySelectorAll('[data-perfis]').forEach(el => {
    if (!el.dataset.perfis.split(',').includes(s.perfil)) el.classList.add('d-none');
  });
}
function mostrarAlerta(texto, tipo) {
  const a = $('alerta'); if (!a) return;
  a.className = 'alert alert-' + (tipo || 'success') + ' alert-auto-fechar';
  a.textContent = texto;
  setTimeout(() => { a.classList.add('fade'); setTimeout(() => a.classList.add('d-none'), 500); }, 5000);
}
function lerMensagem() {
  const q = new URLSearchParams(location.search);
  if (q.get('sucesso')) mostrarAlerta(q.get('sucesso'), q.get('tipo') === 'erro' ? 'danger' : 'success');
  return q;
}
function mostrarErro(msg) { const el = $('erro'); el.textContent = msg; el.classList.remove('d-none'); }
function vazio(cols, texto) { return `<tr><td colspan="${cols}" class="text-center text-muted py-4">${texto}</td></tr>`; }

// ---------- Login ----------
function pLogin() {
  if (sessao()) { location.replace('dashboard.html'); return; }
  $('form-login').addEventListener('submit', ev => { ev.preventDefault(); entrar($('perfil').value); });
}

// ---------- Painel ----------
function pDashboard() {
  const s = exigirLogin(); if (!s) return;
  const d = carregar();
  let totais, aulas = aulasFuturas(d);
  if (s.perfil === 'coordenacao') {
    totais = { 'Instrutores': d.instrutores.length, 'Alunos': d.alunos.length, 'Turmas': d.turmas.length, 'Salas': d.salas.length };
  } else if (s.perfil === 'instrutor') {
    aulas = aulas.filter(a => a.instrutor_id === s.refId);
    totais = { 'Minhas Turmas': d.turmas.filter(t => t.instrutor_id === s.refId).length, 'Próximas Aulas': aulas.length };
  } else {
    const ids = d.matriculas.filter(m => m.aluno_id === s.refId).map(m => m.turma_id);
    aulas = aulas.filter(a => ids.includes(a.turma_id));
    totais = { 'Minhas Turmas': ids.length };
  }
  $('saudacao').textContent = 'Olá, ' + s.nome + ' 👋';
  $('perfil-atual').textContent = s.perfil;
  const cores = ['bg-cor-1', 'bg-cor-2', 'bg-cor-3', 'bg-cor-4'];
  $('cards').innerHTML = Object.entries(totais).map(([r, v], i) =>
    `<div class="col-6 col-md-3"><div class="card-resumo ${cores[i % 4]}"><div class="valor">${v}</div><div class="rotulo">${e(r)}</div></div></div>`).join('');
  aulas = aulas.slice(0, 8);
  $('proximas').innerHTML = aulas.length ? `<div class="table-responsive"><table class="table table-sisged table-hover align-middle">
    <thead><tr><th>Data</th><th>Horário</th><th>Turma</th><th>Sala</th><th>Instrutor</th><th>Status</th></tr></thead><tbody>` +
    aulas.map(a => `<tr><td>${formatarData(a.data)}</td><td>${a.ini} - ${a.fim}</td><td>${e(a.turma_nome)}</td><td>${e(a.sala_nome)}</td>
      <td>${e(a.instrutor_nome)}</td><td><span class="badge badge-status-${e(a.status)}">${e(a.status)}</span></td></tr>`).join('') +
    '</tbody></table></div>' : '<p class="text-muted mb-0">Nenhuma aula futura agendada.</p>';
  $('btn-restaurar').addEventListener('click', () => {
    if (confirm('Restaurar os dados de demonstração? As alterações feitas neste navegador serão perdidas.')) { restaurarDados(); location.reload(); }
  });
}

// ---------- Salas ----------
function pSalasListar() {
  if (!exigirPerfil(['coordenacao'])) return;
  const d = carregar(), q = lerMensagem();
  const busca = (q.get('busca') || '').trim(), b = busca.toLowerCase();
  $('busca').value = busca;
  const lista = d.salas.filter(s => !b || s.nome.toLowerCase().includes(b) || (s.localizacao || '').toLowerCase().includes(b))
    .sort((x, y) => x.nome.localeCompare(y.nome));
  $('tabela').innerHTML = lista.length ? lista.map(s => `<tr>
    <td>${e(s.nome)}</td><td>${s.capacidade} lugares</td><td>${e(s.localizacao)}</td><td>${e(s.recursos)}</td>
    <td class="text-end"><a href="formulario.html?id=${s.id}" class="btn btn-sm btn-outline-primary">Editar</a>
    <button type="button" class="btn btn-sm btn-outline-danger" data-excluir="${s.id}"
      data-confirm="Excluir a sala '${e(s.nome)}'? Essa ação não pode ser desfeita.">Excluir</button></td></tr>`).join('')
    : vazio(5, 'Nenhuma sala encontrada.');
  $('tabela').addEventListener('click', ev => {
    const bt = ev.target.closest('[data-excluir]'); if (!bt || !confirm(bt.dataset.confirm)) return;
    const id = +bt.dataset.excluir; let msg = 'Sala excluída com sucesso.', tipo = '';
    if (d.aulas.some(a => a.sala_id === id)) {
      msg = 'Não é possível excluir: esta sala está vinculada a aulas cadastradas. Remova as aulas antes de excluir a sala.'; tipo = '&tipo=erro';
    } else { d.salas = d.salas.filter(s => s.id !== id); salvar(); }
    location.href = 'listar.html?sucesso=' + encodeURIComponent(msg) + tipo;
  });
}
function pSalasForm() {
  if (!exigirPerfil(['coordenacao'])) return;
  const d = carregar(), id = +new URLSearchParams(location.search).get('id') || null;
  let reg = { nome: '', capacidade: '', localizacao: '', recursos: '' };
  if (id) { reg = d.salas.find(s => s.id === id); if (!reg) { location.replace('listar.html'); return; } }
  $('titulo').textContent = id ? 'Editar Sala' : 'Nova Sala';
  const f = $('form');
  ['nome', 'capacidade', 'localizacao', 'recursos'].forEach(k => f.elements[k].value = reg[k]);
  f.addEventListener('submit', ev => {
    ev.preventDefault(); f.classList.add('was-validated');
    const v = { nome: f.elements.nome.value.trim(), capacidade: parseInt(f.elements.capacidade.value, 10) || 0,
                localizacao: f.elements.localizacao.value.trim(), recursos: f.elements.recursos.value.trim() };
    if (!v.nome || v.capacidade <= 0) { mostrarErro('Nome e capacidade (maior que zero) são obrigatórios.'); return; }
    if (id) Object.assign(reg, v); else d.salas.push({ id: proximoId(d.salas), ...v });
    salvar();
    location.href = 'listar.html?sucesso=' + encodeURIComponent(id ? 'Sala atualizada com sucesso.' : 'Sala cadastrada com sucesso.');
  });
}

// ---------- Turmas ----------
function pTurmasListar() {
  const s = exigirLogin(); if (!s) return;
  const d = carregar(), q = lerMensagem(), coord = s.perfil === 'coordenacao';
  const busca = (q.get('busca') || '').trim(), b = busca.toLowerCase();
  let lista = d.turmas;
  if (s.perfil === 'instrutor') lista = lista.filter(t => t.instrutor_id === s.refId);
  if (s.perfil === 'aluno') { const ids = d.matriculas.filter(m => m.aluno_id === s.refId).map(m => m.turma_id); lista = lista.filter(t => ids.includes(t.id)); }
  if (coord && b) lista = lista.filter(t => t.nome.toLowerCase().includes(b) || t.disciplina.toLowerCase().includes(b));
  lista = [...lista].sort((x, y) => x.nome.localeCompare(y.nome));
  $('titulo').textContent = coord ? 'Turmas' : 'Minhas Turmas';
  document.querySelectorAll('.so-coord').forEach(el => el.classList.toggle('d-none', !coord));
  $('busca').value = busca;
  $('tabela').innerHTML = lista.length ? lista.map(t => {
    const instr = (d.instrutores.find(i => i.id === t.instrutor_id) || {}).nome || '—';
    const total = d.matriculas.filter(m => m.turma_id === t.id).length;
    return `<tr><td>${e(t.nome)}</td><td>${e(t.disciplina)}</td><td>${e(instr)}</td><td>${e(t.turno)}</td>
      <td>${formatarData(t.data_inicio)} a ${formatarData(t.data_fim)}</td><td>${total}</td>` + (coord ?
      `<td class="text-end"><a href="formulario.html?id=${t.id}" class="btn btn-sm btn-outline-primary">Editar</a>
       <button type="button" class="btn btn-sm btn-outline-danger" data-excluir="${t.id}"
         data-confirm="Excluir a turma '${e(t.nome)}'? Essa ação não pode ser desfeita.">Excluir</button></td>` : '') + '</tr>';
  }).join('') : vazio(7, 'Nenhuma turma encontrada.');
  $('tabela').addEventListener('click', ev => {
    const bt = ev.target.closest('[data-excluir]'); if (!bt || !confirm(bt.dataset.confirm)) return;
    const id = +bt.dataset.excluir; // exclusão em cascata, como no sistema original
    d.turmas = d.turmas.filter(t => t.id !== id);
    d.matriculas = d.matriculas.filter(m => m.turma_id !== id);
    d.aulas = d.aulas.filter(a => a.turma_id !== id);
    salvar();
    location.href = 'listar.html?sucesso=' + encodeURIComponent('Turma excluída com sucesso (matrículas e aulas vinculadas também foram removidas).');
  });
}
function pTurmasForm() {
  if (!exigirPerfil(['coordenacao'])) return;
  const d = carregar(), id = +new URLSearchParams(location.search).get('id') || null;
  let reg = { nome: '', disciplina: '', instrutor_id: '', data_inicio: '', data_fim: '', turno: 'Manhã' };
  if (id) { reg = d.turmas.find(t => t.id === id); if (!reg) { location.replace('listar.html'); return; } }
  $('titulo').textContent = id ? 'Editar Turma' : 'Nova Turma';
  const f = $('form');
  f.elements.instrutor_id.innerHTML = '<option value="">Selecione...</option>' +
    d.instrutores.map(i => `<option value="${i.id}">${e(i.nome)}</option>`).join('');
  ['nome', 'disciplina', 'instrutor_id', 'data_inicio', 'data_fim', 'turno'].forEach(k => f.elements[k].value = reg[k]);
  f.addEventListener('submit', ev => {
    ev.preventDefault(); f.classList.add('was-validated');
    const v = { nome: f.elements.nome.value.trim(), disciplina: f.elements.disciplina.value.trim(),
                instrutor_id: parseInt(f.elements.instrutor_id.value, 10) || 0,
                data_inicio: f.elements.data_inicio.value, data_fim: f.elements.data_fim.value, turno: f.elements.turno.value };
    if (!v.nome || !v.disciplina || !v.instrutor_id) return mostrarErro('Nome, disciplina e instrutor são obrigatórios.');
    if (v.data_inicio && v.data_fim && v.data_fim < v.data_inicio) return mostrarErro('A data final não pode ser anterior à data de início.');
    if (!d.instrutores.some(i => i.id === v.instrutor_id)) return mostrarErro('Instrutor selecionado é inválido.');
    if (id) Object.assign(reg, v); else d.turmas.push({ id: proximoId(d.turmas), ...v });
    salvar();
    location.href = 'listar.html?sucesso=' + encodeURIComponent(id ? 'Turma atualizada com sucesso.' : 'Turma cadastrada com sucesso.');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (PAGINA !== 'login') montarLayout();
  const rotas = { login: pLogin, dashboard: pDashboard, 'salas-listar': pSalasListar, 'salas-form': pSalasForm,
                  'turmas-listar': pTurmasListar, 'turmas-form': pTurmasForm };
  if (rotas[PAGINA]) rotas[PAGINA]();
});
