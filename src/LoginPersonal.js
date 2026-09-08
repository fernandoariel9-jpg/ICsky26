import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function LoginPersonal({ onLogin, switchToRegister, switchToMenu }) {
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false); // 👁️

  // 🔹 Cargar datos guardados en localStorage
  useEffect(() => {
    const savedMail = localStorage.getItem("personal_mail");
    const savedPass = localStorage.getItem("personal_pass");
    if (savedMail && savedPass) {
      setMail(savedMail);
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
      if (res.ok) {
        const data = await res.json();
        console.log("DATOS PERSONAL LOGIN:", data);
        toast.success(`Bienvenido ${data.nombre} ✅`);
        onLogin(data);

        // 🔹 Guardar o borrar credenciales según el checkbox
        if (recordar) {
          localStorage.setItem("personal_mail", mail);
          localStorage.setItem("personal_pass", password);
        } else {
          localStorage.removeItem("personal_mail");
          localStorage.removeItem("personal_pass");
        }
      } else {
        toast.error("Correo o contraseña incorrectos ❌");
      }
    } catch {
      toast.error("Error de conexión ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20 relative">
      {/* Overlay de carga */}
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
      <h1 className="text-2xl font-bold text-center mb-4">🔑 Ingreso de personal de Ingeniería clínica</h1>

      <form onSubmit={handleLogin} className="flex flex-col space-y-3">
        <input
          type="email"
          placeholder="Correo"
          className="w-full p-2 border rounded"
          value={mail}
          onChange={(e) => setMail(e.target.value)}
          required
        />

        {/* Campo contraseña con botón 👁️ */}
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

        {/* Casilla de recordar */}
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={recordar}
            onChange={(e) => setRecordar(e.target.checked)}
          />
          <span>Recordar usuario y contraseña</span>
        </label>

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-xl"
          disabled={loading}
        >
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

    </div>
  );
}




