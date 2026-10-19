"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { apagarCardKata, criarCardKata, enderecoOk, lerKatasDb, montarKatas, salvarMidiaKata, type Imagem, type Video } from "../lib/katasDb";
import { useCarga } from "../lib/useCarga";

const VAZIO: Record<string, never> = {};

export default function AdminKatas() {
  const { dados, recarregar } = useCarga(lerKatasDb, VAZIO as Record<string, never>);
  const katas = montarKatas(dados);
  const [sel, setSel] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const atual = katas.find((k) => k.id === sel) ?? null;

  async function rodar(acao: () => Promise<void>, ok: string, depois?: () => void) {
    setOcupado(true);
    setMsg("");
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

  function novoCard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const nome = String(f.get("nome") ?? "").trim();
    const dan = String(f.get("dan") ?? "").trim();
    const resumo = String(f.get("resumo") ?? "").trim();
    if (!nome) return setMsg("Dê um nome ao card.");
    void rodar(() => criarCardKata(nome, dan, resumo), "Card criado. Selecione-o abaixo para acrescentar vídeos e imagens.", () => form.reset());
  }

  function novoVideo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!atual) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    const titulo = String(f.get("titulo") ?? "").trim();
    const url = String(f.get("url") ?? "").trim();
    if (!enderecoOk(url)) return setMsg("O link do vídeo precisa começar com https://");
    if (atual.videos.length >= 20) return setMsg("Limite de 20 vídeos por card.");
    void rodar(() => salvarMidiaKata(atual.id, [...atual.videos, { titulo, url }], atual.imagens), "Vídeo adicionado.", () => form.reset());
  }

  function novaImagem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!atual) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    const legenda = String(f.get("legenda") ?? "").trim();
    const url = String(f.get("url") ?? "").trim();
    if (!enderecoOk(url)) return setMsg("O endereço da imagem precisa começar com https:// ou com / (arquivo da pasta public).");
    if (atual.imagens.length >= 40) return setMsg("Limite de 40 imagens por card.");
    void rodar(() => salvarMidiaKata(atual.id, atual.videos, [...atual.imagens, { legenda, url }]), "Imagem adicionada.", () => form.reset());
  }

  const tirarVideo = (i: number) => atual && void rodar(() => salvarMidiaKata(atual.id, atual.videos.filter((_: Video, j: number) => j !== i), atual.imagens), "Vídeo removido.");
  const tirarImagem = (i: number) => atual && void rodar(() => salvarMidiaKata(atual.id, atual.videos, atual.imagens.filter((_: Imagem, j: number) => j !== i)), "Imagem removida.");

  return (
    <section className="panel" id="katas">
      <h2>Katas</h2>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}

      <div className="field">
        <label htmlFor="k-sel">Editar o kata</label>
        <select id="k-sel" value={sel} onChange={(e) => setSel(e.target.value)}>
          <option value="">Escolha…</option>
          {katas.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nome} ({k.videos.length} vídeos, {k.imagens.length} imagens)
            </option>
          ))}
        </select>
      </div>

      {atual && (
        <>
          <form className="form tedit" onSubmit={novoVideo}>
            <strong>Vídeos de {atual.nome}</strong>
            <ul className="manage">
              {atual.videos.length === 0 && <li className="empty">Nenhum vídeo ainda.</li>}
              {atual.videos.map((v, i) => (
                <li key={i}>
                  <span>
                    <strong>{v.titulo || `Vídeo ${i + 1}`}</strong>
                    <small className="quebra">{v.url}</small>
                  </span>
                  <button type="button" className="btn btn-ghost" disabled={ocupado} onClick={() => tirarVideo(i)}>
                    Remover
                  </button>
                </li>
              ))}
            </ul>
            <div className="field">
              <label htmlFor="kv-t">Nome do vídeo (ex.: “Em português, explicado”)</label>
              <input id="kv-t" name="titulo" type="text" maxLength={80} autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="kv-u">Link do vídeo</label>
              <input id="kv-u" name="url" type="url" inputMode="url" placeholder="https://…" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={ocupado}>
              Adicionar vídeo
            </button>
          </form>

          <form className="form tedit" onSubmit={novaImagem}>
            <strong>Imagens de {atual.nome}</strong>
            <ul className="manage">
              {atual.imagens.length === 0 && <li className="empty">Nenhuma imagem ainda.</li>}
              {atual.imagens.map((im, i) => (
                <li key={i}>
                  <span>
                    <strong>{im.legenda || `Imagem ${i + 1}`}</strong>
                    <small className="quebra">{im.url}</small>
                  </span>
                  <button type="button" className="btn btn-ghost" disabled={ocupado} onClick={() => tirarImagem(i)}>
                    Remover
                  </button>
                </li>
              ))}
            </ul>
            <div className="field">
              <label htmlFor="ki-l">Legenda</label>
              <input id="ki-l" name="legenda" type="text" maxLength={80} autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="ki-u">Endereço da imagem</label>
              <input id="ki-u" name="url" type="text" inputMode="url" placeholder="/img/katas/nage-no-kata.jpg ou https://…" />
            </div>
            <p className="form-help">Para usar uma imagem sua: coloque o arquivo na pasta public\img\katas do projeto, envie ao GitHub e escreva aqui /img/katas/nome-do-arquivo.jpg</p>
            <button className="btn btn-primary" type="submit" disabled={ocupado}>
              Adicionar imagem
            </button>
          </form>

          {atual.custom && (
            <button
              className="btn btn-ghost"
              disabled={ocupado}
              onClick={() => window.confirm(`Apagar o card “${atual.nome}”?`) && void rodar(() => apagarCardKata(atual.id), "Card apagado.", () => setSel(""))}
            >
              Apagar este card
            </button>
          )}
        </>
      )}

      <details className="novo">
        <summary>Criar um novo card de kata</summary>
        <form className="form" onSubmit={novoCard}>
          <div className="field">
            <label htmlFor="kc-n">Nome</label>
            <input id="kc-n" name="nome" type="text" maxLength={60} autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="kc-d">Para qual graduação</label>
            <input id="kc-d" name="dan" type="text" maxLength={80} autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="kc-r">Resumo</label>
            <textarea id="kc-r" name="resumo" rows={2} maxLength={300} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={ocupado}>
            Criar card
          </button>
        </form>
      </details>
    </section>
  );
}
