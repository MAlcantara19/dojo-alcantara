"use client";

import { useState } from "react";
import { anoCampeonato, dataBR, diasParaAniversario, hojeISO, idade, mesesEntre, parseISO, type Aluno } from "../lib/aluno";
import { atualizarAluno, lerInternos, lerTurmas, listarAlunos, salvarInterno, type Escopo, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { corDaFaixa, DANS, faixaPorExtenso, faixas } from "../lib/faixas";
import { guardarAniversario } from "../lib/aniversarios";
import { registrarAtividade } from "../lib/atividades";
import { useAuth } from "../lib/useAuth";
import { useCarga } from "../lib/useCarga";
import AcoesConta from "./AcoesConta";
import FormCadastro, { semCel } from "./FormCadastro";
import CampeonatosAluno from "./CampeonatosAluno";
import GaleriaAluno from "./GaleriaAluno";
import Avatar from "./Avatar";
import FotosConta from "./FotosConta";
import MedidasAluno from "./MedidasAluno";
import MenuSuspenso from "./MenuSuspenso";

const VAZIO_A: Aluno[] = [];
const VAZIO_T: Turma[] = [];
const VAZIO_I: Record<string, string> = {};

export default function AdminAlunos({ ehAdmin, autor = "Professor" }: { ehAdmin: boolean; escopo?: Escopo; autor?: string }) {
  const alunos = useCarga(() => listarAlunos(null), VAZIO_A);
  const { user } = useAuth();
  const turmas = useCarga(lerTurmas, VAZIO_T);
  const internos = useCarga(lerInternos, VAZIO_I, ehAdmin);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [medidas, setMedidas] = useState<string | null>(null);
  const [painel, setPainel] = useState<{ uid: string; tipo: "camp" | "gal" } | null>(null);
  const [senhaDe, setSenhaDe] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const [limite, setLimite] = useState(12);
  const [sec, setSec] = useState<"lista" | "cadastrar" | "aniversarios" | "faixa">("lista");

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
      const novo = { nome: g("nome"), apelido: g("apelido"), dataNascimento: g("nasc"), faixa, faixaDesde: desde, academia: g("academia"), email: g("email").toLowerCase(), celular: g("celular").replace(/\D/g, ""), liberadoAte: g("liberadoAte"), dan: g("faixa") === "Preta" ? Number(g("dan")) || 0 : 0 };
      await atualizarAluno(a.uid, novo);
      if (!ehAdmin && user) {
        const nomes: Record<string, string> = { nome: "nome", apelido: "apelido", dataNascimento: "nascimento", faixa: "faixa", faixaDesde: "data da faixa", academia: "turma", email: "e-mail", celular: "celular", liberadoAte: "técnicas liberadas", dan: "dan" };
        const mudou = (Object.keys(novo) as (keyof typeof novo)[]).filter((k) => String(a[k] ?? (k === "dan" ? 0 : "")) !== String(novo[k]));
        if (mudou.length) void registrarAtividade(user.uid, autor, `editou ${a.apelido || a.nome}: ${mudou.map((k) => nomes[k]).join(", ")}${mudou.includes("faixa") ? ` (faixa ${a.faixa} → ${faixa})` : ""}`, novo.academia || a.academia || "");
      }
      await guardarAniversario(a.uid, g("nome"), g("apelido"), g("nasc")).catch(() => undefined);
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
      <MenuSuspenso
        id="sub-alunos"
        rotulo="O que você quer ver?"
        valor={sec}
        onMudar={setSec}
        opcoes={[
          ["lista", `Alunos cadastrados (${alunos.dados.length})`],
          ...(ehAdmin ? ([["cadastrar", "Cadastrar aluno"]] as ["cadastrar", string][]) : []),
          ["aniversarios", `Aniversários (${aniversarios.length} nos próximos 30 dias)`],
          ["faixa", "Tempo na faixa"],
        ]}
      />
      {sec === "lista" && !ehAdmin && (
        <p className="form-help">
           Você pode editar qualquer aluno; o que você mudar fica registrado para o administrador.
        </p>
      )}

      {sec === "cadastrar" && ehAdmin && (
        <section className="panel" id="cadastro">
          <h2>Cadastrar aluno</h2>
          <FormCadastro tipo="aluno" turmas={turmas.dados} onCriado={() => (alunos.recarregar(), internos.recarregar())} />
        </section>
      )}

      {sec === "lista" && (
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
              <option value="__sem">Sem turma designada ({semTurma})</option>
              {turmas.dados.map((t) => (
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
                <>
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
                  <div className="field">
                          <label>Grau da faixa preta (dan)</label>
                          <select name="dan" defaultValue={String(a.dan ?? 0)}>
                            <option value="0">Não se aplica</option>
                            {DANS.map((d) => (
                              <option key={d.n} value={d.n}>
                                {d.n}º Dan · {d.jp}
                              </option>
                            ))}
                          </select>
                        </div>
                  <div className="field">
                    <label>Técnicas liberadas até a faixa</label>
                    <select name="liberadoAte" defaultValue={a.liberadoAte ?? ""}>
                      <option value="">Automático: até a próxima faixa dele</option>
                      {faixas.map((f) => (
                        <option key={f.nome} value={f.nome}>
                          Até a faixa {f.nome.toLowerCase()}
                        </option>
                      ))}
                    </select>
                    <p className="form-help">Para aluno avançado que já treina técnicas de faixas acima.</p>
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
                <FotosConta a={a} onSalvo={alunos.recarregar} />
                </>
              ) : (
                <>
                  <span className="aluno-linha">
                    <Avatar url={a.foto} ajuste={a.fotoAjuste} nome={a.apelido || a.nome} faixa={a.faixa} dan={a.dan} tamanho={44} />
                    <span>
                    <strong>{a.apelido ? `${a.apelido} · ${a.nome}` : a.nome}</strong>
                    <small>
                      <i className="dot" style={{ background: corDaFaixa(a.faixa) }} aria-hidden="true" /> Faixa {faixaPorExtenso(a.faixa, a.dan).toLowerCase()}
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
                  </span>
                  <span className="tlinks">
                    <button className="btn btn-ghost" onClick={() => setMedidas(medidas === a.uid ? null : a.uid)}>
                      {medidas === a.uid ? "Fechar medidas" : "Peso e altura"}
                    </button>
                    <button className="btn btn-ghost" onClick={() => (setEditando(a.uid), setAviso(""))}>
                      Editar
                    </button>
                    {!ehAdmin && (
                      <button className="btn btn-ghost" onClick={() => setSenhaDe(senhaDe === a.uid ? null : a.uid)}>
                        Senha
                      </button>
                    )}
                  </span>
                  <span className="tlinks">
                    <button className="btn btn-ghost" onClick={() => setPainel(painel?.uid === a.uid && painel.tipo === "camp" ? null : { uid: a.uid, tipo: "camp" })}>
                      Campeonatos
                    </button>
                    <button className="btn btn-ghost" onClick={() => setPainel(painel?.uid === a.uid && painel.tipo === "gal" ? null : { uid: a.uid, tipo: "gal" })}>
                      Galeria
                    </button>
                  </span>
                  {medidas === a.uid && <MedidasAluno uid={a.uid} nomeAluno={a.apelido || a.nome} turma={a.academia ?? ""} />}
                  {painel?.uid === a.uid && painel.tipo === "camp" && <CampeonatosAluno uid={a.uid} editavel nome={a.apelido || a.nome} turma={a.academia ?? ""} />}
                  {painel?.uid === a.uid && painel.tipo === "gal" && <GaleriaAluno uid={a.uid} autor={autor} avisarAdmin={false} />}
                  {!ehAdmin && senhaDe === a.uid && <AcoesConta uid={a.uid} nome={a.apelido || a.nome} completo={false} onApagada={alunos.recarregar} />}
                </>
              )}
            </li>
          ))}
        </ul>
        {lista.length > 60 && <p className="form-help">Mostrando 60 de {lista.length}. Use a busca ou o filtro de turma.</p>}
      </section>
      )}

      {sec === "aniversarios" && (
      <section className="panel" id="aniversarios">
        <h2>Aniversários</h2>
        <h3 className="sub">Aniversariantes dos próximos 30 dias ({aniversarios.length})</h3>
        {ehAdmin && (
          <p className="tool-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setAviso("Atualizando os aniversários do calendário…");
                void Promise.all(alunos.dados.map((x) => guardarAniversario(x.uid, x.nome, x.apelido, x.dataNascimento)))
                  .then(() => setAviso("Aniversários atualizados. Eles aparecem no calendário para quem está logado (só o apelido ou o primeiro nome)."))
                  .catch((e) => setAviso(mensagemErro(e)));
              }}
            >
              🎂 Colocar os aniversários no calendário
            </button>
          </p>
        )}
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
      </section>
      )}

      {sec === "faixa" && (
      <section className="panel" id="faixas">
        <h2>Tempo na mesma faixa ({paradosNaFaixa.length})</h2>
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
      )}
    </>
  );
}
