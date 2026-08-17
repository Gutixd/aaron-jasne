import { useState } from "react";
import { Monograma } from "@/components/Marca";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setEnviando(true);
    setError(null);

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: clave,
    });

    if (err) {
      // Mensaje genérico a propósito: distinguir "correo no existe" de
      // "contraseña incorrecta" le regala información a quien prueba.
      setError("No pudimos entrar con esos datos.");
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-hueso px-6">
      <form onSubmit={entrar} className="w-full max-w-xs">
        <div className="mb-12 flex justify-center text-tinta">
          <Monograma tam={30} anillo />
        </div>

        <label htmlFor="email" className="eyebrow text-[0.5rem] text-tinta-suave">
          Correo
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="campo mb-7"
          autoComplete="username"
          required
        />

        <label htmlFor="clave" className="eyebrow text-[0.5rem] text-tinta-suave">
          Contraseña
        </label>
        <input
          id="clave"
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          className="campo"
          autoComplete="current-password"
          required
        />

        {error && <p className="mt-5 text-[0.8rem] text-rosa">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="eyebrow mt-10 w-full cursor-pointer bg-noche py-4 text-[0.55rem] text-hueso transition-colors hover:bg-rosa disabled:opacity-50"
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
