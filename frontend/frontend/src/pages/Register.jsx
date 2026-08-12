import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, formatApiError } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthShell, Input, GoogleBtn } from "@/pages/Login";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const u = await register(name, email, password);
      toast.success(`Conta criada! Bem-vindo, ${u.name?.split(" ")[0]}.`);
      nav("/");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally { setLoading(false); }
  };

  const googleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/conta";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <AuthShell title="Criar conta" subtitle="Junte-se ao hub SENTIENT-AI">
      <form onSubmit={submit} className="space-y-4" data-testid="register-form">
        {error && <p className="text-sm text-[#FF3B30] bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-lg px-4 py-2.5" data-testid="register-error">{error}</p>}
        <Input label="Nome" value={name} onChange={setName} testid="register-name" />
        <Input label="Email" type="email" value={email} onChange={setEmail} testid="register-email" />
        <Input label="Senha" type="password" value={password} onChange={setPassword} testid="register-password" />
        <button type="submit" disabled={loading} data-testid="register-submit"
          className="w-full bg-[#FF7A59] text-black font-medium px-6 py-3 rounded-full hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Criar conta
        </button>
      </form>
      <GoogleBtn onClick={googleLogin} />
      <p className="text-sm text-white/50 text-center mt-6">
        Já tem conta? <Link to="/login" className="text-[#FF7A59] hover:underline">Entrar</Link>
      </p>
    </AuthShell>
  );
}
