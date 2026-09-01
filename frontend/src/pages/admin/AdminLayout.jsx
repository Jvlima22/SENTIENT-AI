import React from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { LayoutDashboard, Package, FolderTree, Users, Zap, ArrowLeft } from "lucide-react";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { to: "/admin/leads", label: "Leads", icon: Users },
];

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-60 shrink-0 border-r border-white/10 bg-[#08080b] p-4 hidden md:flex flex-col">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-7 h-7 rounded-lg bg-[#FF7A59] flex items-center justify-center"><Zap className="w-4 h-4 text-black" strokeWidth={2.5} /></div>
          <span className="font-display text-sm">Admin</span>
        </div>
        <nav className="space-y-1 flex-1">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} data-testid={`admin-nav-${it.label.toLowerCase()}`}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-[#FF7A59]/10 text-[#FF7A59]" : "text-white/55 hover:text-white hover:bg-white/5"}`}>
              <it.icon className="w-4 h-4" /> {it.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/" className="flex items-center gap-2 px-3 py-2 text-sm text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar ao site
        </Link>
      </aside>
      <div className="flex-1 min-w-0 p-4 sm:p-5 md:p-8 overflow-x-hidden">
        <nav className="md:hidden -mx-4 sm:-mx-5 mb-6 px-4 sm:px-5 pb-3 overflow-x-auto no-scrollbar border-b border-white/10 flex gap-2" aria-label="Navegação administrativa">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end}
              className={({ isActive }) => `shrink-0 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs ${isActive ? "bg-[#FF7A59] text-black" : "bg-white/5 text-white/65 border border-white/10"}`}>
              <it.icon className="w-3.5 h-3.5" /> {it.label}
            </NavLink>
          ))}
        </nav>
        {children || <Outlet />}
      </div>
    </div>
  );
}
