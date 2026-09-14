import React, { useState } from "react";

const N8N_PRODUCT_TITLE = "Workflow n8n — Integração Total";

export function isN8nWorkflow(product) {
  return product?.title?.trim().toLocaleLowerCase("pt-BR") === N8N_PRODUCT_TITLE.toLocaleLowerCase("pt-BR");
}

/** Mídia de capa com fallback automático para a imagem cadastrada do produto. */
export default function ProductMedia({ product, className = "", imageClassName = "" }) {
  const [videoFailed, setVideoFailed] = useState(false);
  const useVideo = isN8nWorkflow(product) && !videoFailed;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {useVideo ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={product.thumbnail}
          aria-label={`Vídeo de apresentação: ${product.title}`}
          onError={() => setVideoFailed(true)}
          className={`h-full w-full object-cover ${imageClassName}`}
        >
          <source src="/motion/n8n.mp4" type="video/mp4" />
        </video>
      ) : (
        <img src={product.thumbnail} alt={product.title} loading="lazy" className={`h-full w-full object-cover ${imageClassName}`} />
      )}
    </div>
  );
}
