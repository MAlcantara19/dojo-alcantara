"use client";

import { useRef, useState } from "react";
import { enviarImagem, mensagemUpload, prepararImagem } from "../lib/imagens";
import { enderecoOk } from "../lib/katasDb";
import Img from "./Img";

/** Campo de imagem do painel: escolher da galeria/câmera do celular, ou colar um link. */
export default function CampoImagem({ name, rotulo, valorInicial = "", ajuda, onMudar }: { name: string; rotulo: string; valorInicial?: string; ajuda?: string; onMudar?: (v: string) => void }) {
  const [valor, setValorInterno] = useState(valorInicial);
  const setValor = (v: string) => {
    setValorInterno(v);
    onMudar?.(v);
  };
  const [estado, setEstado] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setOcupado(true);
    setEstado("Reduzindo e enviando a imagem…");
    try {
      const dados = await prepararImagem(f);
      const ref = await enviarImagem(dados);
      setValor(ref);
      setEstado(`Imagem enviada (${Math.round(dados.length / 1024)} KB). Lembre de salvar o formulário.`);
    } catch (err) {
      setEstado(mensagemUpload(err));
    }
    setOcupado(false);
  }

  return (
    <div className="field campo-img">
      <label htmlFor={`ci-${name}`}>{rotulo}</label>
      {valor && enderecoOk(valor) && (
        <div className="prev">
          <Img src={valor} alt="Prévia da imagem" largura={500} eager />
        </div>
      )}
      <div className="tool-actions">
        <input ref={arquivo} type="file" accept="image/*" hidden onChange={(e) => void escolher(e)} />
        <button type="button" className="btn btn-ghost" disabled={ocupado} onClick={() => arquivo.current?.click()}>
          {ocupado ? "Enviando…" : valor ? "Trocar imagem" : "Escolher imagem do celular"}
        </button>
        {valor && (
          <button type="button" className="btn btn-ghost" onClick={() => (setValor(""), setEstado(""))}>
            Remover
          </button>
        )}
      </div>
      <input id={`ci-${name}`} name={name} type="text" inputMode="url" placeholder="ou cole um link (https://… ou /img/…)" value={valor.startsWith("db:") ? "" : valor} onChange={(e) => setValor(e.target.value.trim())} disabled={valor.startsWith("db:")} />
      {valor.startsWith("db:") && <input type="hidden" name={name} value={valor} />}
      {estado && (
        <p className="form-help" role="status">
          {estado}
        </p>
      )}
      {ajuda && <p className="form-help">{ajuda}</p>}
    </div>
  );
}
