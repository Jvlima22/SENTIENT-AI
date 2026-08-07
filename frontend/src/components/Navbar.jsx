import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useSearch } from "@/context/SearchContext";
import { Logo } from "@/components/Logo";
import { Menu, X, User, LayoutDashboard, Globe, Search } from "lucide-react";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { t, lang, toggle } = useI18n();
  const { setOpen } = useSearch();
  const [open, setMenu] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  const links = [
    { to: "/", label: t("marketplace") },
    { to: "/skills", label: t("skills") },
    { to: "/comunidade", label: t("community") },
    { to: "/faq", label: t("faq") },
  ];
  const isActive = (to) => (to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(to));

  return (
    <header className="sticky top-0 z-50 glass" data-testid="navbar">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 flex items-center justify-between h-16 gap-4">
        <div className="flex items-center gap-4">
          <Logo height={24} />
          <button onClick={() => setOpen(true)} data-testid="search-pill"
            className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-3 pr-2 py-1.5 text-sm text-white/45 hover:border-white/25 hover:text-white/70 transition-colors">
            <Search className="w-4 h-4" />
            <span className="pr-6">Buscar</span>
            <kbd className="text-[10px] font-mono-code bg-white/8 border border-white/10 rounded px-1.5 py-0.5 text-white/50">⌘K</kbd>
          </button>
        </div>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <Link key={l.to} to={l.to} data-testid={`nav-${l.to.replace("/", "") || "home"}`}
              className={`text-sm transition-colors hover:text-[#00F0FF] ${isActive(l.to) ? "text-[#00F0FF]" : "text-white/65"}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => setOpen(true)} data-testid="search-icon-btn" className="sm:hidden text-white/60 hover:text-white transition-colors"><Search className="w-5 h-5" /></button>
          <button onClick={toggle} data-testid="lang-toggle"
            className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors font-mono-code uppercase">
            <Globe className="w-4 h-4" /> {lang}
          </button>
          {user && user.role === "admin" && (
            <Link to="/admin" data-testid="nav-admin" className="flex items-center gap-1.5 text-sm text-white/65 hover:text-[#00F0FF] transition-colors">
              <LayoutDashboard className="w-4 h-4" /> {t("admin")}
            </Link>
          )}
          {user ? (
            <>
              <Link to="/conta" data-testid="nav-account" className="flex items-center gap-1.5 text-sm text-white/80 hover:text-[#00F0FF] transition-colors">
                <User className="w-4 h-4" /> {user.name?.split(" ")[0]}
              </Link>
              <button onClick={async () => { await logout(); nav("/"); }} data-testid="logout-btn"
                className="text-sm text-white/50 hover:text-[#FF3B30] transition-colors">{t("logout")}</button>
            </>
          ) : (
            <>
              <Link to="/login" data-testid="nav-login" className="text-sm text-white/80 hover:text-[#00F0FF] transition-colors">{t("login")}</Link>
              <Link to="/cadastro" data-testid="nav-register"
                className="text-sm font-medium bg-[#00F0FF] text-black px-4 py-2 rounded-full hover:bg-white transition-colors">{t("register")}</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <button onClick={() => setOpen(true)} data-testid="search-icon-btn-mobile" className="text-white/60"><Search className="w-5 h-5" /></button>
          <button className="text-white" onClick={() => setMenu(!open)} data-testid="mobile-menu-btn">{open ? <X /> : <Menu />}</button>
        </div>
      </div>

      {open && (
        <div className="md:hidden glass border-t border-white/10 px-5 py-4 flex flex-col gap-4" data-testid="mobile-menu">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMenu(false)} className="text-white/80 hover:text-[#00F0FF]">{l.label}</Link>
          ))}
          <div className="h-px bg-white/10" />
          {user ? (
            <>
              {user.role === "admin" && <Link to="/admin" onClick={() => setMenu(false)} className="text-white/80">{t("admin")}</Link>}
              <Link to="/conta" onClick={() => setMenu(false)} className="text-white/80">{t("account")}</Link>
              <button onClick={async () => { await logout(); setMenu(false); nav("/"); }} className="text-left text-[#FF3B30]">{t("logout")}</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenu(false)} className="text-white/80">{t("login")}</Link>
              <Link to="/cadastro" onClick={() => setMenu(false)} className="text-[#00F0FF]">{t("register")}</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};
