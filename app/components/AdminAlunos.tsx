"use client";

import { useState } from "react";
import { anoCampeonato, dataBR, diasParaAniversario, hojeISO, idade, mesesEntre, parseISO, senhaProvisoria, type Aluno } from "../lib/aluno";
import { addTurma, apagarTurma, criarConta, lerInternos, lerTurmas, listarAlunos, listarProfessores, mudarFaixa, mudarTurma, salvarInterno, salvarTurmasProfessor, type Escopo, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { corDaFaixa, faixas } from "../lib/faixas";
import { useCarga } from "../lib/useCarga";

const VAZIO_A: Aluno[] = [];
const VAZIO_T: Turma[] = [];
const VAZIO_I: Record<string, string> = {};

type Entregue = { nome: string; login: string; senha: string };
const semCel = (l?: string) => (l?.endsWith("@celular.dojoalcantara.app") ? l.split("@")[0] + " (celular)" : l);

export default function AdminAlunos({ ehAdmin, escopo }: { ehAdmin: boolean; escopo: Escopo }) {
  const alunos = useCarga(() => listarAlunos(escopo), VAZIO_A);
  const turmas = useCarga(lerTurmas, VAZIO_T);
  const internos = useCarga(lerInternos, VAZIO_I, ehAdmin);
  const professores = useCarga(listarProfessores, VAZIO_A, ehAdmin);
  const [busca, setBusca] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [entregue, setEntregue] = useState<Entregue | null>(null);
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState<"aluno" | "professor">("aluno");
  const [limite, setLimite] = useState(12);

  const hoje = new Date();
  const termo = busca.trim().toLowerCase();
  const lista = alunos.dados.filter((a) => !termo || a.nome.toLowerCase().includes(termo) || (a.apelido ?? "").toLowerCase().includes(termo) || (internos.dados[a.uid] ?? "").toLowerCase().includes(termo));
  const aniversarios = alunos.dados
    .map((a) => ({ a, dias: diasParaAniversario(a.dataNascimento, hoje) }))
    .filter((x) => x.dias <= 30)
    .sort((x, y) => x.dias - y.dias);
  const paradosNaFaixa = alunos.dados.filter((a) => a.faixa !== "Preta" && a.faixaDesde && mesesEntre(a.faixaDesde, hoje) >= limite);

  async function criar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const marcadas = f.getAll("turmas").map(String);
    const dados = {
      nome: g("nome"),
      apelido: g("apelido"),
      apelidoInterno: g("interno"),
      dataNascimento: g("nasc"),
      faixa: g("faixa"),
      academia: tipo === "aluno" ? g("academia") : "",
      email: g("email"),
      celular: g("celular"),
      papel: tipo,
      turmas: tipo === "professor" ? marcadas : [],
    };
    const pw = senha.trim();
    if (!dados.nome || !dados.dataNascimento || !dados.faixa) return setMsg("Preencha nome completo, data de nascimento e faixa.");
    if (tipo === "aluno" && !dados.academia) return setMsg("Escolha a turma do aluno. Se não houver nenhuma na lista, cadastre as turmas primeiro.");
    if (!dados.email && dados.celular.replace(/\D/g, "").length < 10) return setMsg("Informe um e-mail ou um celular com DDD.");
    if (pw.length < 6) return setMsg("A senha provisória precisa ter pelo menos 6 caracteres. Use o botão “Gerar senha”.");
    setOcupado(true);
    setMsg("");
    try {
      const { login } = await criarConta(dados, pw);
      setEntregue({ nome: dados.nome, login, senha: pw });
      form.reset();
      setSenha("");
      alunos.recarregar();
      internos.recarregar();
      professores.recarregar();
    } catch (err) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "";
      setMsg(code === "auth/email-already-in-use" ? "Já existe uma conta com esse e-mail ou celular." : code === "auth/weak-password" ? "Senha fraca: use pelo menos 6 caracteres." : mensagemErro(err));
    }
    setOcupado(false);
  }

  async function rodar(acao: () => Promise<void>, ok: string, depois?: () => void) {
    setMsg("");
    try {
      await acao();
      setMsg(ok);
      depois?.();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  function novaTurma(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const nome = String(new FormData(form).get("nome") ?? "").trim();
    if (!nome) return setMsg("Escreva o nome da turma.");
    if (turmas.dados.some((t) => t.nome.toLowerCase() === nome.toLowerCase())) return setMsg("Essa turma já existe.");
    void rodar(() => addTurma(nome), "Turma criada.", () => (form.reset(), turmas.recarregar()));
  }

  function guardarProfessor(e: React.FormEvent<HTMLFormElement>, p: Aluno) {
    e.preventDefault();
    const marcadas = new FormData(e.currentTarget).getAll("turmas").map(String);
    void rodar(() => salvarTurmasProfessor(p.uid, marcadas), `Turmas de ${p.nome} salvas.`, professores.recarregar);
  }

  return (
    <section className="panel" id="alunos">
      <h2>Alunos</h2>

      {!ehAdmin && (
        <p className="form-help">
          {escopo && escopo.length > 0 ? `Você vê os alunos das turmas: ${escopo.join(", ")}.` : "Você ainda não foi vinculado a nenhuma turma. Peça ao administrador."} Só o administrador cadastra alunos e muda faixas.
        </p>
      )}

      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}

      {entregue && (
        <div className="entrega" role="status">
          <strong>Conta criada para {entregue.nome}</strong>
          <p>
            Login: <b>{semCel(entregue.login)}</b>
          </p>
          <p>
            Senha provisória: <b className="mono">{entregue.senha}</b>
          </p>
          <p className="form-help">Passe estes dados agora. Esta senha não aparece de novo. No primeiro acesso a pessoa será convidada a trocá-la.</p>
          <button className="btn btn-ghost" onClick={() => setEntregue(null)}>
            Já anotei
          </button>
        </div>
      )}

      {ehAdmin && (
        <>
          <details className="novo">
            <summary>Turmas ({turmas.dados.length})</summary>
            <p className="form-help">Cada aluno pertence a uma turma e cada professor vê só as turmas dele. Crie as turmas antes de cadastrar os alunos e não mude o nome depois.</p>
            <form className="form inline" onSubmit={novaTurma}>
              <input name="nome" type="text" maxLength={60} placeholder="Ex.: Três Rios" aria-label="Nome da turma" autoComplete="off" />
              <button className="btn btn-primary" type="submit">
                Criar turma
              </button>
            </form>
            <ul className="manage">
              {turmas.dados.length === 0 && <li className="empty">Nenhuma turma ainda.</li>}
              {turmas.dados.map((t) => (
                <li key={t.id}>
                  <strong>{t.nome}</strong>
                  <button className="btn btn-ghost" onClick={() => window.confirm(`Apagar a turma “${t.nome}”? Os alunos dela continuam cadastrados, mas ficam sem turma visível.`) && void rodar(() => apagarTurma(t.id), "Turma apagada.", turmas.recarregar)}>
                    Apagar
                  </button>
                </li>
              ))}
            </ul>
          </details>

          <details className="novo">
            <summary>Professores e suas turmas ({professores.dados.length})</summary>
            {professores.dados.length === 0 && <p className="empty">Nenhum professor cadastrado. Crie a conta dele em “Cadastrar aluno ou professor”.</p>}
            {professores.dados.map((p) => (
              <form key={p.uid + (p.turmas ?? []).join()} className="tedit" onSubmit={(e) => guardarProfessor(e, p)}>
                <strong>{p.nome}</strong>
                <small>Login: {semCel(p.login)}</small>
                <div className="checks">
                  {turmas.dados.map((t) => (
                    <label key={t.id}>
                      <input type="checkbox" name="turmas" value={t.nome} defaultChecked={(p.turmas ?? []).includes(t.nome)} /> {t.nome}
                    </label>
                  ))}
                </div>
                <button className="btn btn-primary" type="submit">
                  Salvar turmas
                </button>
              </form>
            ))}
          </details>

          <details className="novo">
            <summary>Cadastrar aluno ou professor</summary>
            <form className="form" onSubmit={criar}>
              <div className="field">
                <label htmlFor="al-papel">Tipo de conta</label>
                <select id="al-papel" value={tipo} onChange={(e) => setTipo(e.target.value as "aluno" | "professor")}>
                  <option value="aluno">Aluno</option>
                  <option value="professor">Professor</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="al-nome">Nome completo</label>
                <input id="al-nome" name="nome" type="text" maxLength={100} autoComplete="off" />
              </div>
              <div className="two">
                <div className="field">
                  <label htmlFor="al-apelido">Apelido (todos veem)</label>
                  <input id="al-apelido" name="apelido" type="text" maxLength={40} autoComplete="off" />
                </div>
                <div className="field">
                  <label htmlFor="al-interno">Apelido interno (só você vê)</label>
                  <input id="al-interno" name="interno" type="text" maxLength={40} autoComplete="off" />
                </div>
              </div>
              <div className="two">
                <div className="field">
                  <label htmlFor="al-nasc">Data de nascimento</label>
                  <input id="al-nasc" name="nasc" type="date" max={hojeISO()} />
                </div>
                <div className="field">
                  <label htmlFor="al-faixa">Faixa</label>
                  <select id="al-faixa" name="faixa" defaultValue="Branca">
                    {faixas.map((f) => (
                      <option key={f.nome}>{f.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              {tipo === "aluno" ? (
                <div className="field">
                  <label htmlFor="al-academia">Turma</label>
                  <select id="al-academia" name="academia" defaultValue="">
                    <option value="">Escolha…</option>
                    {turmas.dados.map((t) => (
                      <option key={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <fieldset className="checks">
                  <legend>Turmas que este professor pode ver</legend>
                  {turmas.dados.map((t) => (
                    <label key={t.id}>
                      <input type="checkbox" name="turmas" value={t.nome} /> {t.nome}
                    </label>
                  ))}
                </fieldset>
              )}
              <div className="two">
                <div className="field">
                  <label htmlFor="al-email">E-mail (se tiver)</label>
                  <input id="al-email" name="email" type="email" autoComplete="off" />
                </div>
                <div className="field">
                  <label htmlFor="al-cel">Celular com DDD</label>
                  <input id="al-cel" name="celular" type="tel" inputMode="tel" autoComplete="off" placeholder="(24) 99999-9999" />
                </div>
              </div>
              <p className="form-help">A pessoa entra com o e-mail, ou com o celular se não houver e-mail.</p>
              <div className="field">
                <label htmlFor="al-senha">Senha provisória</label>
                <div className="inline">
                  <input id="al-senha" type="text" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="off" />
                  <button type="button" className="btn btn-ghost" onClick={() => setSenha(senhaProvisoria())}>
                    Gerar senha
                  </button>
                </div>
              </div>
              <button className="btn btn-primary" type="submit" disabled={ocupado}>
                {ocupado ? "Criando…" : "Criar conta"}
              </button>
            </form>
          </details>
        </>
      )}

      <details className="novo" open={aniversarios.length > 0}>
        <summary>Aniversariantes dos próximos 30 dias ({aniversarios.length})</summary>
        <ul className="manage">
          {aniversarios.length === 0 && <li className="empty">Nenhum aniversário nos próximos 30 dias.</li>}
          {aniversarios.map(({ a, dias }) => (
            <li key={a.uid}>
              <span>
                <strong>{a.apelido || a.nome}</strong>
                <small>
                  {dias === 0 ? "Hoje!" : dias === 1 ? "Amanhã" : `Em ${dias} dias`} · {dataBR(a.dataNascimento).slice(0, 5)} · faz {idade(a.dataNascimento, parseISO(hojeISO())) + 1} anos · {a.academia}
                </small>
              </span>
            </li>
          ))}
        </ul>
      </details>

      <details className="novo">
        <summary>Tempo na mesma faixa ({paradosNaFaixa.length})</summary>
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
                  Faixa {a.faixa.toLowerCase()} há {mesesEntre(a.faixaDesde as string, hoje)} meses · {a.academia}
                </small>
              </span>
            </li>
          ))}
        </ul>
        <p className="form-help">É só um aviso para você avaliar. A decisão de exame continua sendo sua e da federação.</p>
      </details>

      <div className="field">
        <label htmlFor="al-busca">Buscar aluno ({alunos.dados.length} cadastrados)</label>
        <input id="al-busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome ou apelido" />
      </div>
      {alunos.erro && <p className="empty">Não consegui ler a lista de alunos.</p>}
      <ul className="manage">
        {!alunos.carregando && !alunos.erro && lista.length === 0 && <li className="empty">Nenhum aluno encontrado.</li>}
        {lista.slice(0, 40).map((a) => (
          <li key={a.uid} className="aluno">
            <span>
              <strong>{a.apelido ? `${a.apelido} · ${a.nome}` : a.nome}</strong>
              <small>
                {a.academia} · {idade(a.dataNascimento, hoje)} anos · campeonato {hoje.getFullYear()}: {anoCampeonato(a.dataNascimento, hoje)} anos
                {a.faixaDesde ? ` · na faixa desde ${dataBR(a.faixaDesde)}` : ""}
              </small>
              <small>Login: {semCel(a.login)}</small>
              {ehAdmin && (
                <select
                  className="mini"
                  aria-label={`Turma de ${a.nome}`}
                  value={a.academia ?? ""}
                  onChange={(e) => e.target.value !== a.academia && void rodar(() => mudarTurma(a.uid, e.target.value), `${a.apelido || a.nome} agora é da turma ${e.target.value}.`, alunos.recarregar)}
                >
                  {!turmas.dados.some((t) => t.nome === a.academia) && <option value={a.academia ?? ""}>{a.academia || "Sem turma"} (não está na lista)</option>}
                  {turmas.dados.map((t) => (
                    <option key={t.id}>{t.nome}</option>
                  ))}
                </select>
              )}
              {ehAdmin && (
                <input
                  className="mini"
                  type="text"
                  aria-label={`Apelido interno de ${a.nome}`}
                  placeholder="Apelido interno"
                  defaultValue={internos.dados[a.uid] ?? ""}
                  key={a.uid + (internos.dados[a.uid] ?? "")}
                  onBlur={(e) => e.target.value.trim() !== (internos.dados[a.uid] ?? "") && void rodar(() => salvarInterno(a.uid, e.target.value), "Apelido interno salvo.", internos.recarregar)}
                />
              )}
            </span>
            <select
              aria-label={`Faixa de ${a.nome}`}
              disabled={!ehAdmin}
              value={a.faixa}
              onChange={(e) => e.target.value !== a.faixa && void rodar(() => mudarFaixa(a.uid, e.target.value), `${a.apelido || a.nome} agora é faixa ${e.target.value.toLowerCase()}.`, alunos.recarregar)}
              style={{ borderLeft: `8px solid ${corDaFaixa(a.faixa)}` }}
            >
              {faixas.map((f) => (
                <option key={f.nome}>{f.nome}</option>
              ))}
            </select>
          </li>
        ))}
      </ul>
      {lista.length > 40 && <p className="form-help">Mostrando 40 de {lista.length}. Use a busca para achar os outros.</p>}
      {ehAdmin && <p className="form-help">Para trocar a senha de alguém ou apagar uma conta: Firebase → Authentication → Usuários.</p>}
    </section>
  );
}
