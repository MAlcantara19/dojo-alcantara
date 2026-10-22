"use client";

import { signOut } from "firebase/auth";
import { lerTurmas, type Turma } from "../lib/alunos";
import { ehEquipe } from "../lib/auth";
import { useCarga } from "../lib/useCarga";
import { getAuthInstance } from "../lib/firebase";
import { useResultadosEquipe } from "../lib/resultados";
import { useAuth } from "../lib/useAuth";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ABAS_ADMIN, type Aba } from "../lib/abasAdmin";
import AdminAlunos from "./AdminAlunos";
import AdminAulas from "./AdminAulas";
import AdminCampeonatos from "./AdminCampeonatos";
import AdminChamada from "./AdminChamada";
import AdminEquipe from "./AdminEquipe";
import AdminEstudoTudo from "./AdminEstudoTudo";
import AdminGaleria from "./AdminGaleria";
import AdminMural from "./AdminMural";
import AdminParcerias from "./AdminParcerias";
import AdminResultadosTudo from "./AdminResultadosTudo";
import AdminResumo from "./AdminResumo";
import AdminSiteTudo from "./AdminSiteTudo";
import AdminTurmas from "./AdminTurmas";
import LoginForm from "./LoginForm";

const VAZIO_TURMAS: Turma[] = [];
const assinarHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

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
  // A aba fica no endereço (/admin#alunos), assim o menu lateral leva direto a ela.
  const hash = useSyncExternalStore(assinarHash, () => window.location.hash.slice(1), () => "");
  const aba: Aba = ABAS_ADMIN.some(([k, , soAdmin]) => k === hash && (ehAdmin || !soAdmin)) ? (hash as Aba) : "resumo";
  const setAba = (k: Aba) => {
    window.location.hash = k;
  };
  const res = useResultadosEquipe(escopo);
  const todasTurmas = useCarga(lerTurmas, VAZIO_TURMAS);
  const minhasTurmas = escopo === null ? todasTurmas.dados : todasTurmas.dados.filter((t) => escopo.includes(t.nome));

  const abas: [Aba, string][] = ABAS_ADMIN.filter(([, , soAdmin]) => ehAdmin || !soAdmin).map(([k, r]) => [k, k === "resultados" && res.novos > 0 ? `${r} (${res.novos})` : r]);

  return (
    <>
      <div className="admin-top">
        <div>
          <span className={"papel " + (ehAdmin ? "papel-admin" : "papel-prof")}>{ehAdmin ? "Administrador" : "Professor"}</span>
          <p className="lead">
            Olá, {nome}.{email && !email.endsWith("@celular.dojoalcantara.app") ? ` (${email})` : ""} O que você publicar aparece no site na hora.
          </p>
        </div>
        <span className="tool-actions">
          <Link className="btn btn-ghost" href="/perfil#conta">
            Meu cadastro
          </Link>
          <button className="btn btn-ghost" onClick={() => signOut(getAuthInstance())}>
            Sair
          </button>
        </span>
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
        {aba === "resumo" && <AdminResumo uid={uid} escopo={escopo} novosResultados={res.novos} ir={(x) => setAba(x)} ehAdmin={ehAdmin} />}
        {aba === "mural" && <AdminMural turmas={minhasTurmas} autor={nome} ehAdmin={ehAdmin} />}
        {aba === "turmas" && <AdminTurmas ehAdmin={ehAdmin} escopo={escopo} />}
        {aba === "alunos" && <AdminAlunos ehAdmin={ehAdmin} escopo={escopo} autor={nome} />}
        {aba === "chamada" && <AdminChamada autor={nome} turmasPermitidas={escopo} />}
        {aba === "campeonatos" && <AdminCampeonatos autor={nome} ehAdmin={ehAdmin} minhasTurmas={turmas} />}
        {aba === "aulas" && <AdminAulas uid={uid} />}
        {aba === "estudo" && <AdminEstudoTudo />}
        {aba === "galeria" && <AdminGaleria />}
        {aba === "resultados" && <AdminResultadosTudo escopo={escopo} res={res} />}
        {aba === "equipe" && ehAdmin && <AdminEquipe />}
        {aba === "parcerias" && ehAdmin && <AdminParcerias />}
        {aba === "site" && ehAdmin && <AdminSiteTudo />}
      </div>
    </>
  );
}
