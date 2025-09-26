import React, { useState } from "react";
import { toast } from "react-toastify";

const API_URL = "https://sky26.onrender.com/usuarios";

export default function RegistroUsuario({ onRegister }) {
  const [form, setForm] = useState({
    nombre: "",
    servicio: "",
    movil: "",
    mail: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Error en el registro");

      const data = await res.json();
      toast.success("Usuario registrado ✅");

      // Guardar usuario en localStorage para mantener sesión
      localStorage.setItem("usuario", data.usuario.nombre);

      // Notificar al App que ya está logueado
      onRegister(data.usuario.nombre);

    } catch (err) {
      toast.error("Error al registrar usuario ❌");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold text-center mb-4">Registro de Usuario</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          name="servicio"
          placeholder="Servicio"
          value={form.servicio}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="tel"
          name="movil"
          placeholder="Móvil"
          value={form.movil}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          name="mail"
          placeholder="Correo electrónico"
          value={form.mail}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="bg-green-500 text-white p-2 rounded-xl">
          Registrarse
        </button>
      </form>
    </div>
  );
}
