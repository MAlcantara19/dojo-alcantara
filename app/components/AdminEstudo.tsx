"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import {
  addExercicio, addListaPalavras, addPalavra, apagarExercicio, apagarListaPalavras, apagarPalavra, apagarSimulado, atualizarExercicio, atualizarPalavra, atualizarSimulado, criarSimulado,
  importarExerciciosPadrao, importarPalavrasPadrao, importarSimuladoPadrao, LISTA_DOJO, lerExercicios, lerListasPalavras, lerPalavras, lerSimulados, salvarPerguntas,
  type ExercicioDoc, type ListaPalavras, type PalavraDoc, type SimuladoDoc,
} from "../lib/estudoDb";
import type { Pergunta } from "../lib/simulados";
import { useCarga } from "../lib/useCarga";

const VAZIO_P: PalavraDoc[] = [];
const VAZIO_L: ListaPalavras[] = [];
const VAZIO_S: SimuladoDoc[] = [];
const VAZIO_E: ExercicioDoc[] = [];
const LETRAS = ["A", "B", "C", "D", "E"];

export default function AdminEstudo() {
  return (
    <>
      <PainelPalavras />
      <PainelExercicios />
      <PainelSimulados />
    </>
  );
}

/* Roda uma ação e mostra o aviso logo abaixo do botão. */
function useAcao(recarregar: () => void) {
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  async function rodar(acao: () => Promise<void>, ok: string, depois?: () => void) {
    setOcupado(true);
    setMsg("Salvando…");
    try {
      await acao();
      setMsg(ok);
      recarregar();
      depois?.();
    } catch (e) {
      setMsg(mensagemErro(e));
    }
    setOcupado(false);
  }
  return { msg, setMsg, ocupado, rodar };
}

const Aviso = ({ msg }: { msg: string }) =>
  msg ? (
    <p className="form-note" role="status">
      {msg}
    </p>
  ) : null;

