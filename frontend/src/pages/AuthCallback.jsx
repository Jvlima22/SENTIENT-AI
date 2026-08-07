import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const nav = useNavigate();
  const loc = useLocation();
  const { setUser } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const hash = loc.hash || window.location.hash;
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) { nav("/login"); return; }
    const sessionId = match[1];
    (async () => {
      try {
        const { data } = await api.post("/auth/google/session", { session_id: sessionId });
        setUser(data);
        window.history.replaceState(null, "", window.location.pathname);
        nav(data.role === "admin" ? "/admin" : "/conta");
      } catch {
        nav("/login");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin" />
      <p className="text-white/50 text-sm">Autenticando...</p>
    </div>
  );
}
