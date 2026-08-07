import React from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export const Footer = () => (
  <footer className="border-t border-white/10 mt-24 relative z-10" data-testid="footer">
    <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
      <div className="md:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[#00F0FF] flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-display font-700 tracking-tight">SENTIENT<span className="text-[#00F0FF]">-AI</span></span>
        </div>
        <p className="text-white/50 text-sm max-w-md leading-relaxed">
          Hub digital para centralizar produtos, automações, templates, skills e ferramentas de IA. Descubra, acesse e escale.
        </p>
      </div>
      <div>
        <h4 className="font-display text-sm mb-4 text-white/90">Navegação</h4>
        <ul className="space-y-2 text-sm text-white/50">
          <li><Link to="/" className="hover:text-[#00F0FF] transition-colors">Marketplace</Link></li>
          <li><Link to="/skills" className="hover:text-[#00F0FF] transition-colors">Skills Claude</Link></li>
          <li><Link to="/comunidade" className="hover:text-[#00F0FF] transition-colors">Comunidade</Link></li>
          <li><Link to="/faq" className="hover:text-[#00F0FF] transition-colors">FAQ</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-display text-sm mb-4 text-white/90">Conta</h4>
        <ul className="space-y-2 text-sm text-white/50">
          <li><Link to="/login" className="hover:text-[#00F0FF] transition-colors">Entrar</Link></li>
          <li><Link to="/cadastro" className="hover:text-[#00F0FF] transition-colors">Criar conta</Link></li>
          <li><Link to="/conta" className="hover:text-[#00F0FF] transition-colors">Minha Conta</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-white/10 py-6 text-center text-xs text-white/30 font-mono-code">
      © {new Date().getFullYear()} SENTIENT-AI · Todos os direitos reservados
    </div>
  </footer>
);
