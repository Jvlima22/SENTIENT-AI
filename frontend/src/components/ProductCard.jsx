import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Download, Eye } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

export const ProductCard = ({ product, index = 0 }) => {
  const { t } = useI18n();
  const isFree = product.type === "free";
  return (
    <Link to={`/produto/${product.id}`} data-testid={`product-card-${product.id}`}
      className="group grid-fade-in block rounded-xl bg-[#0F0F13] border border-white/10 p-4 hover:border-white/25 hover:-translate-y-1 transition-transform transition-colors"
      style={{ animationDelay: `${Math.min(index * 60, 480)}ms` }}>
      <div className="aspect-video rounded-lg overflow-hidden bg-white/5 mb-4 relative">
        <img src={product.thumbnail} alt={product.title} loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3">
          {isFree ? (
            <span className="border border-white/25 text-white/70 bg-black/50 backdrop-blur text-xs rounded-full px-2.5 py-1 font-mono-code">{t("free")}</span>
          ) : (
            <span className="bg-[#FFF000] text-black font-bold text-xs rounded-full px-2.5 py-1 premium-glow font-mono-code">R$ {product.price}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] uppercase tracking-wide text-[#FF7A59]/80 font-mono-code">{product.category_name}</span>
      </div>
      <h3 className="font-display text-base leading-snug mb-2 group-hover:text-white text-white/95">{product.title}</h3>
      <p className="text-sm text-white/50 line-clamp-2 mb-4 leading-relaxed">{product.short_description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-white/35 font-mono-code">
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{product.views || 0}</span>
          {isFree && <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" />{product.downloads || 0}</span>}
        </div>
        <span className="flex items-center gap-1 text-sm text-white/70 group-hover:text-[#FF7A59] transition-colors">
          {t("view_details")} <ArrowUpRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
};
