"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { addFoto, apagarFoto, lerGaleria, salvarLegenda, type FotoDoc } from "../lib/galeriaDb";
import { enderecoOk } from "../lib/katasDb";
import { useCarga } from "../lib/useCarga";

const VAZIO: FotoDoc[] = [];

export default function AdminGaleria() {
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
    if (!enderecoOk(url)) return setMsg("O endereço da foto precisa começar com https:// ou com / (arquivo da pasta public).");
    void rodar(() => addFoto(legenda, url), "Foto adicionada.", () => form.reset());
  }

  return (
    <section className="panel" id="galeria">
      <h2>Galeria</h2>
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
        <div className="field">
          <label htmlFor="g-u">Endereço da foto</label>
          <input id="g-u" name="url" type="text" inputMode="url" placeholder="/img/galeria/treino.jpg ou https://…" />
        </div>
        <p className="form-help">Coloque o arquivo em public\img\galeria do projeto, envie ao GitHub e use /img/galeria/nome.jpg. O envio de fotos pelos alunos, com a sua aprovação, precisa de um local de armazenamento e fica para a próxima etapa.</p>
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
