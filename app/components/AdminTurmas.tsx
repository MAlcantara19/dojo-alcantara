"use client";

import { useState } from "react";
import { dataBR, hojeISO, type Aluno } from "../lib/aluno";
import { addAvisoTurma, addTurma, apagarAvisoTurma, apagarTurma, lerAvisosTurma, lerTurmas, listarAlunos, renomearTurma, salvarTurma, type AvisoTurma, type Escopo, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { useCarga } from "../lib/useCarga";
import GerenciarAlunos from "./GerenciarAlunos";

const VAZIO_T: Turma[] = [];
const VAZIO_A: Aluno[] = [];
const VAZIO_AV: AvisoTurma[] = [];

const mapa = (endereco: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
export const whatsapp = (texto: string) => `https://wa.me/?text=${encodeURIComponent(texto)}`;

export default function AdminTurmas({ ehAdmin, escopo }: { ehAdmin: boolean; escopo: Escopo }) {
  const turmas = useCarga(lerTurmas, VAZIO_T);
  const alunos = useCarga(() => listarAlunos(escopo), VAZIO_A);
  const avisos = useCarga(() => lerAvisosTurma(escopo), VAZIO_AV);
  const [editando, setEditando] = useState<string | null>(null);
  const [gerenciando, setGerenciando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ onde: string; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const visiveis = escopo === null ? turmas.dados : turmas.dados.filter((t) => escopo.includes(t.nome));
  const msg = (onde: string) => (aviso?.onde === onde ? <p className="form-note" role="status">{aviso.texto}</p> : null);

  async function rodar(onde: string, acao: () => Promise<void>, ok: string, depois?: () => void) {
    setOcupado(true);
    setAviso({ onde, texto: "Salvando…" });
    try {
      await acao();
      setAviso({ onde, texto: ok });
      depois?.();
    } catch (e) {
      setAviso({ onde, texto: mensagemErro(e) });
    }
    setOcupado(false);
  }

  function nova(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const nome = String(new FormData(form).get("nome") ?? "").trim();
    if (!nome) return setAviso({ onde: "nova", texto: "Escreva o nome da turma." });
    if (turmas.dados.some((t) => t.nome.toLowerCase() === nome.toLowerCase())) return setAviso({ onde: "nova", texto: "Essa turma já existe." });
    void rodar("nova", () => addTurma(nome), `Turma “${nome}” criada. Toque em Editar para preencher local e horários.`, () => (form.reset(), turmas.recarregar()));
  }

  function salvar(e: React.FormEvent<HTMLFormElement>, t: Turma) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const nome = g("nome");
    if (!nome) return setAviso({ onde: t.id, texto: "O nome da turma não pode ficar vazio." });
    if (nome !== t.nome && turmas.dados.some((x) => x.id !== t.id && x.nome.toLowerCase() === nome.toLowerCase())) return setAviso({ onde: t.id, texto: "Já existe outra turma com esse nome." });
    const grupo = g("grupo");
    if (grupo && !/^https:\/\//.test(grupo)) return setAviso({ onde: t.id, texto: "O link do grupo de WhatsApp precisa começar com https://" });
    const dados = { nome, apelido: g("apelido"), descricao: g("descricao"), localNome: g("local"), endereco: g("endereco"), horarios: g("horarios"), grupoWhatsApp: grupo };
    void rodar(
      t.id,
      async () => {
        if (nome !== t.nome) await renomearTurma(t.id, t.nome, nome);
        await salvarTurma(t.id, dados);
      },
      nome !== t.nome ? "Turma salva. O novo nome já vale para os alunos e professores dela." : "Turma salva.",
      () => (setEditando(null), turmas.recarregar(), alunos.recarregar()),
    );
  }

  function novoAviso(e: React.FormEvent<HTMLFormElement>, t: Turma) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const titulo = String(f.get("titulo") ?? "").trim();
    const texto = String(f.get("texto") ?? "").trim();
    if (!titulo || !texto) return setAviso({ onde: "av" + t.id, texto: "Preencha o título e o texto do aviso." });
    void rodar("av" + t.id, () => addAvisoTurma({ turma: t.nome, titulo, texto, data: hojeISO() }), "Aviso publicado para a turma.", () => (form.reset(), avisos.recarregar()));
  }

  return (
    <>
      {ehAdmin && (
        <section className="panel" id="turmas">
          <h2>Turmas</h2>
          <p className="lead">Crie a turma e depois toque em Editar para preencher apelido, descrição, local de treino, horários e o grupo de WhatsApp. Cada turma tem o seu mural de avisos.</p>
          <form className="form inline" onSubmit={nova}>
            <input name="nome" type="text" maxLength={60} placeholder="Nome da nova turma. Ex.: Três Rios" aria-label="Nome da nova turma" autoComplete="off" />
            <button className="btn btn-primary" type="submit" disabled={ocupado}>
              Criar turma
            </button>
          </form>
          {msg("nova")}
        </section>
      )}

      {visiveis.length === 0 && (
        <section className="panel">
          <h2>Minhas turmas</h2>
          <p className="empty">{ehAdmin ? "Nenhuma turma criada ainda." : "Você ainda não foi vinculado a nenhuma turma. Peça ao administrador."}</p>
        </section>
      )}

      {visiveis.map((t) => {
        const qtd = alunos.dados.filter((a) => a.academia === t.nome).length;
        const doAviso = avisos.dados.filter((a) => a.turma === t.nome);
        const rotulo = t.apelido || t.nome;
        return (
          <section className="panel" key={t.id} id={"turma-" + t.id}>
            <h2>{rotulo}</h2>
            {editando === t.id ? (
              <form className="form" onSubmit={(e) => salvar(e, t)}>
                <div className="two">
                  <div className="field">
                    <label>Nome da turma</label>
                    <input name="nome" type="text" maxLength={60} defaultValue={t.nome} autoComplete="off" />
                  </div>
                  <div className="field">
                    <label>Apelido (como aparece no site, opcional)</label>
                    <input name="apelido" type="text" maxLength={60} defaultValue={t.apelido} autoComplete="off" />
                  </div>
                </div>
                <div className="field">
                  <label>Descrição</label>
                  <textarea name="descricao" rows={2} maxLength={300} defaultValue={t.descricao} />
                </div>
                <div className="field">
                  <label>Local de treino (nome)</label>
                  <input name="local" type="text" maxLength={80} defaultValue={t.localNome} placeholder="Ex.: Ginásio Municipal" autoComplete="off" />
                </div>
                <div className="field">
                  <label>Endereço (para abrir no Google Maps)</label>
                  <input name="endereco" type="text" maxLength={200} defaultValue={t.endereco} placeholder="Rua, número, bairro, cidade" autoComplete="off" />
                </div>
                <div className="field">
                  <label>Horários (um por linha)</label>
                  <textarea name="horarios" rows={3} maxLength={400} defaultValue={t.horarios} placeholder={"Terça e quinta, 19h às 20h30\nSábado, 9h às 10h30"} />
                </div>
                <div className="field">
                  <label>Link do grupo de WhatsApp (convite, opcional)</label>
                  <input name="grupo" type="url" inputMode="url" maxLength={200} defaultValue={t.grupoWhatsApp} placeholder="https://chat.whatsapp.com/…" autoComplete="off" />
                </div>
                {t.nome && <p className="form-help">Se mudar o nome, o novo nome vale também para os alunos, os professores e os avisos desta turma.</p>}
                <div className="tool-actions">
                  <button className="btn btn-primary" type="submit" disabled={ocupado}>
                    Salvar turma
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditando(null)}>
                    Cancelar
                  </button>
                </div>
                <GerenciarAlunos turma={t} turmas={turmas.dados} alunos={alunos.dados} onFeito={alunos.recarregar} />
              </form>
            ) : (
              <>
                {t.apelido && <p className="tmeta">Nome oficial: {t.nome}</p>}
                {t.descricao && <p>{t.descricao}</p>}
                <ul className="manage">
                  <li>
                    <span>
                      <strong>Local de treino</strong>
                      <small>{t.localNome || "Ainda não preenchido"}</small>
                      {t.endereco && <small>{t.endereco}</small>}
                    </span>
                    {t.endereco && (
                      <a className="btn btn-ghost" href={mapa(t.endereco)} target="_blank" rel="noopener noreferrer">
                        📍 Mapa
                      </a>
                    )}
                  </li>
                  <li>
                    <span>
                      <strong>Horários</strong>
                      <small className="pre">{t.horarios || "Ainda não preenchidos"}</small>
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Alunos</strong>
                      <small>{qtd} nesta turma</small>
                    </span>
                    {t.grupoWhatsApp && (
                      <a className="btn btn-ghost" href={t.grupoWhatsApp} target="_blank" rel="noopener noreferrer">
                        💬 Grupo
                      </a>
                    )}
                  </li>
                </ul>
                {ehAdmin && (
                  <div className="tool-actions">
                    <button className="btn btn-ghost" onClick={() => setEditando(t.id)}>
                      Editar turma
                    </button>
                    <button className="btn btn-ghost" onClick={() => setGerenciando(gerenciando === t.id ? null : t.id)}>
                      {gerenciando === t.id ? "Fechar alunos" : "Gerenciar alunos"}
                    </button>
                    <button className="btn btn-ghost" disabled={ocupado} onClick={() => window.confirm(`Apagar a turma “${rotulo}”? Os alunos continuam cadastrados, mas ficam sem turma na lista.`) && void rodar(t.id, () => apagarTurma(t.id), "Turma apagada.", turmas.recarregar)}>
                      Apagar turma
                    </button>
                  </div>
                )}
              </>
            )}
            {msg(t.id)}
            {ehAdmin && gerenciando === t.id && <GerenciarAlunos turma={t} turmas={turmas.dados} alunos={alunos.dados} onFeito={alunos.recarregar} />}

            <h3 className="sub">Avisos da turma</h3>
            <form className="form tedit" onSubmit={(e) => novoAviso(e, t)}>
              <div className="field">
                <label>Título (ex.: Sem aula na quinta)</label>
                <input name="titulo" type="text" maxLength={80} autoComplete="off" />
              </div>
              <div className="field">
                <label>Texto</label>
                <textarea name="texto" rows={2} maxLength={600} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={ocupado}>
                Publicar para a turma
              </button>
            </form>
            {msg("av" + t.id)}
            <ul className="manage">
              {doAviso.length === 0 && <li className="empty">Nenhum aviso para esta turma.</li>}
              {doAviso.map((a) => (
                <li key={a.id}>
                  <span>
                    <strong>{a.titulo}</strong>
                    <small>{dataBR(a.data)}</small>
                    <small className="pre">{a.texto}</small>
                  </span>
                  <span className="tlinks">
                    <a className="btn btn-ghost" href={whatsapp(`*${rotulo}*\n*${a.titulo}*\n${a.texto}`)} target="_blank" rel="noopener noreferrer">
                      Enviar no WhatsApp
                    </a>
                    <button className="btn btn-ghost" disabled={ocupado} onClick={() => window.confirm("Apagar este aviso?") && void rodar("av" + t.id, () => apagarAvisoTurma(a.id), "Aviso apagado.", avisos.recarregar)}>
                      Apagar
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
