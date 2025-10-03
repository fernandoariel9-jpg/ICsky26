import React, { useState } from "react";
import { toast } from "react-toastify";

export default function UsuarioLogin({ onLogin, switchToRegister }) {
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("https://sky26.onrender.com/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mail, password }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Bienvenido ${data.nombre} ✅`);
        onLogin(data.nombre);
      } else {
        toast.error("Usuario o contraseña incorrectos ❌");
      }
    } catch {
      toast.error("Error de conexión ❌");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
    <img
          src="/logosmall.png"
          alt="Logo"
          className="mx-auto mb-4 w-24 h-auto"
        />
      <h1 className="text-2xl font-bold text-center mb-4">🔑 Login de Usuario</h1>
      <form onSubmit={handleLogin} className="flex flex-col space-y-3">
        <input type="text" placeholder="Mail" className="w-full p-2 border rounded"
          value={mail} onChange={(e)=>setMail(e.target.value)} required />

        <input type="password" placeholder="Contraseña" className="w-full p-2 border rounded"
          value={password} onChange={(e)=>setPassword(e.target.value)} required />

        <button type="submit" className="bg-blue-500 text-white p-2 rounded-xl">Ingresar</button>
      </form>

      <p className="text-center mt-4 text-sm">
        ¿No tienes cuenta?{" "}
        <button className="text-green-600 underline" onClick={switchToRegister}>Registrarse</button>
      </p>
    </div>
  );
}