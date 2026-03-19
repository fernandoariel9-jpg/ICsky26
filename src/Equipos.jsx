import { useEffect, useState } from "react";
import { API_URL } from "../config";

export default function Equipos() {
  const [equipos, setEquipos] = useState([]);
  const [form, setForm] = useState({
    numero_serie: "",
    descripcion: "",
    marca_modelo: "",
    servicio: "",
    sub_servicio: "",
    encargado: "",
    area: "",
    periodo: "",
    ultimo_mant: "",
    estado: "activo"
  });

  const [editandoId, setEditandoId] = useState(null);

  // 🔄 Cargar equipos
  const cargarEquipos = async () => {
  const res = await fetch(API_URL.Equipos);
  const data = await res.json();
  setEquipos(data);
};

  useEffect(() => {
    cargarEquipos();
  }, []);

  // ✍️ Manejo de inputs
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // 📅 Calcular próximo mantenimiento
  const calcularProximo = (ultimo, periodo) => {
    if (!ultimo || !periodo) return "-";
    const fecha = new Date(ultimo);
    fecha.setDate(fecha.getDate() + Number(periodo));
    return fecha.toLocaleDateString();
  };

  // 💾 Guardar
  const handleSubmit = async (e) => {
  e.preventDefault();

  const url = editandoId
    ? `${API_URL.Equipos}/${editandoId}`
    : API_URL.Equipos;

  const method = editandoId ? "PUT" : "POST";

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form)
  });

  setForm({
    numero_serie: "",
    descripcion: "",
    marca_modelo: "",
    servicio: "",
    sub_servicio: "",
    encargado: "",
    area: "",
    periodo: "",
    ultimo_mant: "",
    estado: "activo"
  });

  setEditandoId(null);
  cargarEquipos();
};

  // ✏️ Editar
  const editarEquipo = (eq) => {
    setForm({
      ...eq,
      ultimo_mant: eq.ultimo_mant
        ? eq.ultimo_mant.slice(0, 16)
        : ""
    });
    setEditandoId(eq.id);
  };

  // ❌ Eliminar (opcional)
  const eliminarEquipo = async (id) => {
  if (!confirm("¿Eliminar equipo?")) return;

  try {
    await fetch(`${API_URL.Equipos}/${id}`, {
      method: "DELETE"
    });

    cargarEquipos();
  } catch (error) {
    console.error("Error eliminando equipo:", error);
  }
};
  return (
    <div style={{ padding: 20 }}>
      <h2>Equipos</h2>

      {/* 🧾 FORMULARIO */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input name="numero_serie" placeholder="N° Serie" value={form.numero_serie} onChange={handleChange} required />
        <input name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} />
        <input name="marca_modelo" placeholder="Marca / Modelo" value={form.marca_modelo} onChange={handleChange} />

        <input name="servicio" placeholder="Servicio" value={form.servicio} onChange={handleChange} />
        <input name="sub_servicio" placeholder="Sub servicio" value={form.sub_servicio} onChange={handleChange} />
        <input name="encargado" placeholder="Encargado" value={form.encargado} onChange={handleChange} />
        <input name="area" placeholder="Área" value={form.area} onChange={handleChange} />

        <input name="periodo" type="number" placeholder="Período (días)" value={form.periodo} onChange={handleChange} />
        <input name="ultimo_mant" type="datetime-local" value={form.ultimo_mant} onChange={handleChange} />

        <select name="estado" value={form.estado} onChange={handleChange}>
          <option value="activo">Activo</option>
          <option value="fuera_servicio">Fuera de servicio</option>
          <option value="baja">Baja</option>
        </select>

        <button type="submit">
          {editandoId ? "Actualizar" : "Guardar"}
        </button>
      </form>

      {/* 📊 TABLA */}
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Serie</th>
            <th>Equipo</th>
            <th>Área</th>
            <th>Encargado</th>
            <th>Último Mant.</th>
            <th>Próximo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {equipos.map((eq) => (
            <tr key={eq.id}>
              <td>{eq.numero_serie}</td>
              <td>{eq.descripcion} - {eq.marca_modelo}</td>
              <td>{eq.area}</td>
              <td>{eq.encargado}</td>
              <td>
                {eq.ultimo_mant
                  ? new Date(eq.ultimo_mant).toLocaleString()
                  : "-"}
              </td>
              <td>
                {calcularProximo(eq.ultimo_mant, eq.periodo)}
              </td>
              <td
  style={{
    color:
      new Date(calcularProximo(eq.ultimo_mant, eq.periodo)) < new Date()
        ? "red"
        : "black"
  }}
>
  {calcularProximo(eq.ultimo_mant, eq.periodo)}
</td>

<td>{eq.estado}</td>
              <td>
                <button onClick={() => editarEquipo(eq)}>Editar</button>
                <button onClick={() => eliminarEquipo(eq.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
