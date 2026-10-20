"use client";

import { useState } from "react";
import { registrarAtividade } from "../lib/atividades";
import { mensagemErro } from "../lib/auth";
import { addGaleriaAluno, apagarGaleriaAluno, lerGaleriaAluno, type ItemGaleria } from "../lib/campeonatos";
import { enderecoOk } from "../lib/katasDb";
import { useCarga } from "../lib/useCarga";
import CampoImagem from "./CampoImagem";
import Img from "./Img";
import Midia from "./Midia";

const VAZIO: ItemGaleria[] = [];
const ehImagem = (u: string) => u.startsWith("db:") || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u);

/** Fotos e vídeos do perfil do aluno: o próprio aluno e o professor podem colocar. */
export default function GaleriaAluno({ uid, autor, avisarAdmin }: { uid: string; autor: string; avisarAdmin: boolean }) {
  const g = useCarga(() => lerGaleriaAluno(uid), VAZIO);
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [chave, setChave] = useState(0);

  async function adicionar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const legenda = String(new FormData(e.currentTarget).get("legenda") ?? "").trim().slice(0, 120);
    if (!url || !enderecoOk(url)) return setMsg("Escolha uma foto do celular ou cole um link de foto ou vídeo (https://).");
    setMsg("Salvando…");
    try {
      await addGaleriaAluno(uid, { url, legenda, autor });
      if (avisarAdmin) void registrarAtividade(uid, autor, `adicionou ${ehImagem(url) ? "uma foto" : "um vídeo"} ao perfil${legenda ? `: “${legenda}”` : ""}`);
      setMsg("Adicionado.");
      setUrl("");
      setChave((k) => k + 1);
      g.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  return (
    <div className="galeria-aluno">
      <form className="form tedit" onSubmit={(e) => void adicionar(e)} key={chave}>
        <CampoImagem name="url" rotulo="Foto (do celular) ou link de foto ou vídeo" onMudar={setUrl} />
        <div className="field">
          <label>Legenda (opcional)</label>
          <input name="legenda" type="text" maxLength={120} placeholder="Ex.: Campeonato Estadual 2026" autoComplete="off" />
        </div>
        <button className="btn btn-primary" type="submit">
          Adicionar
        </button>
        {msg && (
          <p className="form-note" role="status">
            {msg}
          </p>
        )}
      </form>
      {g.dados.length === 0 && !g.carregando && <p className="empty">Nenhuma foto ou vídeo ainda.</p>}
      <div className="galeria-aluno-grade">
        {g.dados.map((x) => (
          <figure key={x.id}>
            {ehImagem(x.url) ? <Img src={x.url} alt={x.legenda || "Foto do perfil"} largura={600} /> : <Midia video={x.url} alt={x.legenda || "Vídeo"} />}
            <figcaption>
              {x.legenda && <b>{x.legenda}</b>}
              <small>por {x.autor}</small>
              <button type="button" className="link-btn" onClick={() => window.confirm("Tirar este item?") && void apagarGaleriaAluno(uid, x.id).then(g.recarregar)}>
                Tirar
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
