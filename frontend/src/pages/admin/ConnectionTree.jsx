import { useMemo, useState } from "react";
import { hierarchy, tree as d3Tree } from "d3-hierarchy";
import { linkHorizontal } from "d3-shape";
import {
  Atom,
  BarChart3,
  Bot,
  Brain,
  ChevronRight,
  Database,
  GitBranch,
  Headphones,
  MessageCircle,
  MessagesSquare,
  Network,
  Orbit,
  RefreshCw,
  Server,
  Sparkles,
  Workflow,
} from "lucide-react";

const ICONS = {
  atom: Atom,
  "chart-no-axes-combined": BarChart3,
  bot: Bot,
  brain: Brain,
  database: Database,
  "database-zap": Database,
  "git-branch": GitBranch,
  headphones: Headphones,
  "message-circle": MessageCircle,
  "messages-square": MessagesSquare,
  network: Network,
  orbit: Orbit,
  "refresh-cw": RefreshCw,
  server: Server,
  sparkles: Sparkles,
  workflow: Workflow,
};

const FALLBACK_COLOR = "#94A3B8";

function cloneVisibleTree(node, collapsedIds) {
  if (!node) return null;
  const copy = { ...node };
  if (node.children?.length && !collapsedIds.has(node.id)) {
    copy.children = node.children.map((child) => cloneVisibleTree(child, collapsedIds));
  } else {
    delete copy.children;
  }
  return copy;
}

function NodeIcon({ icon, size = 15 }) {
  const Icon = ICONS[icon] || GitBranch;
  return <Icon size={size} strokeWidth={1.8} />;
}

function statusLabel(status) {
  return {
    active: "Ativo",
    idle: "Ocioso",
    error: "Erro",
    waiting_approval: "Aguardando aprovação",
  }[status] || "Sem status";
}

export default function ConnectionTree({ treeData, selectedId, onSelectNode }) {
  const [collapsedIds, setCollapsedIds] = useState(new Set());

  const expandableIds = useMemo(() => {
    const ids = new Set();
    const visit = (node) => {
      if (!node) return;
      if (node.children?.length) ids.add(node.id);
      node.children?.forEach(visit);
    };
    visit(treeData);
    return ids;
  }, [treeData]);

  const layout = useMemo(() => {
    if (!treeData) return null;
    const visibleData = cloneVisibleTree(treeData, collapsedIds);
    const root = hierarchy(visibleData);
    const layoutTree = d3Tree().nodeSize([82, 178]);
    layoutTree(root);

    const nodes = root.descendants();
    const links = root.links();
    const minX = Math.min(...nodes.map((node) => node.x));
    const maxX = Math.max(...nodes.map((node) => node.x));
    const maxY = Math.max(...nodes.map((node) => node.y));
    const verticalPadding = 86;
    const horizontalPadding = 110;
    nodes.forEach((node) => {
      node.x = node.x - minX + verticalPadding;
      node.y = node.y + horizontalPadding;
    });

    return {
      nodes,
      links,
      width: Math.max(920, maxY + 190),
      height: Math.max(430, maxX - minX + verticalPadding * 2),
      linkPath: linkHorizontal().x((node) => node.y).y((node) => node.x),
    };
  }, [treeData, collapsedIds]);

  if (!treeData || !layout) {
    return <div className="tree-empty">Carregando topologia operacional…</div>;
  }

  const toggleCollapsed = (node) => {
    if (!expandableIds.has(node.id)) return;
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(node.id)) next.delete(node.id);
      else next.add(node.id);
      return next;
    });
  };

  return (
    <div className="tree-scroll-area" data-testid="connection-tree">
      <svg
        className="connection-tree-svg"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label="Árvore de conexões e automações do SENTIENT-AI"
      >
        <defs>
          <filter id="tree-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="tree-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgba(148,163,184,.13)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tree-dots)" opacity=".4" />
        <g className="tree-links">
          {layout.links.map((link) => (
            <path
              key={`${link.source.data.id}-${link.target.data.id}`}
              d={layout.linkPath(link)}
              className="tree-link tree-link-flow"
              style={{ "--link-color": link.target.data.color || FALLBACK_COLOR }}
              stroke={link.target.data.color || FALLBACK_COLOR}
              filter="url(#tree-glow)"
              fill="none"
              data-testid={`tree-link-${link.target.data.id}`}
            />
          ))}
        </g>
        <g className="tree-nodes">
          {layout.nodes.map((node) => {
            const data = node.data;
            const color = data.color || FALLBACK_COLOR;
            const isSelected = selectedId === data.id;
            const hasChildren = Boolean(data.children?.length);
            const isCollapsed = collapsedIds.has(data.id);
            return (
              <g
                key={data.id}
                className={`tree-node ${isSelected ? "is-selected" : ""}`}
                transform={`translate(${node.y},${node.x})`}
                onClick={() => {
                  onSelectNode(data);
                  toggleCollapsed(data);
                }}
                tabIndex={0}
                role="button"
                aria-label={`${data.name}, ${statusLabel(data.status)}`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectNode(data);
                    toggleCollapsed(data);
                  }
                }}
                data-testid={`tree-node-${data.id}`}
              >
                <circle className="tree-node-halo" r={data.type === "root" ? 38 : 30} stroke={color} />
                <circle className="tree-node-ring" r={data.type === "root" ? 27 : 22} stroke={color} />
                <circle className="tree-node-core" r={data.type === "root" ? 22 : 18} />
                <g className="tree-node-icon" transform="translate(-9,-9)">
                  <NodeIcon icon={data.icon} size={18} />
                </g>
                <circle className={`tree-status-dot status-${data.status || "idle"}`} cx="16" cy="-16" r="4" />
                <text className="tree-node-label" x="0" y="49" textAnchor="middle">
                  {data.name}
                </text>
                <text className="tree-node-type" x="0" y="65" textAnchor="middle">
                  {data.type === "agent" ? "AGENTE" : data.type === "tool" ? "CONEXÃO" : data.type.toUpperCase()}
                </text>
                {hasChildren && (
                  <g className="tree-collapse-control" transform="translate(31,-8)">
                    <circle r="9" fill="#0B1220" stroke={color} />
                    <ChevronRight size={12} transform={isCollapsed ? "translate(-6,-6)" : "translate(-6,-6) rotate(90 6 6)"} />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      <div className="tree-caption">
        <span><i className="legend-dot legend-dot-live" />Fluxo ativo</span>
        <span><i className="legend-dot legend-dot-idle" />Ocioso</span>
        <span><i className="legend-dot legend-dot-approval" />Aprovação pendente</span>
        <span className="tree-hint">Clique em um nó para ver propriedades · clique novamente para expandir ou recolher</span>
      </div>
    </div>
  );
}
