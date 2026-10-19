"use client";

import { signOut, updatePassword } from "firebase/auth";
import { useState } from "react";
import { anoCampeonato, dataBR, hojeISO, idade, indiceFaixa } from "../lib/aluno";
import { addMedida, addNota, apagarSub, confirmarSenhaTrocada, lerAluno, lerMedidas, lerNotas, lerResultados, type Medida, type Nota, type Resultado } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { useConfigTecnicas } from "../lib/conteudo";
import { corDaFaixa, faixas } from "../lib/faixas";
import { getAuthInstance } from "../lib/firebase";
import { faixaEfetiva, tecnicas } from "../lib/tecnicas";
import { useAuth } from "../lib/useAuth";
import { useCarga } from "../lib/useCarga";
import LineChart from "./LineChart";
import LinkBtns from "./LinkBtns";
import LoginForm from "./LoginForm";

const VAZIO_M: Medida[] = [];
const VAZIO_N: Nota[] = [];
const VAZIO_R: Resultado[] = [];

const numero = (v: FormDataEntryValue | null): number | null => {
  const t = String(v ?? "").trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : NaN;
};

export default function Perfil() {
  const { carregando, user, perfil } = useAuth();

  if (carregando) return <p className="form-help">Verificando seu acesso…</p>;
  if (!user) return <LoginForm destino="/perfil" />;
  if (!perfil) {
    return (
      <>
        <p className="notice" role="alert">
          Sua conta ainda não foi liberada pelo professor. Peça a ele para concluir o seu cadastro.
        </p>
        <button className="btn btn-ghost" onClick={() => signOut(getAuthInstance())}>
          Sair
        </button>
      </>
    );
  }
  return <Conteudo uid={user.uid} />;
}

