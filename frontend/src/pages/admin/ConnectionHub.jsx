import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Bot,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  Database,
  FolderKanban,
  LayoutDashboard,
  Loader2,
  Menu,
  MessagesSquare,
  Network,
  Package,
  Play,
  Plus,
  RefreshCw,
  Settings2,
  Sparkles,
  TerminalSquare,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import ConnectionTree from "./ConnectionTree";
import AutomationProperties from "./AutomationProperties";
import "./connection-hub.css";

const TECH_STACK = [
  { label: "React 19", icon: Sparkles, color: "#61DAFB" },
  { label: "FastAPI", icon: Network, color: "#2DD4BF" },
  { label: "MongoDB", icon: Database, color: "#22C55E" },
  { label: "n8n", icon: Workflow, color: "#FB923C" },
];

const NAV_ITEMS = [
  { label: "Visão geral", icon: LayoutDashboard, active: true },
  { label: "Automações", icon: Workflow, to: "/admin" },
  { label: "Produtos", icon: Package, to: "/admin/produtos" },
  { label: "Categorias", icon: FolderKanban, to: "/admin/categorias" },
  { label: "Leads", icon: Users, to: "/admin/leads" },
];

const CONNECTOR_GROUPS = [
  { label: "Comunicação", icon: MessagesSquare, color: "#22D3EE" },
  { label: "Automação", icon: Workflow, color: "#FB923C" },
  { label: "IA / Agentes", icon: Bot, color: "#A78BFA" },
  { label: "Dados", icon: Database, color: "#2DD4BF" },
];

function flattenTree(node, result = []) {
  if (!node) return result;
  result.push(node);
  node.children?.forEach((child) => flattenTree(child, result));
  return result;
}

function formatCurrency(cents) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format((cents || 0) / 100);
}

function StatusCard({ label, value, detail, accent = "#22D3EE" }) {
  return (
    <div className="status-card" data-testid={`status-card-${label.toLowerCase().replaceAll(" ", "-")}`}>
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      <span className="status-card-detail" style={{ color: accent }}>{detail}</span>
    </div>
  );
}

function NewAutomationModal({ onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="new-automation-modal" role="dialog" aria-modal="true" aria-labelledby="new-automation-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar"><X size={17} /></button>
        <div className="modal-orbit"><Plus size={20} /></div>
        <p className="eyebrow">NOVA AUTOMAÇÃO</p>
        <h2 id="new-automation-title">Expanda a sua operação</h2>
        <p>O construtor visual de automações será a próxima camada do hub. Por enquanto, conecte um workflow no n8n e ele aparecerá nesta topologia.</p>
        <div className="modal-roadmap"><Check size={14} /> Catálogo de agentes persistido no MongoDB</div>
        <div className="modal-roadmap"><Check size={14} /> Execução manual com histórico</div>
        <div className="modal-roadmap is-pending"><Clock3 size={14} /> Editor visual em breve</div>
        <button className="primary-action modal-action" type="button" onClick={onClose}>Entendi</button>
      </div>
    </div>
  );
}

