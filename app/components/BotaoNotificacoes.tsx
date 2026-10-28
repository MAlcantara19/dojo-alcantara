"use client";

import { useEffect, useState } from "react";
import { ativarNotificacoes, desativarNotificacoes, mensagemPush, notificacoesLigadas, notificacoesSuportadas } from "../lib/push";
import { useSite } from "../lib/siteConfig";
import { useAuth } from "../lib/useAuth";

/** Liga/desliga as notificações no celular desta pessoa. */
export default function BotaoNotificacoes({ compacto = false }: { compacto?: boolean }) {
  const { user, perfil } = useAuth();
  const site = useSite();
  const [ligado, setLigado] = useState(false);
  const [suporta, setSuporta] = useState(true);
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSuporta(notificacoesSuportadas());
      setLigado(notificacoesLigadas());
    }, 0);
    return () => clearTimeout(t);
  }, []);

  if (!user || !site.vapidKey) return null;
  async function alternar() {
    setOcupado(true);
    try {
      if (ligado) {
        await desativarNotificacoes();
        setLigado(false);
        setMsg("Notificações desligadas neste aparelho.");
      } else {
        await ativarNotificacoes(site.vapidKey, { uid: user?.uid ?? "", turma: perfil?.academia ?? "", papel: perfil?.papel ?? "aluno" });
        setLigado(true);
        setMsg("Pronto! Você vai receber os avisos neste aparelho.");
      }
    } catch (e) {
      setMsg(mensagemPush(e));
    }
    setOcupado(false);
  }

  return (
    <div className={"notif" + (compacto ? " compacto" : "")}>
      <button type="button" className={"btn " + (ligado ? "btn-ghost" : "btn-primary")} disabled={ocupado || !suporta} onClick={() => void alternar()}>
        {ligado ? "🔕 Desligar notificações neste aparelho" : "🔔 Receber avisos no celular"}
      </button>
      {!suporta && <small>Este navegador não recebe notificações. No iPhone, instale o site na tela de início primeiro.</small>}
      {msg && <small role="status">{msg}</small>}
    </div>
  );
}
