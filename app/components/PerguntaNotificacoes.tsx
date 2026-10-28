"use client";

import { useEffect, useState } from "react";
import { ativarNotificacoes, mensagemPush, notificacoesLigadas, notificacoesSuportadas } from "../lib/push";
import { useSite } from "../lib/siteConfig";
import { useAuth } from "../lib/useAuth";

const CHAVE = "dojoPushDecisao";
const DIAS_PARA_PERGUNTAR_DE_NOVO = 30;

/** Ao abrir o site (com a conta), pergunta uma vez se a pessoa quer receber os avisos no celular. */
export default function PerguntaNotificacoes() {
  const { user, perfil } = useAuth();
  const site = useSite();
  const [mostrar, setMostrar] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user || !site.vapidKey) return;
    const t = setTimeout(() => {
      if (!notificacoesSuportadas() || notificacoesLigadas() || Notification.permission === "denied") return;
      let decisao = "";
      try {
        decisao = localStorage.getItem(CHAVE) ?? "";
      } catch {}
      const [resp, quando] = decisao.split("|");
      if (resp === "nao" && Date.now() - Number(quando) < DIAS_PARA_PERGUNTAR_DE_NOVO * 86400000) return;
      setMostrar(true);
    }, 2500);
    return () => clearTimeout(t);
  }, [user, site.vapidKey]);

  if (!mostrar) return null;
  const guardar = (v: string) => {
    try {
      localStorage.setItem(CHAVE, `${v}|${Date.now()}`);
    } catch {}
  };

  return (
    <div className="pergunta-notif" role="dialog" aria-label="Receber notificações">
      <p>
        <b>🔔 Quer receber os avisos do dojô no celular?</b>
        <br />
        Aula cancelada, campeonato novo, presença registrada… Você pode desligar quando quiser.
      </p>
      {msg && <small role="status">{msg}</small>}
      <div className="tool-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() =>
            void ativarNotificacoes(site.vapidKey, { uid: user?.uid ?? "", turma: perfil?.academia ?? "", papel: perfil?.papel ?? "aluno" })
              .then(() => {
                guardar("sim");
                setMostrar(false);
              })
              .catch((e) => setMsg(mensagemPush(e)))
          }
        >
          Sim, quero
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            guardar("nao");
            setMostrar(false);
          }}
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
