"use client";

import { useState } from "react";
import { anoCampeonato, dataBR, diasParaAniversario, hojeISO, idade, mesesEntre, parseISO, senhaProvisoria, type Aluno } from "../lib/aluno";
import { criarConta, lerInternos, listarAlunos, mudarFaixa, salvarInterno } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { corDaFaixa, faixas } from "../lib/faixas";
import { useCarga } from "../lib/useCarga";

const ACADEMIAS = ["Dojô Alcântara", "Judô Clube Denis", "Turma do Michel"];
const VAZIO_A: Aluno[] = [];
const VAZIO_I: Record<string, string> = {};

type Entregue = { nome: string; login: string; senha: string };

export default function AdminAlunos({ ehAdmin }: { ehAdmin: boolean }) {
  const alunos = useCarga(listarAlunos, VAZIO_A);
  const internos = useCarga(lerInternos, VAZIO_I);
  const [busca, setBusca] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [entregue, setEntregue] = useState<Entregue | null>(null);
  const [senha, setSenha] = useState("");
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
    const dados = {
      nome: g("nome"),
      apelido: g("apelido"),
      apelidoInterno: g("interno"),
      dataNascimento: g("nasc"),
      faixa: g("faixa"),
      academia: g("academia"),
      email: g("email"),
      celular: g("celular"),
      papel: g("papel") === "professor" ? ("professor" as const) : ("aluno" as const),
    };
    const pw = senha.trim();
    if (!dados.nome || !dados.dataNascimento || !dados.faixa) return setMsg("Preencha nome completo, data de nascimento e faixa.");
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
    } catch (err) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "";
      setMsg(code === "auth/email-already-in-use" ? "Já existe uma conta com esse e-mail ou celular." : code === "auth/weak-password" ? "Senha fraca: use pelo menos 6 caracteres." : mensagemErro(err));
    }
    setOcupado(false);
  }

  async function trocarFaixa(a: Aluno, faixa: string) {
    if (faixa === a.faixa) return;
    setMsg("");
    try {
      await mudarFaixa(a.uid, faixa);
      setMsg(`${a.apelido || a.nome} agora é faixa ${faixa.toLowerCase()}.`);
      alunos.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  async function guardarInterno(a: Aluno, valor: string) {
    if (valor.trim() === (internos.dados[a.uid] ?? "")) return;
    try {
      await salvarInterno(a.uid, valor);
      setMsg("Apelido interno salvo.");
      internos.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  return (
    <section className="panel" id="alunos">
      <h2>Alunos</h2>

      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}

      {entregue && (
        <div className="entrega" role="status">
          <strong>Conta criada para {entregue.nome}</strong>
          <p>
            Login: <b>{entregue.login.endsWith("@celular.dojoalcantara.app") ? entregue.login.split("@")[0] + " (celular)" : entregue.login}</b>
          </p>
          <p>
            Senha provisória: <b className="mono">{entregue.senha}</b>
          </p>
          <p className="form-help">Passe estes dados ao aluno agora. Esta senha não aparece de novo. No primeiro acesso ele será convidado a trocá-la.</p>
          <button className="btn btn-ghost" onClick={() => setEntregue(null)}>
            Já anotei
          </button>
        </div>
      )}

      {!ehAdmin && <p className="form-help">Só o administrador cadastra alunos e muda faixas. Você pode consultar a lista, os aniversários e o tempo de cada um na faixa.</p>}

      {ehAdmin && (
      <details className="novo">
        <summary>Cadastrar aluno</summary>
        <form className="form" onSubmit={criar}>
          <div className="field">
            <label htmlFor="al-nome">Nome completo</label>
            <input id="al-nome" name="nome" type="text" maxLength={100} autoComplete="off" />
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="al-apelido">Apelido (todos veem)</label>
              <input id="al-apelido" name="apelido" type="text" maxLength={40} autoComplete="off" />
            </div>
            {ehAdmin && (
              <div className="field">
                <label htmlFor="al-interno">Apelido interno (só a equipe vê)</label>
                <input id="al-interno" name="interno" type="text" maxLength={40} autoComplete="off" />
              </div>
            )}
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
          <div className="field">
            <label htmlFor="al-academia">Academia ou turma</label>
            <input id="al-academia" name="academia" type="text" list="academias" defaultValue={ACADEMIAS[0]} maxLength={60} />
            <datalist id="academias">
              {ACADEMIAS.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </div>
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
          <p className="form-help">O aluno entra com o e-mail, ou com o celular se não houver e-mail.</p>
          {ehAdmin && (
            <div className="field">
              <label htmlFor="al-papel">Tipo de conta</label>
              <select id="al-papel" name="papel" defaultValue="aluno">
                <option value="aluno">Aluno</option>
                <option value="professor">Professor</option>
              </select>
            </div>
          )}
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
                  {dias === 0 ? "Hoje!" : dias === 1 ? "Amanhã" : `Em ${dias} dias`} · {dataBR(a.dataNascimento).slice(0, 5)} · faz {idade(a.dataNascimento, parseISO(hojeISO())) + 1} anos
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
                  Faixa {a.faixa.toLowerCase()} há {mesesEntre(a.faixaDesde as string, hoje)} meses
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
              <small>Login: {a.login?.endsWith("@celular.dojoalcantara.app") ? a.login.split("@")[0] + " (celular)" : a.login}</small>
              {ehAdmin && (
                <input
                  className="mini"
                  type="text"
                  aria-label={`Apelido interno de ${a.nome}`}
                  placeholder="Apelido interno"
                  defaultValue={internos.dados[a.uid] ?? ""}
                  key={a.uid + (internos.dados[a.uid] ?? "")}
                  onBlur={(e) => void guardarInterno(a, e.target.value)}
                />
              )}
            </span>
            <select aria-label={`Faixa de ${a.nome}`} disabled={!ehAdmin} value={a.faixa} onChange={(e) => void trocarFaixa(a, e.target.value)} style={{ borderLeft: `8px solid ${corDaFaixa(a.faixa)}` }}>
              {faixas.map((f) => (
                <option key={f.nome}>{f.nome}</option>
              ))}
            </select>
          </li>
        ))}
      </ul>
      {lista.length > 40 && <p className="form-help">Mostrando 40 de {lista.length}. Use a busca para achar os outros.</p>}
      <p className="form-help">Para trocar a senha de um aluno ou apagar uma conta: Firebase → Authentication → Usuários.</p>
    </section>
  );
}
