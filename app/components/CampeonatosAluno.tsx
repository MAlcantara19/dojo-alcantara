"use client";

import { useState } from "react";
import { dataBR, hojeISO } from "../lib/aluno";
import { mensagemErro } from "../lib/auth";
import { addCampeonato, apagarCampeonato, COLOCACOES, COMO, lerCampeonatos, lutaVazia, PONTOS, salvarCampeonato, type Campeonato, type DadosCampeonato, type Luta, type Ponto } from "../lib/campeonatos";
import { enderecoOk } from "../lib/katasDb";
import { useCarga } from "../lib/useCarga";
import CampoImagem from "./CampoImagem";
import Img from "./Img";
import Midia from "./Midia";

const VAZIO: Campeonato[] = [];
const medalha = (c: string) => (c.startsWith("1") ? "🥇" : c.startsWith("2") ? "🥈" : c.startsWith("3") ? "🥉" : c ? "🎖️" : "");
const placar = (p: Record<Ponto, number>) =>
  PONTOS.filter((k) => p[k] > 0)
    .map((k) => `${p[k] > 1 ? p[k] + " " : ""}${k}`)
    .join(", ") || "—";
const ehImagem = (u: string) => u.startsWith("db:") || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u);

/** Campeonatos de um aluno. editavel = professor/administrador; o aluno só vê. */
export default function CampeonatosAluno({ uid, editavel, nome }: { uid: string; editavel: boolean; nome?: string }) {
  const c = useCarga(() => lerCampeonatos(uid), VAZIO);
  const [editando, setEditando] = useState<Campeonato | "novo" | null>(null);
  const [msg, setMsg] = useState("");

  return (
    <div className="campeonatos">
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      {editavel && editando === null && (
        <button type="button" className="btn btn-primary" onClick={() => (setEditando("novo"), setMsg(""))}>
          + Registrar campeonato{nome ? ` de ${nome}` : ""}
        </button>
      )}
      {editavel && editando !== null && (
        <FormCampeonato
          inicial={editando === "novo" ? null : editando}
          onCancelar={() => setEditando(null)}
          onSalvar={async (d) => {
            setMsg("Salvando…");
            try {
              if (editando === "novo") await addCampeonato(uid, d);
              else await salvarCampeonato(uid, editando.id, d);
              setMsg("Campeonato salvo.");
              setEditando(null);
              c.recarregar();
            } catch (e) {
              setMsg(mensagemErro(e));
            }
          }}
        />
      )}
      {c.carregando && <p className="form-help">Carregando campeonatos…</p>}
      {c.erro && <p className="empty">Não consegui ler os campeonatos.</p>}
      {!c.carregando && !c.erro && c.dados.length === 0 && <p className="empty">Nenhum campeonato registrado ainda.</p>}
      {c.dados.map((x) => {
        const v = x.lutas.filter((l) => l.resultado === "vitoria").length;
        return (
          <article key={x.id} className="camp-card">
            <header>
              <span className="camp-medalha" aria-hidden="true">
                {medalha(x.colocacao) || "🥋"}
              </span>
              <div>
                <h3>{x.nome}</h3>
                <p className="tmeta">
                  {dataBR(x.data)}
                  {x.local ? ` · ${x.local}` : ""}
                </p>
              </div>
            </header>
            <div className="camp-info">
              {x.categoria && <span className="tag">{x.categoria}</span>}
              {x.peso && <span className="tag">Pesagem: {x.peso}</span>}
              {x.colocacao && <span className="tag tag-forte">{x.colocacao}</span>}
              {x.lutas.length > 0 && (
                <span className="tag">
                  {v} {v === 1 ? "vitória" : "vitórias"} e {x.lutas.length - v} {x.lutas.length - v === 1 ? "derrota" : "derrotas"}
                </span>
              )}
            </div>
            {x.lutas.length > 0 && (
              <ol className="lutas">
                {x.lutas.map((l, i) => (
                  <li key={i} className={l.resultado}>
                    <strong>
                      {l.resultado === "vitoria" ? "Venceu" : "Perdeu"} contra {l.adversario || "adversário"}
                      {l.academia ? ` (${l.academia})` : ""}
                    </strong>
                    <small>
                      {l.como}
                      {l.tecnica ? ` · ${l.tecnica}` : ""}
                    </small>
                    <small>
                      Pontos a favor: {placar(l.aFavor)} · contra: {placar(l.contra)}
                    </small>
                    {l.obs && <small>{l.obs}</small>}
                  </li>
                ))}
              </ol>
            )}
            {(x.chave.length > 0 || x.chaveImagem) && (
              <details className="camp-chave">
                <summary>Chave ({x.chave.length} atletas)</summary>
                {x.chave.length > 0 && <p>{x.chave.join(" · ")}</p>}
                {x.chaveImagem && <Img className="midia-img" src={x.chaveImagem} alt={`Chave de ${x.nome}`} largura={1200} />}
              </details>
            )}
            {x.midias.length > 0 && (
              <div className="camp-midias">
                {x.midias.map((m, i) => (ehImagem(m) ? <Img key={i} className="camp-foto" src={m} alt={`Foto de ${x.nome}`} largura={600} /> : <Midia key={i} video={m} alt={x.nome} />))}
              </div>
            )}
            {editavel && (
              <div className="tool-actions">
                <button type="button" className="btn btn-ghost" onClick={() => (setEditando(x), window.scrollTo({ top: 0, behavior: "smooth" }))}>
                  Editar
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => window.confirm(`Apagar “${x.nome}”?`) && void apagarCampeonato(uid, x.id).then(c.recarregar)}>
                  Apagar
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function Contador({ rotulo, valor, onMudar }: { rotulo: string; valor: number; onMudar: (n: number) => void }) {
  return (
    <span className="contador">
      <small>{rotulo}</small>
      <button type="button" aria-label={`Menos ${rotulo}`} onClick={() => onMudar(Math.max(0, valor - 1))}>
        −
      </button>
      <b>{valor}</b>
      <button type="button" aria-label={`Mais ${rotulo}`} onClick={() => onMudar(Math.min(9, valor + 1))}>
        +
      </button>
    </span>
  );
}

function FormCampeonato({ inicial, onSalvar, onCancelar }: { inicial: Campeonato | null; onSalvar: (d: DadosCampeonato) => Promise<void>; onCancelar: () => void }) {
  const [lutas, setLutas] = useState<Luta[]>(inicial?.lutas ?? []);
  const [midias, setMidias] = useState<string[]>(inicial?.midias ?? []);
  const [novaMidia, setNovaMidia] = useState("");
  const [erro, setErro] = useState("");
  const mudar = (i: number, p: Partial<Luta>) => setLutas((ls) => ls.map((l, k) => (k === i ? { ...l, ...p } : l)));

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const chaveImagem = g("chaveImagem");
    if (!g("nome") || !g("data")) return setErro("Preencha pelo menos o nome do campeonato e a data.");
    if (chaveImagem && !enderecoOk(chaveImagem)) return setErro("A imagem da chave precisa ser enviada do celular ou ser um link https://");
    setErro("");
    void onSalvar({
      nome: g("nome"),
      data: g("data"),
      local: g("local"),
      categoria: g("categoria"),
      peso: g("peso"),
      colocacao: g("colocacao"),
      chave: g("chave")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 64),
      chaveImagem,
      lutas: lutas.slice(0, 20),
      midias: midias.slice(0, 30),
    });
  }

  return (
    <form className="form tedit" onSubmit={enviar}>
      <strong>{inicial ? `Editando ${inicial.nome}` : "Novo campeonato"}</strong>
      <div className="field">
        <label>Nome do campeonato</label>
        <input name="nome" type="text" maxLength={100} defaultValue={inicial?.nome ?? ""} autoComplete="off" />
      </div>
      <div className="two">
        <div className="field">
          <label>Data</label>
          <input name="data" type="date" defaultValue={inicial?.data ?? hojeISO()} />
        </div>
        <div className="field">
          <label>Local</label>
          <input name="local" type="text" maxLength={100} defaultValue={inicial?.local ?? ""} autoComplete="off" />
        </div>
      </div>
      <div className="two">
        <div className="field">
          <label>Categoria (idade e peso)</label>
          <input name="categoria" type="text" maxLength={80} placeholder="Ex.: Sub-13, até 38 kg" defaultValue={inicial?.categoria ?? ""} autoComplete="off" />
        </div>
        <div className="field">
          <label>Peso na pesagem</label>
          <input name="peso" type="text" maxLength={20} placeholder="Ex.: 37,4 kg" defaultValue={inicial?.peso ?? ""} autoComplete="off" />
        </div>
      </div>
      <div className="field">
        <label>Colocação</label>
        <select name="colocacao" defaultValue={inicial?.colocacao ?? ""}>
          {COLOCACOES.map((c) => (
            <option key={c} value={c}>
              {c || "Ainda não lutou / sem colocação"}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Chave: atletas da categoria (um por linha, opcional)</label>
        <textarea name="chave" rows={3} maxLength={3000} defaultValue={(inicial?.chave ?? []).join("\n")} placeholder={"Fulano (Academia X)\nCiclano (Academia Y)"} />
      </div>
      <CampoImagem name="chaveImagem" rotulo="Foto da chave (opcional)" valorInicial={inicial?.chaveImagem ?? ""} />

      <h4>Lutas</h4>
      {lutas.length === 0 && <p className="form-help">Nenhuma luta registrada. Toque em “Adicionar luta”.</p>}
      {lutas.map((l, i) => (
        <fieldset key={i} className={"luta-form " + l.resultado}>
          <legend>{i + 1}ª luta</legend>
          <div className="two">
            <div className="field">
              <label>Adversário</label>
              <input type="text" maxLength={80} value={l.adversario} onChange={(e) => mudar(i, { adversario: e.target.value })} />
            </div>
            <div className="field">
              <label>Academia do adversário</label>
              <input type="text" maxLength={80} value={l.academia} onChange={(e) => mudar(i, { academia: e.target.value })} />
            </div>
          </div>
          <div className="two">
            <div className="field">
              <label>Resultado</label>
              <select value={l.resultado} onChange={(e) => mudar(i, { resultado: e.target.value as Luta["resultado"] })}>
                <option value="vitoria">Vitória</option>
                <option value="derrota">Derrota</option>
              </select>
            </div>
            <div className="field">
              <label>Como terminou</label>
              <select value={l.como} onChange={(e) => mudar(i, { como: e.target.value })}>
                {COMO.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pontos">
            <strong>Pontos a favor</strong>
            {PONTOS.map((p) => (
              <Contador key={p} rotulo={p} valor={l.aFavor[p]} onMudar={(n) => mudar(i, { aFavor: { ...l.aFavor, [p]: n } })} />
            ))}
          </div>
          <div className="pontos">
            <strong>Pontos contra</strong>
            {PONTOS.map((p) => (
              <Contador key={p} rotulo={p} valor={l.contra[p]} onMudar={(n) => mudar(i, { contra: { ...l.contra, [p]: n } })} />
            ))}
          </div>
          <div className="two">
            <div className="field">
              <label>Técnica que decidiu (opcional)</label>
              <input type="text" maxLength={80} value={l.tecnica} onChange={(e) => mudar(i, { tecnica: e.target.value })} />
            </div>
            <div className="field">
              <label>Observação (opcional)</label>
              <input type="text" maxLength={200} value={l.obs} onChange={(e) => mudar(i, { obs: e.target.value })} />
            </div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => setLutas((ls) => ls.filter((_, k) => k !== i))}>
            Tirar esta luta
          </button>
        </fieldset>
      ))}
      <button type="button" className="btn btn-ghost" onClick={() => setLutas((ls) => [...ls, lutaVazia()])} disabled={lutas.length >= 20}>
        + Adicionar luta
      </button>

      <h4>Fotos e vídeos do campeonato</h4>
      {midias.length > 0 && (
        <ul className="manage">
          {midias.map((m, i) => (
            <li key={i}>
              <span>
                <small>{m.startsWith("db:") ? "Foto enviada do celular" : m}</small>
              </span>
              <button type="button" className="btn btn-ghost" onClick={() => setMidias((ms) => ms.filter((_, k) => k !== i))}>
                Tirar
              </button>
            </li>
          ))}
        </ul>
      )}
      <CampoImagem name="__nova" rotulo="Foto (do celular) ou link de foto/vídeo" valorInicial="" onMudar={setNovaMidia} key={midias.length} />
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          if (!novaMidia || !enderecoOk(novaMidia)) return setErro("Escolha uma foto ou cole um link que comece com https://");
          setMidias((ms) => [...ms, novaMidia]);
          setNovaMidia("");
          setErro("");
        }}
      >
        + Adicionar à lista
      </button>

      {erro && (
        <p className="form-note" role="alert">
          {erro}
        </p>
      )}
      <div className="tool-actions">
        <button className="btn btn-primary" type="submit">
          Salvar campeonato
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
