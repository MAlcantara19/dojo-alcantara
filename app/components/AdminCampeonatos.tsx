"use client";

import { useEffect, useState } from "react";
import { dataBR, hojeISO, type Aluno } from "../lib/aluno";
import { addAvisoTurma, addMedida, lerTurmas, listarAlunos, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { addCampeonatoDojo, apagarCampeonatoDojo, lerCampeonatosDojo, lerComprovante, lerInscritos, salvarCampeonatoDojo, salvarComprovante, salvarInscrito, tirarComprovante, tirarInscrito, type Arquivo, type CampeonatoDojo, type Comprovante, type Inscrito } from "../lib/campeonatosDojo";
import { classeDeIdade, pesosDaClasse, sugerirPeso, type Sexo } from "../lib/categorias";
import { criarAviso } from "../lib/conteudo";
import { enderecoOk } from "../lib/katasDb";
import { useCarga } from "../lib/useCarga";
import CampoImagem from "./CampoImagem";
import MenuSuspenso from "./MenuSuspenso";

const VAZIO_C: CampeonatoDojo[] = [];
const VAZIO_A: Aluno[] = [];
const VAZIO_T: Turma[] = [];
const VAZIO_I: Inscrito[] = [];
const num = (t: string) => {
  const n = Number(t.replace(",", "."));
  return t && Number.isFinite(n) && n > 0 ? n : null;
};

/** Campeonatos do dojô: dados, arquivos (edital, chaves), aviso, calendário e inscritos. */
export default function AdminCampeonatos({ autor, ehAdmin, minhasTurmas }: { autor: string; ehAdmin: boolean; minhasTurmas: string[] }) {
  const camps = useCarga(() => lerCampeonatosDojo(true), VAZIO_C);
  const turmas = useCarga(lerTurmas, VAZIO_T);
  const [sel, setSel] = useState("");
  const [msg, setMsg] = useState("");
  const atual = sel === "__novo" ? null : (camps.dados.find((c) => c.id === sel) ?? camps.dados[0] ?? null);
  const modo = sel === "__novo" || camps.dados.length === 0 ? "novo" : "ver";

  return (
    <>
      <MenuSuspenso
        id="sel-camp"
        rotulo="Campeonato"
        valor={modo === "novo" ? "__novo" : (atual?.id ?? "__novo")}
        onMudar={(v) => (setSel(v), setMsg(""))}
        opcoes={[...camps.dados.map((c) => [c.id, `${dataBR(c.data)} · ${c.nome}`] as [string, string]), ["__novo", "+ Cadastrar campeonato"]]}
      />
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      {modo === "novo" ? (
        <FormCamp
          turmas={turmas.dados}
          autor={autor}
          onSalvo={(id, texto) => {
            setMsg(texto);
            camps.recarregar();
            setSel(id);
          }}
        />
      ) : atual ? (
        <>
          <Detalhe c={atual} turmas={turmas.dados} autor={autor} ehAdmin={ehAdmin} onMudou={camps.recarregar} onApagado={() => (setSel(""), camps.recarregar())} />
          <Inscricoes c={atual} turmas={turmas.dados} ehAdmin={ehAdmin} minhasTurmas={minhasTurmas} />
        </>
      ) : null}
    </>
  );
}

function FormCamp({ inicial, turmas, autor, onSalvo, onCancelar }: { inicial?: CampeonatoDojo; turmas: Turma[]; autor: string; onSalvo: (id: string, msg: string) => void; onCancelar?: () => void }) {
  const [arquivos, setArquivos] = useState<Arquivo[]>(inicial?.arquivos ?? []);
  const [novoArq, setNovoArq] = useState("");
  const [tituloArq, setTituloArq] = useState("");
  const [avisar, setAvisar] = useState(!inicial);
  const [erro, setErro] = useState("");
  const [chave, setChave] = useState(0);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    if (!g("nome") || !g("data")) return setErro("Preencha o nome e a data do campeonato.");
    const d = { nome: g("nome"), data: g("data"), local: g("local"), descricao: g("descricao"), arquivos, turma: g("turma"), publico: g("publico") === "sim", autor: inicial?.autor ?? autor };
    setErro("");
    try {
      let id = inicial?.id ?? "";
      if (inicial) await salvarCampeonatoDojo(inicial.id, d);
      else id = await addCampeonatoDojo(d);
      if (!inicial && avisar) {
        const texto = `Foi adicionado o campeonato ${d.nome}, em ${dataBR(d.data)}${d.local ? `, ${d.local}` : ""}. Fale com o professor para se inscrever.`;
        const destinos = f.getAll("avisoTurmas").map(String);
        if (destinos.length) for (const t of destinos) await addAvisoTurma({ turma: t, titulo: `Novo campeonato: ${d.nome}`, texto, data: hojeISO(), autor });
        else await criarAviso({ titulo: `Novo campeonato: ${d.nome}`, texto, data: hojeISO(), autor });
      }
      onSalvo(id, inicial ? "Campeonato atualizado." : `Campeonato cadastrado${avisar ? " e aviso publicado" : ""}. Agora inscreva os alunos.`);
    } catch (err) {
      setErro(mensagemErro(err));
    }
  }

  return (
    <form className="form tedit" onSubmit={(e) => void enviar(e)}>
      <strong>{inicial ? `Editando ${inicial.nome}` : "Novo campeonato"}</strong>
      <div className="field">
        <label>Nome</label>
        <input name="nome" type="text" maxLength={100} defaultValue={inicial?.nome ?? ""} autoComplete="off" />
      </div>
      <div className="two">
        <div className="field">
          <label>Data</label>
          <input name="data" type="date" defaultValue={inicial?.data ?? hojeISO()} />
        </div>
        <div className="field">
          <label>Local</label>
          <input name="local" type="text" maxLength={120} defaultValue={inicial?.local ?? ""} autoComplete="off" />
        </div>
      </div>
      <div className="field">
        <label>Informações (horário, pesagem, valor, regulamento…)</label>
        <textarea name="descricao" rows={3} maxLength={1500} defaultValue={inicial?.descricao ?? ""} />
      </div>
      <div className="two">
        <div className="field">
          <label>De qual turma?</label>
          <select name="turma" defaultValue={inicial?.turma ?? ""}>
            <option value="">Geral (todas as turmas)</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.nome}>
                Interno: {t.apelido || t.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Em qual calendário?</label>
          <select name="publico" defaultValue={inicial ? (inicial.publico ? "sim" : "nao") : "sim"}>
            <option value="sim">Calendário geral (todo mundo vê)</option>
            <option value="nao">Só no calendário dos alunos</option>
          </select>
        </div>
      </div>

      <h4>Arquivos (edital, chaves, regulamento)</h4>
      {arquivos.length > 0 && (
        <ul className="manage">
          {arquivos.map((a, i) => (
            <li key={i}>
              <span>
                <strong>{a.titulo}</strong>
                <small>{a.url.startsWith("db:") ? "Imagem enviada" : a.url}</small>
              </span>
              <button type="button" className="btn btn-ghost" onClick={() => setArquivos((l) => l.filter((_, k) => k !== i))}>
                Tirar
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="field">
        <label>Nome do arquivo</label>
        <input type="text" maxLength={60} value={tituloArq} onChange={(e) => setTituloArq(e.target.value)} placeholder="Ex.: Edital, Chaves sub-13" />
      </div>
      <CampoImagem key={chave} name="__arquivo" rotulo="Imagem (do celular) ou link do PDF no Drive" onMudar={setNovoArq} />
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          if (!novoArq || !enderecoOk(novoArq)) return setErro("Escolha a imagem ou cole o link (https://).");
          setArquivos((l) => [...l, { titulo: tituloArq.trim() || `Arquivo ${l.length + 1}`, url: novoArq }].slice(0, 12));
          setNovoArq("");
          setTituloArq("");
          setChave((k) => k + 1);
          setErro("");
        }}
      >
        + Adicionar arquivo
      </button>

      {!inicial && (
        <fieldset className="passo">
          <legend>Aviso</legend>
          <label className="check-linha">
            <input type="checkbox" checked={avisar} onChange={(e) => setAvisar(e.target.checked)} /> Publicar o aviso “Foi adicionado o campeonato…”
          </label>
          {avisar && (
            <div className="checks">
              <small>Para quem? Sem marcar nenhuma turma, o aviso vai para todos (página inicial).</small>
              {turmas.map((t) => (
                <label key={t.id}>
                  <input type="checkbox" name="avisoTurmas" value={t.nome} /> {t.apelido || t.nome}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      )}
      {erro && (
        <p className="form-note" role="alert">
          {erro}
        </p>
      )}
      <div className="tool-actions">
        <button className="btn btn-primary" type="submit">
          {inicial ? "Salvar alterações" : "Cadastrar campeonato"}
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

function Detalhe({ c, turmas, autor, ehAdmin, onMudou, onApagado }: { c: CampeonatoDojo; turmas: Turma[]; autor: string; ehAdmin: boolean; onMudou: () => void; onApagado: () => void }) {
  const [editando, setEditando] = useState(false);
  if (editando) return <FormCamp inicial={c} turmas={turmas} autor={autor} onSalvo={() => (setEditando(false), onMudou())} onCancelar={() => setEditando(false)} />;
  return (
    <section className="panel">
      <h2>{c.nome}</h2>
      <p className="tmeta">
        {dataBR(c.data)}
        {c.local ? ` · ${c.local}` : ""} · {c.turma ? `Interno da turma ${c.turma}` : "Geral"} · {c.publico ? "calendário geral" : "só calendário dos alunos"}
      </p>
      {c.descricao && <p className="pre">{c.descricao}</p>}
      {c.arquivos.length > 0 && (
        <div className="tlinks">
          {c.arquivos.map((a, i) =>
            a.url.startsWith("db:") ? (
              <span key={i} className="tag">
                🖼️ {a.titulo}
              </span>
            ) : (
              <a key={i} className="btn btn-ghost" href={a.url} target="_blank" rel="noopener noreferrer">
                📄 {a.titulo}
              </a>
            ),
          )}
        </div>
      )}
      <div className="tool-actions">
        <button className="btn btn-ghost" onClick={() => setEditando(true)}>
          Editar campeonato
        </button>
        {(ehAdmin || c.autor === autor) && (
          <button className="btn btn-ghost perigo" onClick={() => window.confirm(`Apagar o campeonato “${c.nome}”? Os inscritos também somem da lista.`) && void apagarCampeonatoDojo(c.id).then(onApagado)}>
            Apagar
          </button>
        )}
      </div>
    </section>
  );
}

function Inscricoes({ c, turmas, ehAdmin, minhasTurmas }: { c: CampeonatoDojo; turmas: Turma[]; ehAdmin: boolean; minhasTurmas: string[] }) {
  const alunos = useCarga(() => listarAlunos(null), VAZIO_A);
  const insc = useCarga(() => lerInscritos(c.id), VAZIO_I);
  const [filtro, setFiltro] = useState(c.turma || "");
  const [uid, setUid] = useState("");
  const [sexo, setSexo] = useState<Sexo>("M");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [categoria, setCategoria] = useState("");
  const [comprovante, setComprovante] = useState("");
  const [chave, setChave] = useState(0);
  const [msg, setMsg] = useState("");
  const [comps, setComps] = useState<Record<string, Comprovante | null>>({});

  const ano = Number(c.data.slice(0, 4));
  const lista = alunos.dados.filter((a) => (!filtro ? true : filtro === "__sem" ? !a.academia : a.academia === filtro)).filter((a) => !insc.dados.some((i) => i.uid === a.uid));
  const aluno = alunos.dados.find((a) => a.uid === uid) ?? null;
  const classe = classeDeIdade(aluno?.dataNascimento, ano);
  const pesos = pesosDaClasse(classe, sexo);
  const podeVerComprovante = (turma: string) => ehAdmin || minhasTurmas.includes(turma);

  // Lê os comprovantes que você tem permissão de ver (administrador: todos; professor: só da turma dele).
  useEffect(() => {
    let vivo = true;
    void Promise.all(insc.dados.filter((i) => podeVerComprovante(i.turma)).map(async (i) => [i.uid, await lerComprovante(c.id, i.uid)] as const)).then((pares) => {
      if (vivo) setComps(Object.fromEntries(pares));
    });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insc.dados, c.id]);

  async function inscrever() {
    if (!aluno) return setMsg("Escolha o aluno.");
    const p = num(peso);
    const h = num(altura);
    const i: Inscrito = { uid: aluno.uid, nome: aluno.apelido || aluno.nome, turma: aluno.academia ?? "", sexo, classe, categoria: categoria || sugerirPeso(classe, sexo, p), peso: peso.trim(), altura: altura.trim(), ts: 0 };
    setMsg("Inscrevendo…");
    try {
      await salvarInscrito(c.id, i);
      if (p || h) await addMedida(aluno.uid, { data: hojeISO(), peso: p, altura: h }).catch(() => undefined);
      if (comprovante && enderecoOk(comprovante)) await salvarComprovante(c.id, aluno.uid, { url: comprovante, obs: "", turma: aluno.academia ?? "" });
      setMsg(`${i.nome} inscrito${i.categoria ? ` (${[i.classe, i.categoria].filter(Boolean).join(" ")})` : ""}.`);
      setUid("");
      setPeso("");
      setAltura("");
      setCategoria("");
      setComprovante("");
      setChave((k) => k + 1);
      insc.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  return (
    <section className="panel">
      <h2>Inscritos ({insc.dados.length})</h2>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <div className="form tedit">
        <strong>Inscrever aluno</strong>
        <div className="two">
          <MenuSuspenso
            id="insc-turma"
            rotulo="Filtrar por turma"
            valor={filtro}
            onMudar={(v) => (setFiltro(v), setUid(""))}
            opcoes={[["", "Todos os alunos"], ["__sem", "Sem turma"], ...turmas.map((t) => [t.nome, t.apelido || t.nome] as [string, string])]}
          />
          <MenuSuspenso id="insc-aluno" rotulo={`Aluno (${lista.length})`} valor={uid} onMudar={(v) => (setUid(v), setCategoria(""))} opcoes={[["", "Escolha o aluno"], ...lista.map((a) => [a.uid, a.apelido ? `${a.apelido} · ${a.nome}` : a.nome] as [string, string])]} />
        </div>
        {aluno && (
          <>
            <p className="form-help">
              {classe ? `Classe pela idade em ${ano}: ${classe}.` : "Sem data de nascimento: a classe não pôde ser calculada."} A categoria é uma sugestão: confira no regulamento.
            </p>
            <div className="two">
              <div className="field">
                <label>Naipe</label>
                <select value={sexo} onChange={(e) => (setSexo(e.target.value as Sexo), setCategoria(""))}>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
              <div className="field">
                <label>Peso em kg (opcional)</label>
                <input type="text" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="Ex.: 37,4" />
              </div>
            </div>
            <div className="two">
              <div className="field">
                <label>Altura em cm (opcional)</label>
                <input type="text" inputMode="decimal" value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="Ex.: 142" />
              </div>
              <div className="field">
                <label>Categoria de peso</label>
                {pesos.length ? (
                  <select value={categoria || sugerirPeso(classe, sexo, num(peso))} onChange={(e) => setCategoria(e.target.value)}>
                    <option value="">A definir</option>
                    {pesos.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" maxLength={30} value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex.: -30 kg (ver tabela do evento)" />
                )}
              </div>
            </div>
            <CampoImagem key={chave} name="__comp" rotulo="Comprovante de pagamento ou documento (opcional; só o administrador e o professor da turma veem)" onMudar={setComprovante} />
            <button type="button" className="btn btn-primary" onClick={() => void inscrever()}>
              Inscrever
            </button>
          </>
        )}
      </div>
      <ul className="manage">
        {insc.dados.length === 0 && <li className="empty">Ninguém inscrito ainda.</li>}
        {insc.dados.map((i) => (
          <li key={i.uid}>
            <span>
              <strong>{i.nome}</strong>
              <small>{[i.turma || "sem turma", i.classe, i.categoria, i.sexo === "F" ? "feminino" : "masculino", i.peso && `${i.peso} kg`, i.altura && `${i.altura} cm`].filter(Boolean).join(" · ")}</small>
              {podeVerComprovante(i.turma) && (
                <small>
                  {comps[i.uid] ? (
                    comps[i.uid]?.url.startsWith("db:") ? (
                      "🧾 Comprovante enviado (imagem)"
                    ) : (
                      <a href={comps[i.uid]?.url} target="_blank" rel="noopener noreferrer">
                        🧾 Ver comprovante
                      </a>
                    )
                  ) : (
                    "Sem comprovante"
                  )}
                </small>
              )}
            </span>
            <button
              className="btn btn-ghost"
              onClick={() =>
                window.confirm(`Tirar ${i.nome} do campeonato?`) &&
                void Promise.all([tirarInscrito(c.id, i.uid), tirarComprovante(c.id, i.uid)]).then(insc.recarregar)
              }
            >
              Tirar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
