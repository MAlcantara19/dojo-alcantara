"use client";

import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import type { Aluno } from "../lib/aluno";
import { registrarAtividade } from "../lib/atividades";
import { mensagemErro } from "../lib/auth";
import { getDb } from "../lib/firebase";
import { lerAjuste } from "../lib/fotoAjuste";
import { enderecoOk } from "../lib/katasDb";
import EditorFoto from "./EditorFoto";

/** Foto de perfil e banner de uma pessoa (ela mesma ou a equipe pode mudar). */
export default function FotosConta({ a, onSalvo, avisarAdmin = false }: { a: Aluno; onSalvo: () => void; avisarAdmin?: boolean }) {
  const [msg, setMsg] = useState("");

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const foto = g("foto");
    const banner = g("banner");
    if ((foto && !enderecoOk(foto)) || (banner && !enderecoOk(banner))) return setMsg("Escolha as imagens pelo botão do celular ou cole links que comecem com https://");
    const aj = (k: string) => {
      try {
        return lerAjuste(JSON.parse(g(k) || "{}"));
      } catch {
        return lerAjuste({});
      }
    };
    setMsg("Salvando…");
    try {
      await updateDoc(doc(getDb(), "users", a.uid), { foto, fotoAjuste: aj("fotoAjuste"), banner, bannerAjuste: aj("bannerAjuste") });
      if (avisarAdmin && (foto !== (a.foto ?? "") || banner !== (a.banner ?? ""))) void registrarAtividade(a.uid, a.apelido || a.nome, "mudou a foto de perfil ou o banner", a.academia ?? "");
      setMsg("Fotos salvas.");
      onSalvo();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  return (
    <form className="form tedit" onSubmit={(e) => void salvar(e)}>
      <strong>Foto de perfil e banner</strong>
      <EditorFoto name="foto" rotulo="Foto de perfil" valorInicial={a.foto ?? ""} ajusteInicial={a.fotoAjuste} formato="redondo" faixa={a.faixa} nome={a.apelido || a.nome} />
      <EditorFoto name="banner" rotulo="Banner (imagem larga no topo do perfil, opcional)" valorInicial={a.banner ?? ""} ajusteInicial={a.bannerAjuste} formato="banner" />
      <button className="btn btn-primary" type="submit">
        Salvar fotos
      </button>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
    </form>
  );
}