export default function ConnectionHub() {
  const [tree, setTree] = useState(null);
  const [status, setStatus] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningAll, setRunningAll] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [treeResponse, statusResponse] = await Promise.all([api.get("/tree"), api.get("/status")]);
      setTree(treeResponse.data);
      setStatus(statusResponse.data);
      setSelectedNode((current) => {
        const nodes = flattenTree(treeResponse.data);
        return nodes.find((node) => node.id === current?.id) || nodes[0] || null;
      });
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Não foi possível sincronizar o hub operacional.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const runAll = async () => {
    setRunningAll(true);
    try {
      const response = await api.post("/automations/run-all");
      const result = response.data;
      if (result.failed > 0) toast.error(`${result.failed} automação(ões) falharam. Verifique as execuções.`);
      else if (result.blocked > 0) toast.warning(`${result.succeeded} executadas; ${result.blocked} aguardando aprovação.`);
      else toast.success(`${result.succeeded} automação(ões) executadas com sucesso.`);
      await loadData();
    } catch (requestError) {
      toast.error(requestError.response?.data?.detail || "Não foi possível executar as automações.");
    } finally {
      setRunningAll(false);
    }
  };

  const selectedCategory = selectedNode?.category;
  const totalNodes = useMemo(() => flattenTree(tree).length, [tree]);

  return (
    <div className="connection-hub" data-testid="connection-hub">
      <header className="hub-header">
        <div className="hub-brand">
          <button className="mobile-menu-button" type="button" onClick={() => setSidebarOpen((open) => !open)} aria-label="Abrir menu"><Menu size={18} /></button>
          <div className="brand-mark"><span /><span /><span /></div>
          <div><strong>SENTIENT</strong><small>OPERATIONS HUB</small></div>
        </div>
        <div className="hub-header-center"><span className="live-pulse" /> Topologia operacional <span className="header-separator">/</span> <span className="muted-copy">{totalNodes || "—"} nós conectados</span></div>
        <div className="hub-header-actions">
          <div className={`api-status ${status?.api_online ? "is-online" : ""}`}><CircleDot size={13} /> API {status?.api_online ? "online" : "offline"}</div>
          <button className="secondary-action header-action" type="button" onClick={loadData} disabled={loading} data-testid="refresh-hub-button"><RefreshCw size={14} className={loading ? "spin" : ""} /> Atualizar</button>
          <button className="primary-action header-action" type="button" onClick={runAll} disabled={runningAll || loading} data-testid="run-all-button">{runningAll ? <Loader2 size={14} className="spin" /> : <Play size={14} fill="currentColor" />} {runningAll ? "Executando" : "Executar tudo"}</button>
          <button className="new-automation-button" type="button" onClick={() => setShowModal(true)} data-testid="new-automation-button"><Plus size={15} /> Nova automação</button>
        </div>
      </header>

      <div className={`hub-body ${sidebarOpen ? "sidebar-is-open" : ""}`}>
        <aside className="hub-sidebar">
          <div className="sidebar-scroll">
            <div className="sidebar-section">
              <span className="sidebar-label">Workspace</span>
              <nav className="hub-nav">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return item.to ? <Link key={item.label} to={item.to} className={`hub-nav-item ${item.active ? "is-active" : ""}`} onClick={() => setSidebarOpen(false)}><Icon size={16} />{item.label}{item.active && <span className="nav-active-indicator" />}</Link> : <div key={item.label} className="hub-nav-item is-active"><Icon size={16} />{item.label}<span className="nav-active-indicator" /></div>;
                })}
              </nav>
            </div>
            <div className="sidebar-section connector-section">
              <span className="sidebar-label">Conectores</span>
              <div className="connector-list">
                {CONNECTOR_GROUPS.map((connector) => { const Icon = connector.icon; return <div className="connector-item" key={connector.label}><span className="connector-icon" style={{ color: connector.color, borderColor: `${connector.color}55`, backgroundColor: `${connector.color}12` }}><Icon size={14} /></span><span>{connector.label}</span><span className="connector-count">{tree ? flattenTree(tree).filter((node) => node.category === connector.label || (connector.label === "IA / Agentes" && node.category === "IA")).length : "—"}</span></div>; })}
              </div>
            </div>
            <div className="sidebar-section stack-section">
              <span className="sidebar-label">Stack conectado</span>
              <div className="stack-list">{TECH_STACK.map((tech) => { const Icon = tech.icon; return <div key={tech.label} className="stack-item"><Icon size={13} style={{ color: tech.color }} /><span>{tech.label}</span><span className="stack-live" /></div>; })}</div>
            </div>
          </div>
          <div className="sidebar-bottom"><Link to="/" className="back-to-site"><ArrowLeft size={14} /> Voltar ao site</Link><button type="button" className="settings-link"><Settings2 size={14} /> Configurações</button></div>
        </aside>

        <main className="hub-main">
          <div className="hub-main-heading">
            <div><p className="eyebrow">SISTEMA / VISÃO EM TEMPO REAL</p><h1>Árvore de conexões</h1><p className="hub-subtitle">A inteligência do seu negócio, organizada em uma única topologia viva.</p></div>
            <div className="tree-meta"><span><Activity size={14} /> {status?.executions_24h ?? "—"} execuções nas últimas 24h</span><span><Zap size={14} /> {status?.n8n_connected ? "n8n conectado" : "n8n aguardando conexão"}</span></div>
          </div>
          {error ? <div className="hub-error"><TerminalSquare size={17} /><div><strong>Falha de sincronização</strong><span>{error}</span></div><button type="button" onClick={loadData}>Tentar novamente</button></div> : <div className="tree-stage"><div className="stage-topline"><span className="stage-title"><span className="stage-line" /> ORQUESTRAÇÃO PRINCIPAL</span><span className="stage-filter">{selectedCategory ? `Filtro visual: ${selectedCategory}` : "Todos os fluxos"} <ChevronDown size={13} /></span></div><ConnectionTree treeData={tree} selectedId={selectedNode?.id} onSelectNode={setSelectedNode} /></div>}
          <div className="root-stack"><div className="root-stack-label"><span className="stage-line" /> INFRAESTRUTURA BASE</div><div className="root-stack-items">{TECH_STACK.map((tech) => { const Icon = tech.icon; return <div className="root-stack-item" key={tech.label} style={{ "--stack-color": tech.color }}><Icon size={14} /><span>{tech.label}</span></div>; })}</div></div>
        </main>

        <AutomationProperties node={selectedNode} onRunComplete={loadData} />
      </div>

      <footer className="hub-footer"><div><span className="footer-live-dot" /> Todos os sistemas operacionais</div><div className="footer-items"><span><Database size={13} /> MongoDB <b>conectado</b></span><span><Network size={13} /> API <b>online</b></span><span><Clock3 size={13} /> Última sincronização: agora</span></div><div className="footer-version">SENTIENT-AI <span>v2.0.0</span></div></footer>
      {showModal && <NewAutomationModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
