"use client";

import { useSite } from "../lib/siteConfig";
import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { addFoto, apagarFoto, lerGaleria, salvarLegenda, type FotoDoc } from "../lib/galeriaDb";
import { enderecoOk } from "../lib/katasDb";
import { useCarga } from "../lib/useCarga";
import CampoImagem from "./CampoImagem";

const VAZIO: FotoDoc[] = [];

export default function AdminGaleria() {
  const site = useSite();
  const g = useCarga(lerGaleria, VAZIO);
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function rodar(acao: () => Promise<void>, ok: string, depois?: () => void) {
    setOcupado(true);
    setMsg("");
    try {
      await acao();
      setMsg(ok);
      g.recarregar();
      depois?.();
    } catch (e) {
      setMsg(mensagemErro(e));
    }
    setOcupado(false);
  }

  function nova(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const legenda = String(f.get("legenda") ?? "").trim();
    const url = String(f.get("url") ?? "").trim();
    if (!legenda) return setMsg("Escreva uma legenda para a foto.");
    if (/\/folders\//.test(url)) return setMsg("Esse link é de uma PASTA do Drive. Para ligar a pasta à galeria, use a aba Site (“Galeria ligada a uma pasta do Google Drive”). Aqui vai o link de UMA foto.");
    if (!enderecoOk(url)) return setMsg("Escolha uma foto do celular ou cole um link que comece com https://");
    void rodar(() => addFoto(legenda, url), "Foto adicionada.", () => form.reset());
  }

  return (
    <section className="panel" id="galeria">
      <h2>Galeria</h2>
      <div className="aviso-dia" role="note">
        {site.drivePasta ? (
          <>
            <p>
              📁 Pasta do Drive usada na galeria do site: <span className="quebra">{site.drivePasta}</span>
            </p>
            <p className="form-help">As subpastas dela viram álbuns. Para trocar a pasta: Site → Aparência, contatos, fotos e Drive.</p>
            <a className="btn btn-ghost" href={/^https:\/\//.test(site.drivePasta) ? site.drivePasta : `https://drive.google.com/drive/folders/${site.drivePasta}`} target="_blank" rel="noopener noreferrer">
              Abrir a pasta no Drive
            </a>
          </>
        ) : (
          <p>Nenhuma pasta do Drive ligada. Para ligar: Site → Aparência, contatos, fotos e Drive.</p>
        )}
        {site.driveFichas && (
          <p className="form-help">
            Pasta das fichas das técnicas: <span className="quebra">{site.driveFichas}</span>
          </p>
        )}
      </div>
      <p className="lead">{g.dados.length === 0 ? "Enquanto não houver fotos aqui, o site mostra os quadrados de exemplo." : `${g.dados.length} fotos na galeria.`}</p>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <form className="form" onSubmit={nova}>
        <div className="field">
          <label htmlFor="g-l">Legenda</label>
          <input id="g-l" name="legenda" type="text" maxLength={80} autoComplete="off" />
        </div>
        <CampoImagem name="url" rotulo="Foto" ajuda="Escolha uma foto do celular, ou cole o link de UMA foto (do Drive, por exemplo). Para ligar uma pasta inteira do Drive, use a aba Site." />
        <button className="btn btn-primary" type="submit" disabled={ocupado}>
          Adicionar foto
        </button>
      </form>
      <ul className="manage">
        {g.dados.map((f) => (
          <li key={f.id}>
            <span>
              <input
                className="mini"
                aria-label="Legenda"
                defaultValue={f.legenda}
                maxLength={80}
                onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== f.legenda && void rodar(() => salvarLegenda(f.id, e.target.value.trim()), "Legenda salva.")}
              />
              <small className="quebra">{f.url}</small>
            </span>
            <button className="btn btn-ghost" disabled={ocupado} onClick={() => window.confirm("Apagar esta foto da galeria?") && void rodar(() => apagarFoto(f.id), "Foto apagada.")}>
              Apagar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
