import React, { useState } from "react";
import { toast } from "react-toastify";

const API_URL = "https://sky26.onrender.com";

export default function RegistroUsuario({ onRegister }) {
  const [nombre, setNombre] = useState("");
  const [servicio, setServicio] = useState("");
  const [movil, setMovil] = useState("");
  const [mail, setMail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !servicio || !movil || !mail) return toast.error("Completa todos los campos");

    try {
      const res = await fetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, servicio, movil, mail })
      });

      if (!res.ok) return toast.error("Error al registrar usuario");

      toast.success("Usuario registrado ✅");
      onRegister(nombre);
    } catch {
      toast.error("Error en el registro");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold text-center mb-4">Registro de Usuario</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full p-2 border rounded" required/>
        <input type="text" placeholder="Servicio" value={servicio} onChange={e => setServicio(e.target.value)} className="w-full p-2 border rounded" required/>
        <input type="text" placeholder="Móvil" value={movil} onChange={e => setMovil(e.target.value)} className="w-full p-2 border rounded" required/>
        <input type="email" placeholder="Email" value={mail} onChange={e => setMail(e.target.value)} className="w-full p-2 border rounded" required/>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-xl">Registrar</button>
      </form>
    </div>
  );
}
