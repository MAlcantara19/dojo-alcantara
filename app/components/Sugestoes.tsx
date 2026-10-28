"use client";

import Link from "next/link";
import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { enderecoOk } from "../lib/katasDb";
import { enviarSugestao, lerSugestoes, TIPOS_SUGESTAO, type Sugestao } from "../lib/sugestoesDb";
import { useAuth } from "../lib/useAuth";
import { useCarga } from "../lib/useCarga";
import CampoImagem from "./CampoImagem";
import Img from "./Img";
import Midia from "./Midia";

const VAZIO: Sugestao[] = [];

/** Sugestões, críticas construtivas, elogios e problemas, com imagem e vídeo opcionais. */
export default function Sugestoes() {
  const { user, perfil, carregando } = useAuth();
  const minhas = useCarga(() => lerSugestoes(user?.uid ?? ""), VAZIO, Boolean(user));
  const [msg, setMsg] = useState("");
  const [chave, setChave] = useState(0);
  const [ocupado, setOcupado] = useState(false);

  if (carregando) return <p className="form-help">Carregando…</p>;
  if (!user)
    return (
      <div className="aviso-dia">
        <p>Para mandar uma sugestão, entre com a sua conta (assim o sensei sabe quem mandou e pode te responder).</p>
        <Link className="btn btn-primary" href="/entrar">
          Entrar
        </Link>
      </div>
    );

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const texto = g("texto");
    const imagem = g("imagem");
    const video = g("video");
    if (texto.length < 5) return setMsg("Escreva um pouco mais para a gente entender.");
    if ((imagem && !enderecoOk(imagem)) || (video && !/^https:\/\//.test(video))) return setMsg("A imagem deve ser enviada do celular e o vídeo deve ser um link (YouTube, Drive…) que comece com https://");
    setOcupado(true);
    setMsg("Enviando…");
    try {
      await enviarSugestao({ uid: user?.uid ?? "", nome: perfil?.apelido || perfil?.nome || "Aluno", tipo: g("tipo"), texto: texto.slice(0, 2000), imagem, video });
      setMsg("Obrigado! Sua mensagem chegou ao sensei. A resposta aparece aqui embaixo.");
      setChave((k) => k + 1);
      minhas.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
    setOcupado(false);
  }

  return (
    <>
      <form className="form tedit" onSubmit={(e) => void enviar(e)} key={chave}>
        <div className="field">
          <label htmlFor="sg-tipo">O que você quer mandar?</label>
          <select id="sg-tipo" name="tipo" defaultValue="Sugestão">
            {TIPOS_SUGESTAO.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sg-texto">Conte pra gente</label>
          <textarea id="sg-texto" name="texto" rows={5} maxLength={2000} placeholder="Ex.: seria legal ter um treino de ukemi para as crianças no sábado…" />
        </div>
        <CampoImagem name="imagem" rotulo="Imagem para ilustrar (opcional)" />
        <div className="field">
          <label htmlFor="sg-video">Vídeo (opcional): link do YouTube ou do Drive</label>
          <input id="sg-video" name="video" type="url" inputMode="url" placeholder="https://…" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={ocupado}>
          Enviar
        </button>
        {msg && (
          <p className="form-note" role="status">
            {msg}
          </p>
        )}
      </form>

      <h2 className="sub">Minhas mensagens</h2>
      {minhas.dados.length === 0 && <p className="empty">Você ainda não mandou nenhuma.</p>}
      <ul className="manage">
        {minhas.dados.map((s) => (
          <li key={s.id} className="coluna">
            <span>
              <strong>
                {s.tipo} · <em className={"selo selo-" + s.status.toLowerCase().replace(/\s/g, "-")}>{s.status}</em>
              </strong>
              <small>{new Date(s.ts).toLocaleDateString("pt-BR")}</small>
              <small className="pre">{s.texto}</small>
            </span>
            {s.imagem && <Img className="midia-img" src={s.imagem} alt="Imagem da sugestão" largura={800} />}
            {s.video && <Midia video={s.video} alt="Vídeo da sugestão" />}
            {s.resposta && <p className="resposta-sensei">💬 Resposta do sensei: {s.resposta}</p>}
          </li>
        ))}
      </ul>
    </>
  );
}
