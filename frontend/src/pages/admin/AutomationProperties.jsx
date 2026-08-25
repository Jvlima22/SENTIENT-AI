import { useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, Clock3, Copy, ExternalLink, Loader2, Play, ShieldAlert, XCircle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const STATUS_COPY = {
  active: { label: "Ativo", className: "status-pill-active" },
  idle: { label: "Ocioso", className: "status-pill-idle" },
  error: { label: "Erro", className: "status-pill-error" },
  waiting_approval: { label: "Aguardando aprovação", className: "status-pill-approval" },
};

function formatDate(date) {
  if (!date) return "Nunca executado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(date));
}

function formatDuration(seconds) {
  return `${Number(seconds || 0).toFixed(1)}s`;
}

function ExecutionIcon({ status }) {
  if (status === "success") return <CheckCircle2 size={14} />;
  if (status === "error") return <XCircle size={14} />;
  if (status === "waiting_approval" || status === "blocked") return <ShieldAlert size={14} />;
  return <Activity size={14} />;
}

export default function AutomationProperties({ node, onRunComplete }) {
  const [activeTab, setActiveTab] = useState("properties");
  const [stats, setStats] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setActiveTab("properties");
    setStats(null);
    setExecutions([]);
    if (!node) return undefined;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get(`/nodes/${node.id}/stats`),
      api.get(`/nodes/${node.id}/executions`),
    ]).then(([statsResponse, executionsResponse]) => {
      if (cancelled) return;
      setStats(statsResponse.data);
      setExecutions(executionsResponse.data);
    }).catch(() => {
      if (!cancelled) toast.error("Não foi possível carregar os detalhes deste nó.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [node]);

  const canRun = node?.type === "agent" && node?.status !== "waiting_approval";
  const status = STATUS_COPY[node?.status] || { label: "Sem status", className: "status-pill-idle" };
  const nodeMeta = useMemo(() => node?.meta || {}, [node]);

  const handleRun = async () => {
    if (!node || !canRun) return;
    setRunning(true);
    try {
      await api.post(`/automations/${node.id}/run`, { trigger: "manual" });
      toast.success(`${node.name} colocado em execução.`);
      const [statsResponse, executionsResponse] = await Promise.all([
        api.get(`/nodes/${node.id}/stats`),
        api.get(`/nodes/${node.id}/executions`),
      ]);
      setStats(statsResponse.data);
      setExecutions(executionsResponse.data);
      onRunComplete?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Não foi possível executar este agente.");
    } finally {
      setRunning(false);
    }
  };

  const copyId = async () => {
    if (!node) return;
    await navigator.clipboard?.writeText(node.id);
    toast.success("ID copiado.");
  };

  if (!node) {
    return (
      <aside className="properties-panel properties-empty" data-testid="properties-panel-empty">
        <div className="empty-orbit"><Activity size={22} /></div>
        <h2>Selecione um nó</h2>
        <p>Explore a topologia ao centro e selecione um agente ou conexão para inspecionar seus detalhes.</p>
      </aside>
    );
  }

  return (
    <aside className="properties-panel" data-testid="properties-panel">
      <div className="properties-heading">
        <div className="properties-node-icon" style={{ "--node-color": node.color || "#94A3B8" }}>
          <Activity size={18} />
        </div>
        <div className="min-w-0">
          <p className="eyebrow">{node.type === "agent" ? "AGENTE OPERACIONAL" : node.type.toUpperCase()}</p>
          <h2 title={node.name}>{node.name}</h2>
        </div>
      </div>
      <div className={`status-pill ${status.className}`}><span className="status-pill-dot" />{status.label}</div>

      <div className="properties-tabs" role="tablist">
        <button type="button" className={activeTab === "properties" ? "is-active" : ""} onClick={() => setActiveTab("properties")} role="tab" aria-selected={activeTab === "properties"} data-testid="properties-tab">Propriedades</button>
        <button type="button" className={activeTab === "executions" ? "is-active" : ""} onClick={() => setActiveTab("executions")} role="tab" aria-selected={activeTab === "executions"} data-testid="executions-tab">Execuções <span>{executions.length}</span></button>
      </div>

      {loading ? (
        <div className="properties-loading"><Loader2 size={19} className="spin" /> Sincronizando detalhes…</div>
      ) : activeTab === "properties" ? (
        <div className="properties-content">
          <div className="description-block">
            <p className="eyebrow">DESCRIÇÃO</p>
            <p>{nodeMeta.description || "Sem descrição cadastrada para este nó."}</p>
          </div>
          <dl className="properties-list">
            <div><dt>ID do nó</dt><dd className="mono-value id-value" title={node.id}>{node.id}<button type="button" onClick={copyId} aria-label="Copiar ID"><Copy size={12} /></button></dd></div>
            <div><dt>Categoria</dt><dd><span className="category-dot" style={{ backgroundColor: node.color }} />{node.category || "Estrutural"}</dd></div>
            {nodeMeta.model && <div><dt>Modelo</dt><dd>{nodeMeta.model}</dd></div>}
            {nodeMeta.provider && <div><dt>Provedor</dt><dd>{nodeMeta.provider}</dd></div>}
            <div><dt>Última execução</dt><dd>{formatDate(stats?.last_execution || node.last_execution)}</dd></div>
          </dl>
          <div className="stats-grid">
            <div><span>Execuções 24h</span><strong>{stats?.executions_24h ?? "—"}</strong></div>
            <div><span>Taxa de sucesso</span><strong>{stats ? `${stats.success_rate}%` : "—"}</strong></div>
            <div><span>Tempo médio</span><strong>{stats ? formatDuration(stats.avg_time_seconds) : "—"}</strong></div>
          </div>
          <div className="properties-actions">
            <button type="button" className="primary-action" disabled={!canRun || running} onClick={handleRun} data-testid="run-selected-button">
              {running ? <Loader2 size={15} className="spin" /> : <Play size={15} fill="currentColor" />}
              {running ? "Executando…" : node.status === "waiting_approval" ? "Aguardando aprovação" : "Executar agente"}
            </button>
            <a href={nodeMeta.n8n_url || "#"} className={`secondary-action ${nodeMeta.n8n_url ? "" : "is-disabled"}`} onClick={(event) => !nodeMeta.n8n_url && event.preventDefault()} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Editar no n8n
            </a>
          </div>
        </div>
      ) : (
        <div className="execution-list">
          {executions.length === 0 ? <p className="muted-copy">Nenhuma execução registrada para este nó.</p> : executions.map((execution) => (
            <div className="execution-item" key={execution.id}>
              <div className={`execution-status execution-status-${execution.status}`}><ExecutionIcon status={execution.status} /></div>
              <div className="execution-main"><strong>{execution.status === "success" ? "Concluída" : execution.status === "error" ? "Falhou" : "Pendente"}</strong><span>{formatDate(execution.finished_at || execution.started_at)}</span></div>
              <span className="execution-duration"><Clock3 size={11} />{formatDuration(execution.duration_seconds)}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
