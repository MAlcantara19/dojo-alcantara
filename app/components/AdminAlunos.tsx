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
type Onde = "turmas" | "professores" | "cadastro" | "alunos" | "faixas";
function Aviso({ aviso, onde }: { aviso: { onde: Onde; texto: string } | null; onde: Onde }) {
  return aviso?.onde === onde ? (
    <p className="form-note" role="status">
      {aviso.texto}
    </p>
  ) : null;
}

const semCel = (l?: string) => (l?.endsWith("@celular.dojoalcantara.app") ? l.split("@")[0] + " (celular)" : l);

export default function AdminAlunos({ ehAdmin, escopo }: { ehAdmin: boolean; escopo: Escopo }) {
  const alunos = useCarga(() => listarAlunos(escopo), VAZIO_A);
  const turmas = useCarga(lerTurmas, VAZIO_T);
  const internos = useCarga(lerInternos, VAZIO_I, ehAdmin);
  const professores = useCarga(listarProfessores, VAZIO_A, ehAdmin);
  const [busca, setBusca] = useState("");
  const [aviso, setAviso] = useState<{ onde: Onde; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [entregue, setEntregue] = useState<Entregue | null>(null);
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState<"aluno" | "professor">("aluno");
  const [limite, setLimite] = useState(12);

  const hoje = new Date();
  const termo = busca.trim().toLowerCase();
  const lista = alunos.dados.filter((a) => !termo || a.nome.toLowerCase().includes(termo) || (a.apelido ?? "").toLowerCase().includes(termo) || (internos.dados[a.uid] ?? "").toLowerCase().includes(termo));
  const aniversarios = alunos.dados
    .filter((a) => a.dataNascimento)
    .map((a) => ({ a, dias: diasParaAniversario(a.dataNascimento as string, hoje) }))
    .filter((x) => x.dias <= 30)
    .sort((x, y) => x.dias - y.dias);
  const paradosNaFaixa = alunos.dados.filter((a) => a.faixa !== "Preta" && a.faixaDesde && mesesEntre(a.faixaDesde, hoje) >= limite);

  async function rodar(onde: Onde, acao: () => Promise<void>, ok: string, depois?: () => void) {
    setAviso({ onde, texto: "Salvando…" });
    try {
      await acao();
      setAviso({ onde, texto: ok });
      depois?.();
    } catch (err) {
      setAviso({ onde, texto: mensagemErro(err) });
    }
  }

  async function criar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const g = (k: string) => String(f.get(k) ?? "").trim();
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
      turmas: tipo === "professor" ? f.getAll("turmas").map(String) : [],
    };
    const pw = senha.trim();
    const falha = (texto: string) => setAviso({ onde: "cadastro", texto });
    const faltam: string[] = [];
    if (!dados.nome) faltam.push("nome completo");
    if (tipo === "aluno" && !dados.academia) faltam.push("turma (se a lista estiver vazia, crie as turmas na seção 1)");
    if (!dados.email && dados.celular.replace(/\D/g, "").length < 10) faltam.push("e-mail ou celular com DDD");
    if (pw.length < 6) faltam.push("senha provisória com 6 ou mais caracteres (use o botão “Gerar senha”)");
    if (faltam.length) return falha(`Falta preencher: ${faltam.join("; ")}.`);
    setOcupado(true);
    setAviso({ onde: "cadastro", texto: "Criando a conta…" });
    try {
      const { login } = await criarConta(dados, pw);
      setEntregue({ nome: dados.nome, login, senha: pw });
      setAviso({ onde: "cadastro", texto: "Conta criada. Anote o login e a senha abaixo." });
      form.reset();
      setSenha("");
      alunos.recarregar();
      internos.recarregar();
      professores.recarregar();
    } catch (err) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "";
      falha(code === "auth/email-already-in-use" ? "Já existe uma conta com esse e-mail ou celular." : code === "auth/weak-password" ? "Senha fraca: use pelo menos 6 caracteres." : mensagemErro(err));
    }
    setOcupado(false);
  }

  function novaTurma(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const nome = String(new FormData(form).get("nome") ?? "").trim();
    if (!nome) return setAviso({ onde: "turmas", texto: "Escreva o nome da turma." });
    if (turmas.dados.some((t) => t.nome.toLowerCase() === nome.toLowerCase())) return setAviso({ onde: "turmas", texto: "Essa turma já existe." });
    void rodar("turmas", () => addTurma(nome), `Turma “${nome}” criada.`, () => (form.reset(), turmas.recarregar()));
  }

  function guardarProfessor(e: React.FormEvent<HTMLFormElement>, p: Aluno) {
    e.preventDefault();
    const marcadas = new FormData(e.currentTarget).getAll("turmas").map(String);
    void rodar("professores", () => salvarTurmasProfessor(p.uid, marcadas), `Turmas de ${p.nome} salvas.`, professores.recarregar);
  }

  return (
    <>
      {!ehAdmin && (
        <p className="form-help">
          {escopo && escopo.length > 0 ? `Você vê os alunos das turmas: ${escopo.join(", ")}.` : "Você ainda não foi vinculado a nenhuma turma. Peça ao administrador."} Só o administrador cadastra alunos e muda faixas.
        </p>
      )}

      {ehAdmin && (
        <section className="panel" id="turmas">
          <h2>1. Turmas</h2>
          <p className="lead">Crie primeiro as turmas, mesmo vazias. Depois você escolhe a turma de cada aluno e as turmas de cada professor. Não mude o nome de uma turma depois de usar.</p>
          <form className="form inline" onSubmit={novaTurma}>
            <input name="nome" type="text" maxLength={60} placeholder="Ex.: Três Rios" aria-label="Nome da nova turma" autoComplete="off" />
            <button className="btn btn-primary" type="submit">
              Criar turma
            </button>
          </form>
          <Aviso aviso={aviso} onde="turmas" />
          <ul className="manage">
            {turmas.dados.length === 0 && <li className="empty">Nenhuma turma ainda. Crie a primeira acima.</li>}
            {turmas.dados.map((t) => (
              <li key={t.id}>
                <strong>{t.nome}</strong>
                <button
                  className="btn btn-ghost"
                  onClick={() => window.confirm(`Apagar a turma “${t.nome}”? Os alunos dela continuam cadastrados, mas ficam sem turma na lista.`) && void rodar("turmas", () => apagarTurma(t.id), "Turma apagada.", turmas.recarregar)}
                >
                  Apagar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ehAdmin && (
        <section className="panel" id="professores">
          <h2>2. Professores e suas turmas</h2>
          <p className="lead">Cada professor vê só os alunos e os resultados das turmas marcadas aqui.</p>
          <Aviso aviso={aviso} onde="professores" />
          {professores.dados.length === 0 && <p className="empty">Nenhum professor cadastrado ainda. Crie a conta dele na seção 3, escolhendo “Professor”.</p>}
          {professores.dados.map((p) => (
            <form key={p.uid + (p.turmas ?? []).join()} className="tedit" onSubmit={(e) => guardarProfessor(e, p)}>
              <strong>{p.nome}</strong>
              <small>Login: {semCel(p.login)}</small>
              <div className="checks">
                {turmas.dados.length === 0 && <small>Crie turmas na seção 1 para poder marcá-las aqui.</small>}
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
        </section>
      )}

      {ehAdmin && (
        <section className="panel" id="cadastro">
          <h2>3. Cadastrar aluno ou professor</h2>
          <Aviso aviso={aviso} onde="cadastro" />
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
          <form className="form" onSubmit={criar}>
            <p className="form-help">Campos com * são obrigatórios. A data de nascimento é opcional (serve para idade, categoria de campeonato e aniversários).</p>

            <fieldset className="passo">
              <legend>
                <b>1</b> Quem é
              </legend>
              <div className="field">
                <label htmlFor="al-papel">É aluno ou professor? *</label>
                <select id="al-papel" value={tipo} onChange={(e) => setTipo(e.target.value as "aluno" | "professor")}>
                  <option value="aluno">Aluno</option>
                  <option value="professor">Professor</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="al-nome">Nome completo *</label>
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
              <div className="field">
                <label htmlFor="al-nasc">Data de nascimento (opcional)</label>
                <input id="al-nasc" name="nasc" type="date" max={hojeISO()} />
              </div>
            </fieldset>

            <fieldset className="passo">
              <legend>
                <b>2</b> No judô
              </legend>
              <div className="field">
                <label htmlFor="al-faixa">Faixa *</label>
                <select id="al-faixa" name="faixa" defaultValue="Branca">
                  {faixas.map((f) => (
                    <option key={f.nome}>{f.nome}</option>
                  ))}
                </select>
              </div>
              {tipo === "aluno" ? (
                <div className="field">
                  <label htmlFor="al-academia">Turma *</label>
                  <select id="al-academia" name="academia" defaultValue="">
                    <option value="">Escolha…</option>
                    {turmas.dados.map((t) => (
                      <option key={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="checks">
                  <strong>Turmas que este professor pode ver</strong>
                  {turmas.dados.map((t) => (
                    <label key={t.id}>
                      <input type="checkbox" name="turmas" value={t.nome} /> {t.nome}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <fieldset className="passo">
              <legend>
                <b>3</b> Como a pessoa entra
              </legend>
              <p className="form-help">Preencha o e-mail ou o celular (pelo menos um). A pessoa entra com ele.</p>
              <div className="two">
                <div className="field">
                  <label htmlFor="al-email">E-mail</label>
                  <input id="al-email" name="email" type="email" autoComplete="off" />
                </div>
                <div className="field">
                  <label htmlFor="al-cel">Celular com DDD</label>
                  <input id="al-cel" name="celular" type="tel" inputMode="tel" autoComplete="off" placeholder="(24) 99999-9999" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="al-senha">Senha provisória *</label>
                <div className="inline">
                  <input id="al-senha" type="text" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="off" />
                  <button type="button" className="btn btn-ghost" onClick={() => setSenha(senhaProvisoria())}>
                    Gerar senha
                  </button>
                </div>
              </div>
            </fieldset>

            <button className="btn btn-primary" type="submit" disabled={ocupado}>
              {ocupado ? "Criando…" : "Criar conta"}
            </button>
          </form>
        </section>
      )}

      <section className="panel" id="alunos">
        <h2>{ehAdmin ? "4. " : ""}Alunos cadastrados</h2>
        <Aviso aviso={aviso} onde="alunos" />
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
                  {a.academia}
                  {a.dataNascimento ? ` · ${idade(a.dataNascimento, hoje)} anos · campeonato ${hoje.getFullYear()}: ${anoCampeonato(a.dataNascimento, hoje)} anos` : ""}
                  {a.faixaDesde ? ` · na faixa desde ${dataBR(a.faixaDesde)}` : ""}
                </small>
                <small>Login: {semCel(a.login)}</small>
                {ehAdmin && (
                  <select
                    className="mini"
                    aria-label={`Turma de ${a.nome}`}
                    value={a.academia ?? ""}
                    onChange={(e) => e.target.value !== a.academia && void rodar("alunos", () => mudarTurma(a.uid, e.target.value), `${a.apelido || a.nome} agora é da turma ${e.target.value}.`, alunos.recarregar)}
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
                    onBlur={(e) => e.target.value.trim() !== (internos.dados[a.uid] ?? "") && void rodar("alunos", () => salvarInterno(a.uid, e.target.value), "Apelido interno salvo.", internos.recarregar)}
                  />
                )}
              </span>
              <select
                aria-label={`Faixa de ${a.nome}`}
                disabled={!ehAdmin}
                value={a.faixa}
                onChange={(e) => e.target.value !== a.faixa && void rodar("alunos", () => mudarFaixa(a.uid, e.target.value), `${a.apelido || a.nome} agora é faixa ${e.target.value.toLowerCase()}.`, alunos.recarregar)}
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

      <section className="panel" id="faixas">
        <h2>{ehAdmin ? "5. " : ""}Aniversários e tempo na faixa</h2>
        <h3 className="sub">Aniversariantes dos próximos 30 dias ({aniversarios.length})</h3>
        <ul className="manage">
          {aniversarios.length === 0 && <li className="empty">Nenhum aniversário nos próximos 30 dias.</li>}
          {aniversarios.map(({ a, dias }) => (
            <li key={a.uid}>
              <span>
                <strong>{a.apelido || a.nome}</strong>
                <small>
                  {dias === 0 ? "Hoje!" : dias === 1 ? "Amanhã" : `Em ${dias} dias`} · {dataBR(a.dataNascimento as string).slice(0, 5)} · faz {idade(a.dataNascimento as string, parseISO(hojeISO())) + 1} anos · {a.academia}
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
                  Faixa {a.faixa.toLowerCase()} há {mesesEntre(a.faixaDesde as string, hoje)} meses · {a.academia}
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