function Conteudo({ uid }: { uid: string }) {
  const { perfilCompleto } = usePerfil(uid);
  const medidas = useCarga(() => lerMedidas(uid), VAZIO_M);
  const notas = useCarga(() => lerNotas(uid), VAZIO_N);
  const resultados = useCarga(() => lerResultados(uid), VAZIO_R);
  const { mapa } = useConfigTecnicas();
  const [msg, setMsg] = useState("");

  const hoje = new Date();
  const p = perfilCompleto.dados;

  async function guardar(acao: () => Promise<void>, ok: string, depois: () => void) {
    setMsg("");
    try {
      await acao();
      setMsg(ok);
      depois();
    } catch (e) {
      setMsg(mensagemErro(e));
    }
  }

  function novaMedida(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const peso = numero(f.get("peso"));
    const altura = numero(f.get("altura"));
    const data = String(f.get("data") ?? "");
    if (Number.isNaN(peso) || Number.isNaN(altura) || (peso === null && altura === null) || !data) return setMsg("Informe o peso (kg) e/ou a altura (cm) com números válidos.");
    if ((peso !== null && (peso < 10 || peso > 300)) || (altura !== null && (altura < 50 || altura > 250))) return setMsg("Confira os valores: peso em kg e altura em cm.");
    void guardar(() => addMedida(uid, { data, peso, altura }), "Medida registrada.", () => {
      form.reset();
      medidas.recarregar();
    });
  }

  function novaNota(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const texto = String(f.get("texto") ?? "").trim();
    const data = String(f.get("data") ?? "");
    if (!texto || !data) return setMsg("Escreva a anotação e escolha a data.");
    void guardar(() => addNota(uid, { data, texto }), "Anotação salva.", () => {
      form.reset();
      notas.recarregar();
    });
  }

  if (perfilCompleto.carregando) return <p className="form-help">Carregando seu perfil…</p>;
  if (!p) return <p className="notice">Não consegui ler o seu perfil. Tente de novo em instantes.</p>;

  const idx = indiceFaixa(p.faixa);
  const pesos = medidas.dados.filter((m) => typeof m.peso === "number").map((m) => ({ rotulo: dataBR(m.data).slice(0, 5), valor: m.peso as number }));
  const alturas = medidas.dados.filter((m) => typeof m.altura === "number").map((m) => ({ rotulo: dataBR(m.data).slice(0, 5), valor: m.altura as number }));

  const paraTreinar = tecnicas
    .map((t) => ({ ...t, faixa: faixaEfetiva(t, mapa[t.id]).faixa, nota: mapa[t.id]?.nota || t.nota, cfg: mapa[t.id] }))
    .filter((t) => t.faixa && indiceFaixa(t.faixa) >= 0 && indiceFaixa(t.faixa) <= idx + 1);

  return (
    <>
      <div className="perfil-head">
        <span className="perfil-faixa" style={{ background: corDaFaixa(p.faixa) }} aria-hidden="true" />
        <div>
          <h2>{p.apelido || p.nome}</h2>
          <p className="tmeta">
            {p.nome}
            {p.academia ? ` · ${p.academia}` : ""}
          </p>
          <p className="tmeta">
            Faixa {p.faixa.toLowerCase()} · {idade(p.dataNascimento, hoje)} anos · idade de campeonato em {hoje.getFullYear()}: {anoCampeonato(p.dataNascimento, hoje)}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => signOut(getAuthInstance())}>
          Sair
        </button>
      </div>

      {p.precisaTrocarSenha && <TrocarSenha uid={uid} obrigatoria onFeito={perfilCompleto.recarregar} />}

      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}

      <section className="panel">
        <h2>Para treinar</h2>
        {paraTreinar.length === 0 ? (
          <p className="lead">Seu professor ainda não liberou técnicas para a sua faixa.</p>
        ) : (
          <>
            <p className="lead">Técnicas da sua faixa e de todas as anteriores, mais as da próxima faixa.</p>
            {faixas
              .filter((f) => paraTreinar.some((t) => t.faixa === f.nome))
              .map((f) => (
                <div key={f.nome} className="treino-faixa">
                  <h3>
                    <i className="dot" style={{ background: f.cor }} aria-hidden="true" /> Faixa {f.nome.toLowerCase()}
                    {indiceFaixa(f.nome) === idx + 1 ? " (próxima)" : ""}
                  </h3>
                  <ul className="manage">
                    {paraTreinar
                      .filter((t) => t.faixa === f.nome)
                      .map((t) => (
                        <li key={t.id}>
                          <span>
                            <strong>{t.nome}</strong>
                            {t.nota && <small>* {t.nota}</small>}
                          </span>
                          <LinkBtns nome={t.nome} cfg={t.cfg} />
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
          </>
        )}
      </section>

      <section className="panel">
        <h2>Peso e altura</h2>
        <form className="form" onSubmit={novaMedida}>
          <div className="two">
            <div className="field">
              <label htmlFor="m-peso">Peso (kg)</label>
              <input id="m-peso" name="peso" type="text" inputMode="decimal" placeholder="Ex.: 62,5" />
            </div>
            <div className="field">
              <label htmlFor="m-altura">Altura (cm)</label>
              <input id="m-altura" name="altura" type="text" inputMode="decimal" placeholder="Ex.: 131" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="m-data">Data</label>
            <input id="m-data" name="data" type="date" defaultValue={hojeISO()} />
          </div>
          <button className="btn btn-primary" type="submit">
            Registrar
          </button>
        </form>
        <LineChart titulo="Peso" unidade="kg" pontos={pesos} />
        <LineChart titulo="Altura" unidade="cm" pontos={alturas} />
        {medidas.dados.length > 0 && (
          <ul className="manage">
            {[...medidas.dados].reverse().slice(0, 8).map((m) => (
              <li key={m.id}>
                <span>
                  <strong>{dataBR(m.data)}</strong>
                  <small>{[m.peso ? `${m.peso} kg` : "", m.altura ? `${m.altura} cm` : ""].filter(Boolean).join(" · ")}</small>
                </span>
                <button className="btn btn-ghost" onClick={() => window.confirm("Apagar esta medida?") && void guardar(() => apagarSub(uid, "medidas", m.id), "Medida apagada.", medidas.recarregar)}>
                  Apagar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2>Minhas anotações de aula</h2>
        <p className="lead">Só você vê o que escreve aqui.</p>
        <form className="form" onSubmit={novaNota}>
          <div className="field">
            <label htmlFor="n-data">Data</label>
            <input id="n-data" name="data" type="date" defaultValue={hojeISO()} />
          </div>
          <div className="field">
            <label htmlFor="n-texto">O que treinei e aprendi</label>
            <textarea id="n-texto" name="texto" rows={4} maxLength={1500} />
          </div>
          <button className="btn btn-primary" type="submit">
            Salvar anotação
          </button>
        </form>
        <ul className="manage">
          {notas.dados.length === 0 && !notas.carregando && <li className="empty">Nenhuma anotação ainda.</li>}
          {notas.dados.map((n) => (
            <li key={n.id} className="nota">
              <span>
                <strong>{dataBR(n.data)}</strong>
                <small className="pre">{n.texto}</small>
              </span>
              <button className="btn btn-ghost" onClick={() => window.confirm("Apagar esta anotação?") && void guardar(() => apagarSub(uid, "notas", n.id), "Anotação apagada.", notas.recarregar)}>
                Apagar
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Meus simulados</h2>
        <ul className="manage">
          {resultados.dados.length === 0 && !resultados.carregando && <li className="empty">Você ainda não fez nenhum simulado logado.</li>}
          {resultados.dados.slice(0, 15).map((r) => (
            <li key={r.id} className="resultado">
              <details>
                <summary>
                  <strong>{r.titulo}</strong>
                  <small>
                    {dataBR(r.data)} · {r.acertos} de {r.total} ({Math.round((r.acertos / r.total) * 100)}%)
                  </small>
                </summary>
                {r.respostas && r.respostas.length > 0 ? (
                  <ol className="respostas">
                    {r.respostas.map((x, i) => (
                      <li key={i} className={x.acertou ? "ok" : "erro"}>
                        <span>{x.pergunta}</span>
                        <small>
                          Você marcou: {x.marcada} {x.acertou ? "✓" : "✗"}
                          {!x.acertou && ` · Certa: ${x.correta}`}
                        </small>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="form-help">Este resultado não guardou as respostas.</p>
                )}
              </details>
            </li>
          ))}
        </ul>
      </section>

      <TrocarSenha uid={uid} onFeito={perfilCompleto.recarregar} />
    </>
  );
}

function usePerfil(uid: string) {
  const perfilCompleto = useCarga(() => lerAluno(uid), null);
  return { perfilCompleto };
}

function TrocarSenha({ uid, obrigatoria, onFeito }: { uid: string; obrigatoria?: boolean; onFeito: () => void }) {
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function trocar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const nova = String(f.get("nova") ?? "");
    const rep = String(f.get("rep") ?? "");
    if (nova.length < 6) return setMsg("A senha precisa ter pelo menos 6 caracteres.");
    if (nova !== rep) return setMsg("As duas senhas não são iguais.");
    const u = getAuthInstance().currentUser;
    if (!u) return setMsg("Entre de novo para trocar a senha.");
    setOcupado(true);
    try {
      await updatePassword(u, nova);
      await confirmarSenhaTrocada(uid).catch(() => undefined);
      setMsg("Senha trocada.");
      form.reset();
      onFeito();
    } catch (err) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "";
      setMsg(code === "auth/requires-recent-login" ? "Por segurança, saia, entre de novo e tente trocar a senha." : mensagemErro(err));
    }
    setOcupado(false);
  }

  return (
    <section className={"panel" + (obrigatoria ? " panel-alerta" : "")}>
      <h2>{obrigatoria ? "Troque a sua senha provisória" : "Trocar senha"}</h2>
      {obrigatoria && <p className="lead">Sua senha foi criada pelo professor. Escolha uma nova, só sua.</p>}
      <form className="form" onSubmit={trocar}>
        <div className="field">
          <label htmlFor="s-nova">Nova senha</label>
          <input id="s-nova" name="nova" type="password" autoComplete="new-password" />
        </div>
        <div className="field">
          <label htmlFor="s-rep">Repita a nova senha</label>
          <input id="s-rep" name="rep" type="password" autoComplete="new-password" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={ocupado}>
          Trocar senha
        </button>
      </form>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
    </section>
  );
}
