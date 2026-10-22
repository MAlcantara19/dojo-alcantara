"use client";

import { signOut, updatePassword } from "firebase/auth";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { anoCampeonato, dataBR, hojeISO, idade, indiceFaixa, mesesEntre, type Aluno } from "../lib/aluno";
import { addMedida, addNota, apagarSub, atualizarMeuCadastro, atualizarNomeConta, confirmarSenhaTrocada, lerAluno, lerAvisosTurma, lerMedidas, lerMinhaTurma, lerNotas, lerResultados, type AvisoTurma, type Medida, type Nota, type Resultado, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { useTecnicas } from "../lib/conteudo";
import { faixas } from "../lib/faixas";
import { getAuthInstance } from "../lib/firebase";
import { faixaEfetiva } from "../lib/tecnicas";
import { useAuth } from "../lib/useAuth";
import { useCarga } from "../lib/useCarga";
import { ABAS_PERFIL } from "../lib/abasPerfil";
import { podeVer, useAcessoTecnicas } from "../lib/acesso";
import { guardarAniversario } from "../lib/aniversarios";
import { registrarAtividade } from "../lib/atividades";
import CampeonatosAluno from "./CampeonatosAluno";
import { estiloFoto } from "../lib/fotoAjuste";
import Avatar from "./Avatar";
import CampoSenha from "./CampoSenha";
import FotosConta from "./FotosConta";
import Img from "./Img";
import RespostasSimulado from "./RespostasSimulado";
import GaleriaAluno from "./GaleriaAluno";
import LineChart from "./LineChart";
import LinkBtns from "./LinkBtns";
import Midia from "./Midia";
import LoginForm from "./LoginForm";

const VAZIO_AV: AvisoTurma[] = [];
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

const assinarHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
function useAba() {
  const h = useSyncExternalStore(assinarHash, () => window.location.hash.slice(1), () => "");
  return ABAS_PERFIL.some(([id]) => id === h) ? h : "resumo";
}

function Conteudo({ uid }: { uid: string }) {
  const aba = useAba();
  const { perfilCompleto } = usePerfil(uid);
  const medidas = useCarga(() => lerMedidas(uid), VAZIO_M);
  const notas = useCarga(() => lerNotas(uid), VAZIO_N);
  const resultados = useCarga(() => lerResultados(uid), VAZIO_R);
  const { mapa, lista: catalogo } = useTecnicas();
  const acesso = useAcessoTecnicas();
  const academia = perfilCompleto.dados?.academia ?? "";
  const minhaTurma = useCarga<Turma | null>(() => lerMinhaTurma(academia), null, Boolean(academia));
  const avisosTurma = useCarga(() => lerAvisosTurma([academia]), VAZIO_AV, Boolean(academia));
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

  const equipe = p.papel !== "aluno";

  const idx = indiceFaixa(p.faixa ?? "");
  const pesos = medidas.dados.filter((m) => typeof m.peso === "number").map((m) => ({ rotulo: dataBR(m.data).slice(0, 5), completo: dataBR(m.data), valor: m.peso as number }));
  const alturas = medidas.dados.filter((m) => typeof m.altura === "number").map((m) => ({ rotulo: dataBR(m.data).slice(0, 5), completo: dataBR(m.data), valor: m.altura as number }));

  const paraTreinar = catalogo
    .map((t) => ({ ...t, faixa: faixaEfetiva(t, mapa[t.id]).faixa, nota: mapa[t.id]?.nota || t.nota, cfg: mapa[t.id] }))
    .filter((t) => podeVer(acesso, t.faixa));

  return (
    <>
      <div className="perfil-banner">{p.banner && <Img src={p.banner} alt="" largura={1400} style={estiloFoto(p.bannerAjuste)} />}</div>
      <div className="perfil-head">
        <Avatar url={p.foto} ajuste={p.fotoAjuste} nome={p.apelido || p.nome} faixa={p.faixa} tamanho={88} />
        <div>
          <h2>{p.apelido || p.nome}</h2>
          <p className="tmeta">
            {p.nome}
            {p.academia ? ` · ${p.academia}` : ""}
          </p>
          <p className="tmeta">
            {p.faixa ? `Faixa ${p.faixa.toLowerCase()}` : ""}{p.dataNascimento ? ` · ${idade(p.dataNascimento, hoje)} anos · idade de campeonato em ${hoje.getFullYear()}: ${anoCampeonato(p.dataNascimento, hoje)}` : ""}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => signOut(getAuthInstance())}>
          Sair
        </button>
      </div>

      <nav className="tabs tabs-scroll perfil-abas" aria-label="Páginas da minha área">
        {ABAS_PERFIL.map(([id, rotulo]) => (
          <a key={id} href={"#" + id} aria-current={aba === id ? "page" : undefined} className={aba === id ? "ativa" : undefined}>
            {rotulo}
          </a>
        ))}
      </nav>

      {aba === "resumo" && equipe && (
        <div className="aviso-dia" role="note">
          <p>
            Este é o seu perfil pessoal (peso, altura, anotações e cadastro). Para editar o site, vá para a área do professor.
          </p>
          <Link className="btn btn-primary" href="/admin">
            Abrir a área do professor
          </Link>
        </div>
      )}

      {p.precisaTrocarSenha && <TrocarSenha uid={uid} obrigatoria onFeito={perfilCompleto.recarregar} />}

      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}

      {aba === "resumo" && academia && (
        <section className="panel">
          <h2>Minha turma{minhaTurma.dados ? `: ${minhaTurma.dados.apelido || minhaTurma.dados.nome}` : ""}</h2>
          {minhaTurma.dados?.descricao && <p>{minhaTurma.dados.descricao}</p>}
          <ul className="manage">
            {minhaTurma.dados?.localNome || minhaTurma.dados?.endereco ? (
              <li>
                <span>
                  <strong>Onde treinar</strong>
                  <small>{minhaTurma.dados?.localNome}</small>
                  <small>{minhaTurma.dados?.endereco}</small>
                </span>
                {minhaTurma.dados?.endereco && (
                  <a className="btn btn-ghost" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(minhaTurma.dados.endereco)}`} target="_blank" rel="noopener noreferrer">
                    📍 Mapa
                  </a>
                )}
              </li>
            ) : null}
            {minhaTurma.dados?.horarios && (
              <li>
                <span>
                  <strong>Horários</strong>
                  <small className="pre">{minhaTurma.dados.horarios}</small>
                </span>
              </li>
            )}
            {minhaTurma.dados?.grupoWhatsApp && (
              <li>
                <span>
                  <strong>Grupo da turma</strong>
                  <small>Avisos e conversa no WhatsApp</small>
                </span>
                <a className="btn btn-ghost" href={minhaTurma.dados.grupoWhatsApp} target="_blank" rel="noopener noreferrer">
                  💬 Entrar
                </a>
              </li>
            )}
          </ul>
          <h3 className="sub">Avisos da turma</h3>
          <ul className="manage">
            {avisosTurma.dados.length === 0 && <li className="empty">Nenhum aviso da sua turma por enquanto.</li>}
            {avisosTurma.dados.slice(0, 8).map((a) => (
              <li key={a.id}>
                <span>
                  <strong>{a.titulo}</strong>
                  <small>{dataBR(a.data)}</small>
                  <small className="pre">{a.texto}</small>
                  <Midia imagem={a.imagem} video={a.video} alt={a.titulo} />
                  {a.autor && <small>Publicado por {a.autor}</small>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {aba === "resumo" && (
      <section className="panel">
        <h2>Meu progresso</h2>
        <div className="resumo-grid">
          {p.faixa && (
            <div className="resumo-card">
              <b>{p.faixa}</b>
              <span>faixa atual{p.faixaDesde ? `, desde ${dataBR(p.faixaDesde)}` : ""}</span>
            </div>
          )}
          {p.faixaDesde && (
            <div className="resumo-card">
              <b>{mesesEntre(p.faixaDesde, hoje)}</b>
              <span>{mesesEntre(p.faixaDesde, hoje) === 1 ? "mês" : "meses"} nesta faixa</span>
            </div>
          )}
          <div className="resumo-card">
            <b>{resultados.dados.length}</b>
            <span>simulados feitos</span>
          </div>
          {resultados.dados.length > 0 && (
            <div className="resumo-card">
              <b>{Math.round((resultados.dados.reduce((s, r) => s + r.acertos, 0) / Math.max(1, resultados.dados.reduce((s, r) => s + r.total, 0))) * 100)}%</b>
              <span>de acertos nos simulados</span>
            </div>
          )}
        </div>
        {p.faixa && idx >= 0 && idx < faixas.length - 1 && <p className="form-help">Próxima faixa: {faixas[idx + 1].nome.toLowerCase()}. Continue treinando e perguntando ao seu professor.</p>}
      </section>
      )}

      {aba === "tecnicas" && (
      <section className="panel">
        <h2>Minhas técnicas</h2>
        <p className="tags-faixas">
          Liberadas para você:{" "}
          {acesso.todas
            ? "todas as faixas"
            : faixas
                .filter((f) => acesso.liberadas.has(f.nome))
                .map((f) => f.nome.toLowerCase())
                .join(", ")}
        </p>
        {paraTreinar.length === 0 ? (
          <p className="lead">Seu professor ainda não liberou técnicas para a sua faixa.</p>
        ) : (
          <>
            <p className="lead">Técnicas da sua faixa, das anteriores e da próxima. Se o professor liberar mais faixas, elas aparecem aqui.</p>
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
      )}

      {aba === "corpo" && (
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
      )}

      {aba === "anotacoes" && (
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
      )}

      {aba === "simulados" && (
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
                <RespostasSimulado respostas={r.respostas} />
              </details>
            </li>
          ))}
        </ul>
      </section>
      )}

      {aba === "campeonatos" && (
        <section className="panel">
          <h2>Meus campeonatos</h2>
          <p className="lead">O professor registra aqui cada campeonato: categoria, chave, lutas e resultado.</p>
          <CampeonatosAluno uid={uid} editavel={equipe} />
        </section>
      )}
      {aba === "galeria" && (
        <section className="panel">
          <h2>Minha galeria</h2>
          <p className="lead">Fotos e vídeos seus: treinos, campeonatos, conquistas. Você e o professor podem colocar.</p>
          <GaleriaAluno uid={uid} autor={p.apelido || p.nome} avisarAdmin={!equipe} />
        </section>
      )}
      {aba === "conta" && (
        <>
          <section className="panel">
            <h2>Minhas fotos</h2>
            <FotosConta a={p} onSalvo={perfilCompleto.recarregar} avisarAdmin={!equipe} />
          </section>
          <MeuCadastro uid={uid} p={p} onFeito={perfilCompleto.recarregar} />
          <TrocarSenha uid={uid} onFeito={perfilCompleto.recarregar} aluno={!equipe} nome={p.apelido || p.nome} />
        </>
      )}
    </>
  );
}

function usePerfil(uid: string) {
  const perfilCompleto = useCarga(() => lerAluno(uid), null);
  return { perfilCompleto };
}

function MeuCadastro({ uid, p, onFeito }: { uid: string; p: Aluno; onFeito: () => void }) {
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const email = g("email").toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMsg("Esse e-mail não parece certo. Confira.");
    setOcupado(true);
    setMsg("Salvando…");
    try {
      const novo = { apelido: g("apelido"), email, celular: g("celular").replace(/\D/g, ""), dataNascimento: g("nasc") };
      await atualizarMeuCadastro(uid, novo);
      if (p.papel === "admin" && g("nome") && g("nome") !== p.nome) await atualizarNomeConta(uid, g("nome"));
      await guardarAniversario(uid, p.nome, novo.apelido, novo.dataNascimento).catch(() => undefined);
      const nomes: Record<string, string> = { apelido: "apelido", email: "e-mail", celular: "celular", dataNascimento: "data de nascimento" };
      const mudou = (Object.keys(novo) as (keyof typeof novo)[]).filter((k) => (p[k] ?? "") !== novo[k]);
      if (p.papel === "aluno" && mudou.length) void registrarAtividade(uid, p.apelido || p.nome, `mudou ${mudou.map((k) => nomes[k]).join(", ")}${mudou.includes("apelido") ? ` (apelido agora: “${novo.apelido}”)` : ""}`);
      setMsg("Cadastro atualizado.");
      onFeito();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
    setOcupado(false);
  }

  return (
    <section className="panel">
      <h2>Meu cadastro</h2>
      <form className="form" onSubmit={(e) => void salvar(e)} key={`${p.apelido}${p.email}${p.celular}${p.dataNascimento}`}>
        <div className="field">
          <label htmlFor="mc-nome">Nome completo{p.papel === "admin" ? " (aparece nas suas publicações)" : ""}</label>
          {p.papel === "admin" ? <input id="mc-nome" name="nome" type="text" maxLength={100} defaultValue={p.nome} autoComplete="name" /> : <input id="mc-nome" type="text" value={p.nome} readOnly aria-readonly="true" />}
        </div>
        <div className="field">
          <label htmlFor="mc-ap">Apelido</label>
          <input id="mc-ap" name="apelido" type="text" maxLength={40} defaultValue={p.apelido ?? ""} autoComplete="off" />
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="mc-em">E-mail para contato</label>
            <input id="mc-em" name="email" type="email" defaultValue={p.email ?? ""} autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="mc-cel">Celular com DDD</label>
            <input id="mc-cel" name="celular" type="tel" inputMode="tel" defaultValue={p.celular ?? ""} autoComplete="tel" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="mc-nasc">Data de nascimento</label>
          <input id="mc-nasc" name="nasc" type="date" max={hojeISO()} defaultValue={p.dataNascimento ?? ""} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={ocupado}>
          Salvar cadastro
        </button>
        {msg && (
          <p className="form-note" role="status">
            {msg}
          </p>
        )}
        <p className="form-help">
          Para entrar você usa: <b>{p.login?.endsWith("@celular.dojoalcantara.app") ? `${p.login.split("@")[0]} (celular)` : p.login}</b>. {p.papel === "admin" ? "Para trocar o e-mail de entrada, use Equipe → Administradores com a outra conta de administrador." : "Para trocar o e-mail ou o celular de entrada, peça ao seu professor. O nome, a faixa e a turma também são o professor que muda."}
        </p>
      </form>
    </section>
  );
}

function TrocarSenha({ uid, obrigatoria, onFeito, aluno, nome }: { uid: string; obrigatoria?: boolean; onFeito: () => void; aluno?: boolean; nome?: string }) {
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
      if (aluno) void registrarAtividade(uid, nome ?? "Aluno", "trocou a senha");
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
        <CampoSenha id="s-nova" name="nova" rotulo="Nova senha" autoComplete="new-password" />
        <CampoSenha id="s-rep" name="rep" rotulo="Repita a nova senha" autoComplete="new-password" />
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
