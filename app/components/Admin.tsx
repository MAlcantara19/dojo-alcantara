"use client";

import { signOut } from "firebase/auth";
import { useState } from "react";
import { ehEquipe } from "../lib/auth";
import { getAuthInstance } from "../lib/firebase";
import { useResultadosEquipe } from "../lib/resultados";
import { useAuth } from "../lib/useAuth";
import AdminAlunos from "./AdminAlunos";
import AdminAulas from "./AdminAulas";
import AdminEquipe from "./AdminEquipe";
import AdminEstudo from "./AdminEstudo";
import AdminFichas from "./AdminFichas";
import AdminGaleria from "./AdminGaleria";
import AdminKatas from "./AdminKatas";
import AdminMural from "./AdminMural";
import AdminResultados from "./AdminResultados";
import AdminResumo from "./AdminResumo";
import AdminSite from "./AdminSite";
import AdminTurmas from "./AdminTurmas";
import AdminTecnicas from "./AdminTecnicas";
import LoginForm from "./LoginForm";

type Aba = "resumo" | "mural" | "turmas" | "alunos" | "aulas" | "conteudo" | "estudo" | "resultados" | "equipe" | "site";

export default function Admin() {
  const { carregando, user, perfil } = useAuth();

  if (carregando) return <p className="form-help">Verificando seu acesso…</p>;

  if (!user) {
    return (
      <>
        <p className="lead">Entre com a conta de professor para editar o site.</p>
        <LoginForm destino="/admin" />
      </>
    );
  }

  if (!ehEquipe(perfil)) {
    return (
      <>
        <p className="notice" role="alert">
          Esta conta não tem permissão de professor. Se isso é um engano, peça ao administrador para liberar o seu acesso.
        </p>
        <button className="btn btn-ghost" onClick={() => signOut(getAuthInstance())}>
          Sair
        </button>
      </>
    );
  }

  return <Painel nome={perfil?.nome ?? "sem nome"} email={user.email ?? ""} uid={user.uid} ehAdmin={perfil?.papel === "admin"} turmas={perfil?.turmas ?? []} />;
}

function Painel({ nome, email, uid, ehAdmin, turmas }: { nome: string; email: string; uid: string; ehAdmin: boolean; turmas: string[] }) {
  const escopo = ehAdmin ? null : turmas;
  const [aba, setAba] = useState<Aba>("resumo");
  const res = useResultadosEquipe(escopo);

  const abas: [Aba, string][] = [
    ["resumo", "Resumo"],
    ["mural", "Mural"],
    ["turmas", "Turmas"],
    ["alunos", "Alunos"],
    ["aulas", "Aulas"],
    ["conteudo", "Conteúdo"],
    ["estudo", "Estudo"],
    ["resultados", res.novos > 0 ? `Resultados (${res.novos})` : "Resultados"],
    ...(ehAdmin ? ([["equipe", "Equipe"], ["site", "Site"]] as [Aba, string][]) : []),
  ];

  return (
    <>
      <div className="admin-top">
        <div>
          <span className={"papel " + (ehAdmin ? "papel-admin" : "papel-prof")}>{ehAdmin ? "Administrador" : "Professor"}</span>
          <p className="lead">
            Olá, {nome}.{email && !email.endsWith("@celular.dojoalcantara.app") ? ` (${email})` : ""} O que você publicar aparece no site na hora.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => signOut(getAuthInstance())}>
          Sair
        </button>
      </div>

      {res.novos > 0 && aba !== "resultados" && (
        <button className="aviso-novo" onClick={() => setAba("resultados")}>
          🔔 {res.novos} {res.novos === 1 ? "simulado novo foi concluído" : "simulados novos foram concluídos"}. Ver resultados
        </button>
      )}

      <div className="tabs tabs-scroll" role="tablist" aria-label="Seções do painel">
        {abas.map(([k, r]) => (
          <button key={k} role="tab" aria-selected={aba === k} onClick={() => setAba(k)}>
            {r}
          </button>
        ))}
      </div>

      <div className="aba" key={aba}>
        {aba === "resumo" && <AdminResumo uid={uid} escopo={escopo} novosResultados={res.novos} ir={(x) => setAba(x)} />}
        {aba === "mural" && <AdminMural />}
        {aba === "turmas" && <AdminTurmas ehAdmin={ehAdmin} escopo={escopo} />}
        {aba === "alunos" && <AdminAlunos ehAdmin={ehAdmin} escopo={escopo} />}
        {aba === "aulas" && <AdminAulas uid={uid} />}
        {aba === "conteudo" && (
          <>
            <AdminTecnicas />
            <AdminFichas />
            <AdminKatas />
            <AdminGaleria />
          </>
        )}
        {aba === "estudo" && <AdminEstudo />}
        {aba === "equipe" && ehAdmin && <AdminEquipe />}
        {aba === "site" && ehAdmin && <AdminSite />}
        {aba === "resultados" && <AdminResultados itens={res.dados} carregando={res.carregando} erro={res.erro} visto={res.visto} marcarVisto={res.marcarVisto} />}
      </div>
    </>
  );
}
