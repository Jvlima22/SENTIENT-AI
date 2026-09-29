import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { ROOT } from "./shared";
import "./community.css";

import { saveCampaign } from "./access";

// Link curto colocado na DM automática: /c/cnpj -> /comunidade/biblioteca/<material>
export default function CampaignLink() {
  const { keyword } = useParams();
  const nav = useNavigate();
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    api.get(ROOT + "/go/" + encodeURIComponent(keyword), { signal: controller.signal })
      .then(r => {
        // A origem fica guardada até a pessoa criar conta; quem já é membro cai direto no material.
        saveCampaign({ source: "instagram", keyword: keyword.replace(/[^A-Za-z0-9]/g, "").slice(0, 30).toUpperCase(), resource_slug: r.data.slug });
        nav(`/comunidade/biblioteca/${r.data.slug}`, { replace: true });
      })
      .catch(() => { if (!controller.signal.aborted) setMissing(true); });
    return () => controller.abort();
  }, [keyword, nav]);
  return <div className="community-app"><div className="c-empty" style={{ paddingTop: 120 }} role="status">
    {missing ? <><h1>Esse link não está ativo</h1><p>O material pode ter mudado de endereço. Procure pelo assunto na biblioteca.</p><Link className="c-button primary" to="/comunidade/biblioteca">Abrir a biblioteca</Link></>
      : <><Loader2 className="c-spin" size={24} /> Abrindo seu material…</>}
  </div></div>;
}
