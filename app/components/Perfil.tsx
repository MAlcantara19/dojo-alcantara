"use client";

import { EmailAuthProvider, reauthenticateWithCredential, signOut, updatePassword, verifyBeforeUpdateEmail } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { anoCampeonato, dataBR, hojeISO, idade, indiceFaixa, mesesEntre, type Aluno } from "../lib/aluno";
import { addMedida, addNota, apagarSub, atualizarLoginProprio, atualizarMeuCadastro, atualizarNomeConta, confirmarSenhaTrocada, lerAluno, lerAvisosTurma, lerMedidas, lerMinhaTurma, lerNotas, lerResultados, type AvisoTurma, type Medida, type Nota, type Resultado, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { useTecnicas } from "../lib/conteudo";
import { corDaFaixa, faixaPorExtenso, faixas } from "../lib/faixas";
import { getAuthInstance } from "../lib/firebase";
import { faixaEfetiva } from "../lib/tecnicas";
import { useAuth } from "../lib/useAuth";
import { useCarga } from "../lib/useCarga";
import { ABAS_PERFIL } from "../lib/abasPerfil";
import { podeVer, useAcessoTecnicas } from "../lib/acesso";
import { guardarAniversario } from "../lib/aniversarios";
import { avisoValido } from "../lib/hoje";
import { minhasPresencas, type Chamada } from "../lib/chamadas";
import { calcularGraus } from "../lib/graus";
import { lerCampeonatos, type Campeonato } from "../lib/campeonatos";
import { calcularConquistas } from "../lib/conquistas";
import { calcularDevido, minhasMensalidades, nomeMes, real, type Mensalidade } from "../lib/mensalidades";
import { useSite } from "../lib/siteConfig";
import { classeDeIdade } from "../lib/categorias";
import BotaoNotificacoes from "./BotaoNotificacoes";
import ChecklistFaixa from "./ChecklistFaixa";
import TabelaPesos from "./TabelaPesos";
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
import Recolhivel from "./Recolhivel";

const VAZIO_AV: AvisoTurma[] = [];
const VAZIO_CH: Chamada[] = [];
const VAZIO_CAMP: Campeonato[] = [];
const VAZIO_MENS: Mensalidade[] = [];
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
  const presencas = useCarga(() => minhasPresencas(uid), VAZIO_CH);
  const site = useSite();
  const camps = useCarga(() => lerCampeonatos(uid), VAZIO_CAMP);
  const usaMensalidade = site.mensalidadeValor > 0 && !site.abasOcultas.includes("mensalidades");
  const mens = useCarga(() => minhasMensalidades(uid), VAZIO_MENS, usaMensalidade);
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
        <Avatar url={p.foto} ajuste={p.fotoAjuste} nome={p.apelido || p.nome} faixa={p.faixa} dan={p.dan} tamanho={88} />
        <div>
          <h2>{p.apelido || p.nome}</h2>
          <p className="tmeta">
            {p.nome}
            {p.academia ? ` · ${p.academia}` : ""}
          </p>
          <p className="tmeta">
            {p.faixa ? `Faixa ${faixaPorExtenso(p.faixa, p.dan).toLowerCase()}` : ""}{p.dataNascimento ? ` · ${idade(p.dataNascimento, hoje)} anos · idade de campeonato em ${hoje.getFullYear()}: ${anoCampeonato(p.dataNascimento, hoje)}` : ""}
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
            {avisosTurma.dados.filter((a) => avisoValido(a, hojeISO())).slice(0, 8).map((a) => (
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
        {!equipe && p.faixa && p.faixa !== "Preta" && (() => {
          const g = calcularGraus(presencas.dados.map((c) => c.data), p.faixaDesde, site.aulasPorGrau, site.grausPorFaixa);
          return (
            <div className="graus">
              <div className="faixa-graus" aria-label={`Faixa ${p.faixa.toLowerCase()} com ${g.graus} de ${g.total} graus`}>
                <span className="cor" style={{ background: corDaFaixa(p.faixa) }} />
                <span className="ponta">
                  {Array.from({ length: g.total }, (_, i) => (
                    <i key={i} className={i < g.graus ? "on" : ""} />
                  ))}
                </span>
              </div>
              {g.pronto ? (
                <p className="pronto-exame">🎉 Você completou os {g.total} graus! Fale com o professor sobre a avaliação para a próxima faixa.</p>
              ) : (
                <p className="form-help">
                  {g.graus} de {g.total} graus · faltam {g.faltam} {g.faltam === 1 ? "aula" : "aulas"} com presença para o próximo grau ({g.porGrau} aulas por grau, contando desde que você está nesta faixa).
                </p>
              )}
            </div>
          );
        })()}
        {!equipe && (() => {
          const g = calcularGraus(presencas.dados.map((c) => c.data), p.faixaDesde, site.aulasPorGrau, site.grausPorFaixa);
          const lista = calcularConquistas({ presencas: presencas.dados.length, simulados: resultados.dados, graus: g.graus, grausTotal: g.total, checklist100: false, campeonatos: camps.dados });
          const feitas = lista.filter((c) => c.ok).length;
          return (
            <details className="conquistas" open>
              <summary>
                🏅 Minhas conquistas · {feitas} de {lista.length}
              </summary>
              <div className="conquistas-grade">
                {lista.map((c) => (
                  <div key={c.nome} className={"conquista" + (c.ok ? " ok" : "")} title={c.desc}>
                    <span aria-hidden="true">{c.ok ? c.icone : "🔒"}</span>
                    <b>{c.nome}</b>
                    <small>{c.desc}</small>
                  </div>
                ))}
              </div>
            </details>
          );
        })()}
        {!equipe && usaMensalidade && !mens.carregando && (() => {
          const hoje = hojeISO();
          const mes = hoje.slice(0, 7);
          const paga = mens.dados.find((m) => m.mes === mes)?.pago;
          if (paga) return <p className="mens-ok">💳 Mensalidade de {nomeMes(mes)}: paga. Obrigado!</p>;
          if (Number(hoje.slice(8, 10)) <= site.vencimentoDia) return <p className="form-help">💳 Mensalidade de {nomeMes(mes)} vence dia {site.vencimentoDia}.</p>;
          const dv = calcularDevido(mes, { valor: site.mensalidadeValor, dia: site.vencimentoDia, multaPct: site.multaPct, jurosMesPct: site.jurosMesPct }, hoje);
          return (
            <p className="mens-aberta">
              💳 Mensalidade de {nomeMes(mes)} em aberto (venceu dia {site.vencimentoDia}). Valor hoje: {real(dv.total)}{dv.diasAtraso ? `, com ${dv.diasAtraso} dias de atraso` : ""}. Se já pagou, avise o sensei.
            </p>
          );
        })()}
        <p className="presencas">
          ✅ <b>{presencas.dados.length}</b> {presencas.dados.length === 1 ? "aula com presença registrada" : "aulas com presença registrada"}
          {presencas.dados[0] ? ` · última em ${dataBR(presencas.dados[0].data)}` : ""}
        </p>
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
          <h2>Minha categoria de competição</h2>
          {p.sexo === "M" || p.sexo === "F" ? (
            (() => {
              const ultimoPeso = [...medidas.dados].reverse().find((x) => typeof x.peso === "number")?.peso ?? null;
              const ano = Number(hojeISO().slice(0, 4));
              return (
                <>
                  <p className="form-help">Pelo seu último peso registrado e pela sua idade em {ano}.</p>
                  <TabelaPesos classe={classeDeIdade(p.dataNascimento, ano)} sexo={p.sexo} peso={ultimoPeso} />
                </>
              );
            })()
          ) : (
            <p className="empty">Informe o sexo em Cadastro e senha (e a data de nascimento) para ver a sua categoria na tabela de pesos.</p>
          )}
        </section>
      )}
      {aba === "corpo" && (
      <section className="panel">
        <h2>Peso e altura</h2>
        <Recolhivel titulo="Registrar peso e altura">
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
</Recolhivel>
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
        <Recolhivel titulo="Nova anotação">
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
</Recolhivel>
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

      {aba === "checklist" && (
        <section className="panel">
          <h2>Checklist da faixa</h2>
          <ChecklistFaixa uid={uid} nome={p.apelido || p.nome} faixasLiberadas={acesso.todas ? faixas.map((f) => f.nome) : Array.from(acesso.liberadas)} faixaInicial={faixas[idx + 1]?.nome ?? p.faixa} />
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
          <GaleriaAluno uid={uid} autor={p.apelido || p.nome} avisarAdmin={!equipe} turma={p.academia} />
        </section>
      )}
      {aba === "conta" && (
        <>
          <section className="panel">
            <h2>Notificações</h2>
            <p className="lead">Receba no celular os avisos do dojô e da sua turma, mesmo com o site fechado.</p>
            <BotaoNotificacoes />
          </section>
          <section className="panel">
            <h2>Minhas fotos</h2>
            <FotosConta a={p} onSalvo={perfilCompleto.recarregar} avisarAdmin={!equipe} />
          </section>
          <MeuCadastro uid={uid} p={p} onFeito={perfilCompleto.recarregar} />
          <TrocarEmail uid={uid} p={p} onFeito={perfilCompleto.recarregar} />
          <TrocarSenha uid={uid} onFeito={perfilCompleto.recarregar} aluno={!equipe} nome={p.apelido || p.nome} turma={p.academia} />
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
      const novo = { apelido: g("apelido"), email, celular: g("celular").replace(/\D/g, ""), dataNascimento: g("nasc"), sexo: (g("sexo") === "M" || g("sexo") === "F" ? g("sexo") : "") as "M" | "F" | "", responsavel: g("responsavel"), telResponsavel: g("telResponsavel").replace(/\D/g, ""), autorizaImagem: (g("autorizaImagem") === "sim" || g("autorizaImagem") === "nao" ? g("autorizaImagem") : "") as "sim" | "nao" | "" };
      await atualizarMeuCadastro(uid, novo);
      if (p.papel === "admin" && g("nome") && g("nome") !== p.nome) await atualizarNomeConta(uid, g("nome"));
      await guardarAniversario(uid, p.nome, novo.apelido, novo.dataNascimento).catch(() => undefined);
      const nomes: Record<string, string> = { apelido: "apelido", email: "e-mail", celular: "celular", dataNascimento: "data de nascimento", sexo: "sexo", responsavel: "responsável", telResponsavel: "telefone do responsável", autorizaImagem: "autorização de imagem" };
      const mudou = (Object.keys(novo) as (keyof typeof novo)[]).filter((k) => (p[k] ?? "") !== novo[k]);
      if (p.papel === "aluno" && mudou.length) void registrarAtividade(uid, p.apelido || p.nome, `mudou ${mudou.map((k) => nomes[k]).join(", ")}${mudou.includes("apelido") ? ` (apelido agora: “${novo.apelido}”)` : ""}`, p.academia ?? "");
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
      <form className="form" onSubmit={(e) => void salvar(e)} key={`${p.apelido}${p.email}${p.celular}${p.dataNascimento}${p.sexo}${p.responsavel}${p.autorizaImagem}`}>
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
          <label>Sexo (para a tabela de pesos)</label>
          <select name="sexo" defaultValue={p.sexo ?? ""}>
            <option value="">Não informado</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
          </div>
        <div className="field">
          <label htmlFor="mc-nasc">Data de nascimento</label>
          <input id="mc-nasc" name="nasc" type="date" max={hojeISO()} defaultValue={p.dataNascimento ?? ""} />
        </div>
        <fieldset className="passo">
          <legend>Responsável e uso de imagem</legend>
          <p className="form-help">Para alunos menores de idade. Ajuda a saber quem chamar e se pode aparecer em fotos e vídeos.</p>
          <div className="two">
            <div className="field">
              <label>Nome do responsável</label>
              <input name="responsavel" type="text" maxLength={100} defaultValue={p.responsavel ?? ""} autoComplete="off" />
            </div>
            <div className="field">
              <label>Telefone do responsável</label>
              <input name="telResponsavel" type="tel" inputMode="tel" maxLength={20} defaultValue={p.telResponsavel ?? ""} autoComplete="off" />
            </div>
          </div>
          <div className="field">
            <label>Autoriza o uso de imagem (fotos e vídeos do dojô)?</label>
            <select name="autorizaImagem" defaultValue={p.autorizaImagem ?? ""}>
              <option value="">Não informado</option>
              <option value="sim">Sim, autoriza</option>
              <option value="nao">Não autoriza</option>
            </select>
          </div>
          </fieldset>
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

/** Trocar o e-mail de entrada: o Firebase manda um link para o e-mail novo; ao confirmar, a troca vale. */
function TrocarEmail({ uid, p, onFeito }: { uid: string; p: Aluno; onFeito: () => void }) {
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const atual = getAuthInstance().currentUser?.email ?? "";

  // Depois que a pessoa confirma o link, o login novo passa a valer: atualiza o cadastro.
  useEffect(() => {
    if (atual && p.login && atual !== p.login) void atualizarLoginProprio(uid, atual).then(onFeito).catch(() => undefined);
  }, [atual, p.login, uid, onFeito]);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const novo = String(f.get("novo") ?? "").trim().toLowerCase();
    const senha = String(f.get("senha") ?? "");
    const u = getAuthInstance().currentUser;
    if (!u || !u.email) return setMsg("Entre de novo para continuar.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novo)) return setMsg("Esse e-mail não parece certo. Confira.");
    if (!senha) return setMsg("Digite a sua senha atual para confirmar que é você.");
    setOcupado(true);
    setMsg("Enviando…");
    try {
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, senha));
      await verifyBeforeUpdateEmail(u, novo);
      if (p.papel === "aluno") void registrarAtividade(uid, p.apelido || p.nome, `pediu para trocar o e-mail de entrada para ${novo}`, p.academia ?? "");
      setMsg(`Enviamos um link para ${novo}. Abra esse e-mail e toque no link: a partir daí você entra com o e-mail novo (a senha continua a mesma). Olhe também o spam.`);
      form.reset();
    } catch (err) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "";
      setMsg(code === "auth/wrong-password" || code === "auth/invalid-credential" ? "Senha atual errada." : code === "auth/email-already-in-use" ? "Esse e-mail já é usado por outra conta." : mensagemErro(err));
    }
    setOcupado(false);
  }

  return (
    <section className="panel">
      <h2>E-mail de entrada</h2>
      <p className="lead">
        Hoje você entra com: <b>{atual.endsWith("@celular.dojoalcantara.app") ? `${atual.split("@")[0]} (celular)` : atual}</b>
      </p>
      <Recolhivel titulo="Trocar o e-mail de entrada">
<form className="form" onSubmit={(e) => void enviar(e)}>
        <div className="field">
          <label htmlFor="te-novo">Novo e-mail para entrar</label>
          <input id="te-novo" name="novo" type="email" autoComplete="email" />
        </div>
        <CampoSenha id="te-senha" name="senha" rotulo="Sua senha atual" />
        <button className="btn btn-primary" type="submit" disabled={ocupado}>
          Enviar link de confirmação
        </button>
        {msg && (
          <p className="form-note" role="status">
            {msg}
          </p>
        )}
      </form>
</Recolhivel>
    </section>
  );
}

function TrocarSenha({ uid, obrigatoria, onFeito, aluno, nome, turma }: { uid: string; obrigatoria?: boolean; onFeito: () => void; aluno?: boolean; nome?: string; turma?: string }) {
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
      if (aluno) void registrarAtividade(uid, nome ?? "Aluno", "trocou a senha", turma ?? "");
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
