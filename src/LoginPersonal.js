import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function LoginPersonal({ onLogin, switchToRegister, switchToMenu }) {
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  useEffect(() => {
    const savedMail = localStorage.getItem("personal_mail");
    const savedPass = localStorage.getItem("personal_pass");
    if (savedMail) setMail(savedMail);
    if (savedPass) {
      setPassword(savedPass);
      setRecordar(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("https://sky26.onrender.com/personal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mail, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Correo o contraseña incorrectos");
      }

      if (data.requiereNuevaPassword) {
        setResetToken(data.resetToken);
        setPassword("");
        setNuevaPassword("");
        setConfirmarPassword("");
        localStorage.removeItem("personal_pass");
        setRecordar(false);
        toast.info("El supervisor blanqueó tu contraseña. Debés crear una nueva para continuar.");
        return;
      }

      if (data.token) localStorage.setItem("personal_token", data.token);
      toast.success(`Bienvenido ${data.nombre} ✅`);
      onLogin(data);

      if (recordar) {
        localStorage.setItem("personal_mail", mail);
        localStorage.setItem("personal_pass", password);
      } else {
        localStorage.removeItem("personal_mail");
        localStorage.removeItem("personal_pass");
      }
    } catch (err) {
      toast.error(err.message || "Error de conexión ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleEstablecerPassword = async (e) => {
    e.preventDefault();
    if (nuevaPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("https://sky26.onrender.com/personal/establecer-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password: nuevaPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo establecer la contraseña");

      if (data.token) localStorage.setItem("personal_token", data.token);
      if (recordar) {
        localStorage.setItem("personal_mail", mail);
        localStorage.setItem("personal_pass", nuevaPassword);
      } else {
        localStorage.removeItem("personal_pass");
      }
      toast.success("Contraseña creada correctamente");
      onLogin(data);
    } catch (err) {
      toast.error(err.message || "No se pudo establecer la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20 relative">
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <img
        src="/logosmall_old.png"
        alt="Logo"
        className="mx-auto mb-4 w-24 h-auto"
      />
      <h1 className="text-2xl font-bold text-center mb-4">
        🔑 Ingreso de personal de Ingeniería clínica
      </h1>

      {resetToken ? (
        <form onSubmit={handleEstablecerPassword} className="flex flex-col space-y-3">
          <p className="text-sm text-center text-amber-700">
            Tu contraseña fue blanqueada por un supervisor. Creá una nueva contraseña para ingresar.
          </p>
          <input
            type="password"
            placeholder="Nueva contraseña (mínimo 8 caracteres)"
            className="w-full p-2 border rounded"
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
            minLength={8}
            required
          />
          <input
            type="password"
            placeholder="Repetir nueva contraseña"
            className="w-full p-2 border rounded"
            value={confirmarPassword}
            onChange={(e) => setConfirmarPassword(e.target.value)}
            minLength={8}
            required
          />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded-xl" disabled={loading}>
            Crear contraseña e ingresar
          </button>
          <button
            type="button"
            onClick={() => {
              setResetToken("");
              setNuevaPassword("");
              setConfirmarPassword("");
            }}
            className="bg-gray-400 text-white p-2 rounded-xl"
          >
            Volver al ingreso
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="flex flex-col space-y-3">
          <input
            type="email"
            placeholder="Correo"
            className="w-full p-2 border rounded"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
            required
          />

          <div className="relative">
            <input
              type={mostrarPass ? "text" : "password"}
              placeholder="Contraseña"
              className="w-full p-2 border rounded pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-gray-500"
              onClick={() => setMostrarPass(!mostrarPass)}
            >
              {mostrarPass ? "🙈" : "👁️"}
            </button>
          </div>

          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={recordar}
              onChange={(e) => setRecordar(e.target.checked)}
            />
            <span>Recordar usuario y contraseña</span>
          </label>

          <button type="submit" className="bg-blue-500 text-white p-2 rounded-xl" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
          <button
            type="button"
            onClick={switchToMenu}
            className="bg-gray-400 text-white p-2 rounded-xl mt-2"
          >
            Volver
          </button>
        </form>
      )}
    </div>
  );
}
