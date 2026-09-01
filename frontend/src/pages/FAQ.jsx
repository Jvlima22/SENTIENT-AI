import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { HelpCircle, Loader2 } from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/faqs").then((r) => { setFaqs(r.data); setLoading(false); }); }, []);

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-12">
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle className="w-6 h-6 text-[#FF7A59]" />
        <span className="text-xs uppercase tracking-wide text-[#FF7A59] font-mono-code">Ajuda</span>
      </div>
      <h1 className="font-display font-800 text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4">Perguntas Frequentes</h1>
      <p className="text-white/55 mb-12 leading-relaxed">Tudo o que você precisa saber sobre acesso, pagamentos e recursos.</p>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#FF7A59] animate-spin" /></div>
      ) : (
        <Accordion type="single" collapsible className="space-y-3" data-testid="faq-accordion">
          {faqs.map((f) => (
            <AccordionItem key={f.id} value={f.id} data-testid={`faq-${f.id}`}
              className="rounded-xl bg-[#0F0F13] border border-white/10 px-5 overflow-hidden">
              <AccordionTrigger className="text-left font-display text-base hover:no-underline hover:text-[#FF7A59] transition-colors py-5">
                {f.question}
              </AccordionTrigger>
              <AccordionContent className="text-white/60 leading-relaxed pb-5">{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
