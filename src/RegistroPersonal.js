import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const API_URL = "https://sky26.onrender.com/personal";

export default function RegistroPersonal({ onRegister, switchToLogin }) {
  const [form, setForm] = useState({ 
    nombre: "", 
    movil: "", 
    mail: "", 
    area: "", 
    password: "" 
  });
  const [password2, setPassword2] = useState("");
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    fetch("https://sky26.onrender.com/areas")
      .then(res => res.json())
      .then(data => setAreas(data))
      .catch(() => toast.error("Error al cargar áreas ❌"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== password2) {
      toast.error("❌ Las contraseñas no coinciden");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("✅ Personal registrado");
        onRegister(data);
      } else {
        toast.error("❌ Error al registrar personal");
      }
    } catch {
      toast.error("❌ Error de conexión");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Estado para mostrar coincidencia de contraseñas en tiempo real
  const contrasenasCoinciden = password2.length === 0 ? null : form.password === password2;

  return (
    <div className="p-4 max-w-md mx-auto">
      <img
        src="/logosmall.png"
        alt="Logo"
        className="mx-auto mb-4 w-24 h-auto"
      />
      <h1 className="text-2xl font-bold text-center mb-4">📝 Registro de Personal</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input 
          type="text" 
          name="nombre" 
          placeholder="Nombre" 
          value={form.nombre} 
          onChange={handleChange} 
          required 
          className="w-full p-2 border rounded" 
        />

        <input 
          type="text" 
          name="movil" 
          placeholder="Móvil" 
          value={form.movil} 
          onChange={handleChange} 
          className="w-full p-2 border rounded" 
        />

        <input 
          type="email" 
          name="mail" 
          placeholder="Correo" 
          value={form.mail} 
          onChange={handleChange} 
          required 
          className="w-full p-2 border rounded" 
        />

        <select 
          name="area" 
          value={form.area} 
          onChange={handleChange} 
          className="w-full p-2 border rounded" 
          required
        >
          <option value="">Seleccione un área</option>
          {areas.map(a => (
            <option key={a.id} value={a.nombre}>{a.nombre}</option>
          ))}
        </select>

        <input 
          type="password" 
          name="password" 
          placeholder="Contraseña" 
          value={form.password} 
          onChange={handleChange} 
          required 
          className="w-full p-2 border rounded" 
        />

        <input 
          type="password" 
          placeholder="Repetir contraseña" 
          value={password2} 
          onChange={(e) => setPassword2(e.target.value)} 
          required 
          className="w-full p-2 border rounded" 
        />

        {contrasenasCoinciden !== null && (
          <p className={`text-sm ${contrasenasCoinciden ? "text-green-600" : "text-red-600"}`}>
            {contrasenasCoinciden ? "✅ Las contraseñas coinciden" : "❌ Las contraseñas no coinciden"}
          </p>
        )}

        <button 
          type="submit" 
          className="bg-green-500 text-white p-2 rounded-xl"
        >
          Registrar
        </button>

        <button 
          type="button" 
          className="text-blue-600 underline mt-2" 
          onClick={switchToLogin}
        >
          Ya registrado? Ingresar
        </button>
      </form>
    </div>
  );
}