/* ====================== PALAVRAS ====================== */
function FormPalavra({ nomesListas, inicial, rotuloBotao, ocupado, onSalvar, onCancelar }: { nomesListas: string[]; inicial?: PalavraDoc; rotuloBotao: string; ocupado: boolean; onSalvar: (p: { termo: string; significado: string; listas: string[] }, reset: () => void) => void; onCancelar?: () => void }) {
  return (
    <form
      className="form tedit"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        onSalvar({ termo: String(f.get("termo") ?? "").trim(), significado: String(f.get("significado") ?? "").trim(), listas: f.getAll("listas").map(String) }, () => form.reset());
      }}
    >
      <div className="field">
        <label>Palavra</label>
        <input name="termo" type="text" maxLength={60} autoComplete="off" defaultValue={inicial?.termo ?? ""} />
      </div>
      <div className="field">
        <label>Significado</label>
        <input name="significado" type="text" maxLength={200} autoComplete="off" defaultValue={inicial?.significado ?? ""} />
      </div>
      <div className="checks">
        <strong>Fica nas listas</strong>
        {nomesListas.length === 0 && <small>Crie listas acima para organizar. Toda palavra aparece em “Todas as palavras”.</small>}
        {nomesListas.map((n) => (
          <label key={n}>
            <input type="checkbox" name="listas" value={n} defaultChecked={inicial ? inicial.listas.includes(n) : n === LISTA_DOJO} /> {n}
          </label>
        ))}
      </div>
      <div className="tool-actions">
        <button className="btn btn-primary" type="submit" disabled={ocupado}>
          {rotuloBotao}
        </button>
        {onCancelar && (
          <button type="button" className="btn btn-ghost" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

function PainelPalavras() {
  const pal = useCarga(lerPalavras, VAZIO_P);
  const listas = useCarga(lerListasPalavras, VAZIO_L);
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const a = useAcao(() => (pal.recarregar(), listas.recarregar()));

  const nomes = Array.from(new Set([...listas.dados.map((l) => l.nome), ...pal.dados.flatMap((p) => p.listas)])).sort((x, y) => (x === LISTA_DOJO ? -1 : y === LISTA_DOJO ? 1 : x.localeCompare(y, "pt-BR")));
  const termo = busca.trim().toLowerCase();
  const lista = [...pal.dados].sort((x, y) => x.termo.localeCompare(y.termo, "pt-BR")).filter((p) => !termo || p.termo.toLowerCase().includes(termo) || p.significado.toLowerCase().includes(termo));

  function validar(p: { termo: string; significado: string }): boolean {
    if (!p.termo || !p.significado) {
      a.setMsg("Preencha a palavra e o significado.");
      return false;
    }
    return true;
  }

  return (
    <section className="panel" id="palavras">
      <h2>Palavras da roleta</h2>
      <p className="lead">{pal.dados.length === 0 ? "Enquanto não houver palavras aqui, a roleta usa a lista padrão do site." : `${pal.dados.length} palavras em ${nomes.length} listas.`}</p>
      <Aviso msg={a.msg} />

      {pal.dados.length === 0 && !pal.carregando && (
        <button className="btn btn-ghost" disabled={a.ocupado} onClick={() => void a.rodar(importarPalavrasPadrao, "Lista padrão importada. Agora você pode editar cada palavra.")}>
          Importar a lista padrão para editar
        </button>
      )}

      <h3 className="sub">Listas</h3>
      <p className="form-help">Crie listas como “10 palavras”, “Faixa azul” ou “Faixa amarela”. Cada lista vira uma roleta. A roleta “Todas as palavras” sempre existe.</p>
      <form
        className="form inline"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const nome = String(new FormData(form).get("nome") ?? "").trim();
          if (!nome) return a.setMsg("Escreva o nome da lista.");
          if (nomes.some((n) => n.toLowerCase() === nome.toLowerCase())) return a.setMsg("Essa lista já existe.");
          void a.rodar(() => addListaPalavras(nome), `Lista “${nome}” criada.`, () => form.reset());
        }}
      >
        <input name="nome" type="text" maxLength={60} placeholder="Ex.: Faixa azul" aria-label="Nome da nova lista" autoComplete="off" />
        <button className="btn btn-primary" type="submit" disabled={a.ocupado}>
          Criar lista
        </button>
      </form>
      <ul className="manage">
        {listas.dados.map((l) => (
          <li key={l.id}>
            <span>
              <strong>{l.nome}</strong>
              <small>{pal.dados.filter((p) => p.listas.includes(l.nome)).length} palavras</small>
            </span>
            <button className="btn btn-ghost" disabled={a.ocupado} onClick={() => window.confirm(`Apagar a lista “${l.nome}”? As palavras continuam cadastradas.`) && void a.rodar(() => apagarListaPalavras(l.id), "Lista apagada.")}>
              Apagar
            </button>
          </li>
        ))}
        {listas.dados.length === 0 && <li className="empty">Nenhuma lista criada ainda.</li>}
      </ul>

      <h3 className="sub">Nova palavra</h3>
      <FormPalavra nomesListas={nomes} rotuloBotao="Adicionar palavra" ocupado={a.ocupado} onSalvar={(p, reset) => validar(p) && void a.rodar(() => addPalavra(p), "Palavra adicionada.", reset)} />

      <h3 className="sub">Palavras cadastradas</h3>
      <div className="field">
        <label htmlFor="pa-busca">Buscar palavra</label>
        <input id="pa-busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <ul className="manage">
        {lista.slice(0, 30).map((p) => (
          <li key={p.id} className={editando === p.id ? "coluna" : undefined}>
            {editando === p.id ? (
              <FormPalavra
                key={p.id + p.termo + p.significado + p.listas.join()}
                nomesListas={nomes}
                inicial={p}
                rotuloBotao="Salvar alterações"
                ocupado={a.ocupado}
                onCancelar={() => setEditando(null)}
                onSalvar={(n) => validar(n) && void a.rodar(() => atualizarPalavra(p.id, n), "Palavra atualizada.", () => setEditando(null))}
              />
            ) : (
              <>
                <span>
                  <strong>{p.termo}</strong>
                  <small>{p.significado}</small>
                  <small>{p.listas.length ? p.listas.join(" · ") : "só em “Todas as palavras”"}</small>
                </span>
                <span className="tlinks">
                  <button className="btn btn-ghost" onClick={() => setEditando(p.id)}>
                    Editar
                  </button>
                  <button className="btn btn-ghost" disabled={a.ocupado} onClick={() => window.confirm(`Apagar “${p.termo}”?`) && void a.rodar(() => apagarPalavra(p.id), "Palavra apagada.")}>
                    Apagar
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
      {lista.length > 30 && <p className="form-help">Mostrando 30 de {lista.length}. Use a busca.</p>}
    </section>
  );
}

/* ====================== EXERCÍCIOS ====================== */
function PainelExercicios() {
  const ex = useCarga(lerExercicios, VAZIO_E);
  const [editando, setEditando] = useState<string | null>(null);
  const a = useAcao(ex.recarregar);

  function ler(f: FormData) {
    return { nome: String(f.get("nome") ?? "").trim(), descricao: String(f.get("descricao") ?? "").trim() };
  }

  return (
    <section className="panel" id="exercicios">
      <h2>Exercícios da roleta de aula</h2>
      <p className="lead">{ex.dados.length === 0 ? "Enquanto não houver exercícios aqui, a roleta usa a lista padrão (pena de ganso, soldadinho, canguru, corrida, pular corda e outros)." : `${ex.dados.length} exercícios cadastrados.`}</p>
      <Aviso msg={a.msg} />
      {ex.dados.length === 0 && !ex.carregando && (
        <button className="btn btn-ghost" disabled={a.ocupado} onClick={() => void a.rodar(importarExerciciosPadrao, "Lista padrão importada. Agora você pode editar.")}>
          Importar a lista padrão para editar
        </button>
      )}
      <form
        className="form tedit"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const n = ler(new FormData(form));
          if (!n.nome) return a.setMsg("Dê um nome ao exercício.");
          void a.rodar(() => addExercicio(n), "Exercício adicionado.", () => form.reset());
        }}
      >
        <strong>Novo exercício</strong>
        <div className="field">
          <label htmlFor="ex-nome">Nome</label>
          <input id="ex-nome" name="nome" type="text" maxLength={60} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="ex-desc">Como fazer (opcional)</label>
          <input id="ex-desc" name="descricao" type="text" maxLength={200} autoComplete="off" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={a.ocupado}>
          Adicionar exercício
        </button>
      </form>
      <ul className="manage">
        {ex.dados.map((e) => (
          <li key={e.id} className={editando === e.id ? "coluna" : undefined}>
            {editando === e.id ? (
              <form
                className="form tedit"
                onSubmit={(ev) => {
                  ev.preventDefault();
                  const n = ler(new FormData(ev.currentTarget));
                  if (!n.nome) return a.setMsg("O nome não pode ficar vazio.");
                  void a.rodar(() => atualizarExercicio(e.id, n), "Exercício atualizado.", () => setEditando(null));
                }}
              >
                <div className="field">
                  <label>Nome</label>
                  <input name="nome" type="text" maxLength={60} defaultValue={e.nome} autoComplete="off" />
                </div>
                <div className="field">
                  <label>Como fazer</label>
                  <input name="descricao" type="text" maxLength={200} defaultValue={e.descricao} autoComplete="off" />
                </div>
                <div className="tool-actions">
                  <button className="btn btn-primary" type="submit" disabled={a.ocupado}>
                    Salvar alterações
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditando(null)}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <>
                <span>
                  <strong>{e.nome}</strong>
                  {e.descricao && <small>{e.descricao}</small>}
                </span>
                <span className="tlinks">
                  <button className="btn btn-ghost" onClick={() => setEditando(e.id)}>
                    Editar
                  </button>
                  <button className="btn btn-ghost" disabled={a.ocupado} onClick={() => window.confirm(`Apagar “${e.nome}”?`) && void a.rodar(() => apagarExercicio(e.id), "Exercício apagado.")}>
                    Apagar
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ====================== SIMULADOS ====================== */
function FormPergunta({ inicial, rotuloBotao, ocupado, onSalvar, onCancelar, onErro }: { inicial?: Pergunta; rotuloBotao: string; ocupado: boolean; onSalvar: (p: Pergunta, reset: () => void) => void; onCancelar?: () => void; onErro: (m: string) => void }) {
  return (
    <form
      className="form tedit"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        const pergunta = String(f.get("pergunta") ?? "").trim();
        const brutas = [1, 2, 3, 4, 5].map((i) => String(f.get("op" + i) ?? "").trim());
        const escolhida = Number(f.get("correta")) - 1;
        const explicacao = String(f.get("explicacao") ?? "").trim();
        if (!pergunta) return onErro("Escreva a pergunta.");
        const opcoes = brutas.filter(Boolean);
        if (opcoes.length < 2) return onErro("Preencha pelo menos duas alternativas (A e B).");
        if (brutas.slice(0, opcoes.length).some((o) => !o)) return onErro("Preencha as alternativas em ordem, sem pular letras.");
        if (new Set(opcoes).size < opcoes.length) return onErro("As alternativas precisam ser diferentes.");
        if (!(escolhida >= 0 && escolhida < opcoes.length)) return onErro("A resposta correta precisa ser uma das alternativas preenchidas.");
        onSalvar({ pergunta, opcoes, correta: escolhida, explicacao: explicacao || "—" }, () => form.reset());
      }}
    >
      <div className="field">
        <label>Pergunta</label>
        <textarea name="pergunta" rows={2} maxLength={300} defaultValue={inicial?.pergunta ?? ""} />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div className="field" key={i}>
          <label>
            Alternativa {LETRAS[i - 1]}
            {i > 2 ? " (opcional)" : ""}
          </label>
          <input name={`op${i}`} type="text" maxLength={150} autoComplete="off" defaultValue={inicial?.opcoes[i - 1] ?? ""} />
        </div>
      ))}
      <div className="field">
        <label>Qual alternativa é a correta?</label>
        <select name="correta" defaultValue={String((inicial?.correta ?? 0) + 1)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <option key={i} value={i}>
              Alternativa {LETRAS[i - 1]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Explicação (aparece depois de responder)</label>
        <input name="explicacao" type="text" maxLength={300} autoComplete="off" defaultValue={inicial?.explicacao && inicial.explicacao !== "—" ? inicial.explicacao : ""} />
      </div>
      <div className="tool-actions">
        <button className="btn btn-primary" type="submit" disabled={ocupado}>
          {rotuloBotao}
        </button>
        {onCancelar && (
          <button type="button" className="btn btn-ghost" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

function PainelSimulados() {
  const sims = useCarga(lerSimulados, VAZIO_S);
  const [sel, setSel] = useState("");
  const [editQ, setEditQ] = useState<number | null>(null);
  const a = useAcao(sims.recarregar);
  const atual = sims.dados.find((s) => s.id === sel) ?? null;

  return (
    <section className="panel" id="simulados">
      <h2>Simulados</h2>
      <Aviso msg={a.msg} />

      {sims.dados.length === 0 && !sims.carregando && (
        <>
          <p className="lead">Enquanto não houver simulados aqui, o site usa os simulados padrão.</p>
          <button className="btn btn-ghost" disabled={a.ocupado} onClick={() => void a.rodar(importarSimuladoPadrao, "Simulados padrão importados. Agora você pode corrigir cada pergunta.")}>
            Importar os simulados padrão para editar
          </button>
        </>
      )}

      <form
        className="form tedit"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          const titulo = String(f.get("titulo") ?? "").trim();
          if (!titulo) return a.setMsg("Dê um título ao simulado.");
          void a.rodar(() => criarSimulado(titulo, String(f.get("descricao") ?? "").trim()), "Simulado criado. Escolha-o abaixo para acrescentar perguntas.", () => form.reset());
        }}
      >
        <strong>Novo simulado</strong>
        <div className="field">
          <label htmlFor="si-titulo">Título</label>
          <input id="si-titulo" name="titulo" type="text" maxLength={80} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="si-desc">Descrição</label>
          <input id="si-desc" name="descricao" type="text" maxLength={160} autoComplete="off" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={a.ocupado}>
          Criar simulado
        </button>
      </form>

      {sims.dados.length > 0 && (
        <div className="field">
          <label htmlFor="si-sel">Editar este simulado</label>
          <select id="si-sel" value={sel} onChange={(e) => (setSel(e.target.value), setEditQ(null))}>
            <option value="">Escolha…</option>
            {sims.dados.map((s) => (
              <option key={s.id} value={s.id}>
                {s.titulo} ({s.perguntas.length})
              </option>
            ))}
          </select>
        </div>
      )}

      {atual && (
        <>
          <form
            className="form tedit"
            key={atual.id + atual.titulo + atual.descricao}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const titulo = String(f.get("titulo") ?? "").trim();
              if (!titulo) return a.setMsg("O título não pode ficar vazio.");
              void a.rodar(() => atualizarSimulado(atual.id, titulo, String(f.get("descricao") ?? "").trim()), "Título atualizado.");
            }}
          >
            <strong>Título e descrição</strong>
            <div className="field">
              <label>Título</label>
              <input name="titulo" type="text" maxLength={80} defaultValue={atual.titulo} autoComplete="off" />
            </div>
            <div className="field">
              <label>Descrição</label>
              <input name="descricao" type="text" maxLength={160} defaultValue={atual.descricao} autoComplete="off" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={a.ocupado}>
              Salvar título
            </button>
          </form>

          <h3 className="sub">Perguntas ({atual.perguntas.length})</h3>
          <ul className="manage">
            {atual.perguntas.length === 0 && <li className="empty">Este simulado ainda não tem perguntas.</li>}
            {atual.perguntas.map((q, i) => (
              <li key={i + q.pergunta} className={editQ === i ? "coluna" : undefined}>
                {editQ === i ? (
                  <FormPergunta
                    inicial={q}
                    rotuloBotao="Salvar alterações"
                    ocupado={a.ocupado}
                    onErro={a.setMsg}
                    onCancelar={() => setEditQ(null)}
                    onSalvar={(n) => void a.rodar(() => salvarPerguntas(atual.id, atual.perguntas.map((x, j) => (j === i ? n : x))), "Pergunta corrigida.", () => setEditQ(null))}
                  />
                ) : (
                  <>
                    <span>
                      <strong>
                        {i + 1}. {q.pergunta}
                      </strong>
                      <small>
                        {q.opcoes.map((o, k) => `${LETRAS[k]}) ${o}`).join("  ·  ")}
                      </small>
                      <small>Correta: {LETRAS[q.correta]}) {q.opcoes[q.correta]}</small>
                    </span>
                    <span className="tlinks">
                      <button className="btn btn-ghost" onClick={() => setEditQ(i)}>
                        Editar
                      </button>
                      <button
                        className="btn btn-ghost"
                        disabled={a.ocupado}
                        onClick={() => window.confirm("Apagar esta pergunta?") && void a.rodar(() => salvarPerguntas(atual.id, atual.perguntas.filter((_, j) => j !== i)), "Pergunta apagada.")}
                      >
                        Apagar
                      </button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>

          <h3 className="sub">Nova pergunta</h3>
          <FormPergunta rotuloBotao="Adicionar pergunta" ocupado={a.ocupado} onErro={a.setMsg} onSalvar={(n, reset) => void a.rodar(() => salvarPerguntas(atual.id, [...atual.perguntas, n]), "Pergunta adicionada.", reset)} />

          <button
            className="btn btn-ghost"
            disabled={a.ocupado}
            onClick={() => window.confirm(`Apagar o simulado “${atual.titulo}” inteiro?`) && void a.rodar(() => apagarSimulado(atual.id), "Simulado apagado.", () => setSel(""))}
          >
            Apagar este simulado
          </button>
        </>
      )}
    </section>
  );
}
