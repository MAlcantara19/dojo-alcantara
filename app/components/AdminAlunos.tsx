"use client";

import { useState } from "react";
import { anoCampeonato, dataBR, diasParaAniversario, hojeISO, idade, mesesEntre, parseISO, type Aluno } from "../lib/aluno";
import { atualizarAluno, lerInternos, lerTurmas, listarAlunos, salvarInterno, type Escopo, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { corDaFaixa, faixas } from "../lib/faixas";
import { useCarga } from "../lib/useCarga";
import AcoesConta from "./AcoesConta";
import FormCadastro, { semCel } from "./FormCadastro";
import MedidasAluno from "./MedidasAluno";

const VAZIO_A: Aluno[] = [];
const VAZIO_T: Turma[] = [];
const VAZIO_I: Record<string, string> = {};

export default function AdminAlunos({ ehAdmin, escopo }: { ehAdmin: boolean; escopo: Escopo }) {
  const alunos = useCarga(() => listarAlunos(escopo), VAZIO_A);
  const turmas = useCarga(lerTurmas, VAZIO_T);
  const internos = useCarga(lerInternos, VAZIO_I, ehAdmin);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [medidas, setMedidas] = useState<string | null>(null);
  const [senhaDe, setSenhaDe] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const [limite, setLimite] = useState(12);

  const hoje = new Date();
  const termo = busca.trim().toLowerCase();
  const turmaDe = (nome?: string) => turmas.dados.find((t) => t.nome === nome);
  const lista = alunos.dados
    .filter((a) => (filtro === "" ? true : filtro === "__sem" ? !a.academia : a.academia === filtro))
    .filter((a) => !termo || a.nome.toLowerCase().includes(termo) || (a.apelido ?? "").toLowerCase().includes(termo) || (internos.dados[a.uid] ?? "").toLowerCase().includes(termo));
  const semTurma = alunos.dados.filter((a) => !a.academia).length;
  const aniversarios = alunos.dados
    .filter((a) => a.dataNascimento)
    .map((a) => ({ a, dias: diasParaAniversario(a.dataNascimento as string, hoje) }))
    .filter((x) => x.dias <= 30)
    .sort((x, y) => x.dias - y.dias);
  const paradosNaFaixa = alunos.dados.filter((a) => a.faixa !== "Preta" && a.faixaDesde && mesesEntre(a.faixaDesde, hoje) >= limite);

  async function salvar(e: React.FormEvent<HTMLFormElement>, a: Aluno) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const faixa = g("faixa");
    let desde = g("desde");
    if (!g("nome")) return setAviso("O nome não pode ficar vazio.");
    let nota = "";
    if (faixa !== a.faixa && desde === (a.faixaDesde ?? "")) {
      desde = hojeISO();
      nota = " A faixa mudou, então “na faixa desde” passou a valer hoje. Se não for isso, edite a data.";
    }
    setAviso("Salvando…");
    try {
      await atualizarAluno(a.uid, { nome: g("nome"), apelido: g("apelido"), dataNascimento: g("nasc"), faixa, faixaDesde: desde, academia: g("academia"), email: g("email").toLowerCase(), celular: g("celular").replace(/\D/g, "") });
      if (ehAdmin && g("interno") !== (internos.dados[a.uid] ?? "")) await salvarInterno(a.uid, g("interno"));
      setAviso(`Dados de ${g("apelido") || g("nome")} salvos.${nota}`);
      setEditando(null);
      alunos.recarregar();
      internos.recarregar();
    } catch (err) {
      setAviso(mensagemErro(err));
    }
  }

  return (
    <>
      {!ehAdmin && (
        <p className="form-help">
          {escopo && escopo.length > 0 ? `Você vê os alunos das turmas: ${escopo.map((t) => turmaDe(t)?.apelido || t).join(", ")}.` : "Você ainda não foi vinculado a nenhuma turma. Peça ao administrador."} Só o administrador cadastra e edita os dados dos alunos.
        </p>
      )}

      {ehAdmin && (
        <section className="panel" id="cadastro">
          <h2>Cadastrar aluno</h2>
          <FormCadastro tipo="aluno" turmas={turmas.dados} onCriado={() => (alunos.recarregar(), internos.recarregar())} />
        </section>
      )}

      <section className="panel" id="alunos">
        <h2>Alunos cadastrados</h2>
        {aviso && (
          <p className="form-note" role="status">
            {aviso}
          </p>
        )}
        <div className="two">
          <div className="field">
            <label htmlFor="al-busca">Buscar ({alunos.dados.length} no total)</label>
            <input id="al-busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome ou apelido" />
          </div>
          <div className="field">
            <label htmlFor="al-filtro">Turma</label>
            <select id="al-filtro" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <option value="">Todas</option>
              {ehAdmin && <option value="__sem">Sem turma designada ({semTurma})</option>}
              {turmas.dados
                .filter((t) => escopo === null || escopo.includes(t.nome))
                .map((t) => (
                  <option key={t.id} value={t.nome}>
                    {t.apelido || t.nome}
                  </option>
                ))}
            </select>
          </div>
        </div>
        {alunos.erro && <p className="empty">Não consegui ler a lista de alunos.</p>}
        <ul className="manage">
          {!alunos.carregando && !alunos.erro && lista.length === 0 && <li className="empty">Nenhum aluno encontrado.</li>}
          {lista.slice(0, 60).map((a) => (
            <li key={a.uid} className="aluno coluna">
              {editando === a.uid ? (
                <form className="form tedit" onSubmit={(e) => void salvar(e, a)}>
                  <strong>Editar {a.apelido || a.nome}</strong>
                  <div className="field">
                    <label>Nome completo</label>
                    <input name="nome" type="text" maxLength={100} defaultValue={a.nome} autoComplete="off" />
                  </div>
                  <div className="two">
                    <div className="field">
                      <label>Apelido (todos veem)</label>
                      <input name="apelido" type="text" maxLength={40} defaultValue={a.apelido ?? ""} autoComplete="off" />
                    </div>
                    {ehAdmin && (
                      <div className="field">
                        <label>Apelido interno (só você vê)</label>
                        <input name="interno" type="text" maxLength={40} defaultValue={internos.dados[a.uid] ?? ""} autoComplete="off" />
                      </div>
                    )}
                  </div>
                  <div className="two">
                    <div className="field">
                      <label>Data de nascimento</label>
                      <input name="nasc" type="date" max={hojeISO()} defaultValue={a.dataNascimento ?? ""} />
                    </div>
                    <div className="field">
                      <label>Turma</label>
                      <select name="academia" defaultValue={a.academia ?? ""}>
                        <option value="">Sem turma designada</option>
                        {a.academia && !turmaDe(a.academia) && <option value={a.academia}>{a.academia} (não está na lista)</option>}
                        {turmas.dados.map((t) => (
                          <option key={t.id} value={t.nome}>
                            {t.apelido || t.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="two">
                    <div className="field">
                      <label>Faixa</label>
                      <select name="faixa" defaultValue={a.faixa}>
                        {faixas.map((f) => (
                          <option key={f.nome}>{f.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>Na faixa desde</label>
                      <input name="desde" type="date" max={hojeISO()} defaultValue={a.faixaDesde ?? ""} />
                    </div>
                  </div>
                  <div className="two">
                    <div className="field">
                      <label>E-mail (contato)</label>
                      <input name="email" type="email" defaultValue={a.email ?? ""} autoComplete="off" />
                    </div>
                    <div className="field">
                      <label>Celular (contato)</label>
                      <input name="celular" type="tel" inputMode="tel" defaultValue={a.celular ?? ""} autoComplete="off" />
                    </div>
                  </div>
                  <p className="form-help">E-mail e celular aqui são só para contato. O login da pessoa continua sendo: {semCel(a.login)}.</p>
                  <div className="tool-actions">
                    <button className="btn btn-primary" type="submit">
                      Salvar alterações
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => setEditando(null)}>
                      Cancelar
                    </button>
                  </div>
                  {ehAdmin && <AcoesConta uid={a.uid} nome={a.apelido || a.nome} onApagada={() => (setEditando(null), alunos.recarregar())} onEmail={alunos.recarregar} />}
                </form>
              ) : (
                <>
                  <span>
                    <strong>{a.apelido ? `${a.apelido} · ${a.nome}` : a.nome}</strong>
                    <small>
                      <i className="dot" style={{ background: corDaFaixa(a.faixa) }} aria-hidden="true" /> Faixa {a.faixa.toLowerCase()}
                      {a.faixaDesde ? ` desde ${dataBR(a.faixaDesde)}` : ""} · {turmaDe(a.academia)?.apelido || a.academia || "Sem turma designada"}
                    </small>
                    {a.dataNascimento && (
                      <small>
                        {idade(a.dataNascimento, hoje)} anos · campeonato {hoje.getFullYear()}: {anoCampeonato(a.dataNascimento, hoje)} anos
                      </small>
                    )}
                    <small>Login: {semCel(a.login)}</small>
                    {ehAdmin && internos.dados[a.uid] && <small>Apelido interno: {internos.dados[a.uid]}</small>}
                  </span>
                  <span className="tlinks">
                    <button className="btn btn-ghost" onClick={() => setMedidas(medidas === a.uid ? null : a.uid)}>
                      {medidas === a.uid ? "Fechar medidas" : "Peso e altura"}
                    </button>
                    {ehAdmin ? (
                      <button className="btn btn-ghost" onClick={() => (setEditando(a.uid), setAviso(""))}>
                        Editar
                      </button>
                    ) : (
                      <button className="btn btn-ghost" onClick={() => setSenhaDe(senhaDe === a.uid ? null : a.uid)}>
                        Senha
                      </button>
                    )}
                  </span>
                  {medidas === a.uid && <MedidasAluno uid={a.uid} />}
                  {!ehAdmin && senhaDe === a.uid && <AcoesConta uid={a.uid} nome={a.apelido || a.nome} completo={false} onApagada={alunos.recarregar} />}
                </>
              )}
            </li>
          ))}
        </ul>
        {lista.length > 60 && <p className="form-help">Mostrando 60 de {lista.length}. Use a busca ou o filtro de turma.</p>}
      </section>

      <section className="panel" id="faixas">
        <h2>Aniversários e tempo na faixa</h2>
        <h3 className="sub">Aniversariantes dos próximos 30 dias ({aniversarios.length})</h3>
        <ul className="manage">
          {aniversarios.length === 0 && <li className="empty">Nenhum aniversário nos próximos 30 dias.</li>}
          {aniversarios.map(({ a, dias }) => (
            <li key={a.uid}>
              <span>
                <strong>{a.apelido || a.nome}</strong>
                <small>
                  {dias === 0 ? "Hoje!" : dias === 1 ? "Amanhã" : `Em ${dias} dias`} · {dataBR(a.dataNascimento as string).slice(0, 5)} · faz {idade(a.dataNascimento as string, parseISO(hojeISO())) + 1} anos
                </small>
              </span>
            </li>
          ))}
        </ul>
        <h3 className="sub">Tempo na mesma faixa ({paradosNaFaixa.length})</h3>
        <div className="field">
          <label htmlFor="al-limite">Mostrar quem está há pelo menos</label>
          <select id="al-limite" value={limite} onChange={(e) => setLimite(Number(e.target.value))}>
            {[6, 12, 18, 24, 36].map((m) => (
              <option key={m} value={m}>
                {m} meses na mesma faixa
              </option>
            ))}
          </select>
        </div>
        <ul className="manage">
          {paradosNaFaixa.length === 0 && <li className="empty">Ninguém neste critério.</li>}
          {paradosNaFaixa.map((a) => (
            <li key={a.uid}>
              <span>
                <strong>{a.apelido || a.nome}</strong>
                <small>
                  Faixa {a.faixa.toLowerCase()} há {mesesEntre(a.faixaDesde as string, hoje)} meses
                </small>
              </span>
            </li>
          ))}
        </ul>
        <p className="form-help">É só um aviso para você avaliar. A decisão de exame continua sendo sua e da federação.</p>
      </section>
    </>
  );
}
