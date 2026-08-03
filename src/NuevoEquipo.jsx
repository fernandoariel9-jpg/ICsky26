import { useState, useEffect, useRef } from "react";

export default function NuevoEquipo({ setVista }) {

const [areas, setAreas] = useState([]);
const [servicios, setServicios] = useState([]);
const [subservicios, setSubservicios] = useState([]);

const [area, setArea] = useState("");
const [servicio, setServicio] = useState("");
const [subServicio, setSubServicio] = useState("");

const [encargado, setEncargado] = useState("");

const [imagen, setImagen] = useState(null);

const inputImagenRef = useRef(null);

  useEffect(() => {
  cargarDatos();
}, []);

  const cargarDatos = async () => {

  try {

    const [resAreas, resServicios] = await Promise.all([
      fetch(API_URL.Areas),
      fetch(API_URL.Servicios)
    ]);

    const datosAreas = await resAreas.json();
    const datosServicios = await resServicios.json();

    setAreas(datosAreas);
    setServicios(datosServicios);

  } catch (err) {

    console.error("Error cargando datos:", err);

  }

};

  const guardarEquipo = async () => {

  if (!descripcion.trim()) {
    alert("Debe ingresar una descripción.");
    return;
  }

  if (!numeroSerie.trim()) {
    alert("Debe ingresar el número de serie.");
    return;
  }

  try {

    const res = await fetch(API_URL.Equipos, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        numero_serie: numeroSerie,
        descripcion,
        marca_modelo: marcaModelo,
        servicio,
        sub_servicio: subServicio,
        encargado,
        area,
        periodo: null,
        ultimo_mant: null,
        fecha_baja: null,
        estado,
        imagen

      })

    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error");
    }

    alert("Equipo creado correctamente.");

    setVista("equipos");

  } catch (err) {

    alert(err.message);

  }

};

  const subirImagen = async (e) => {

  const file = e.target.files[0];

  if (!file) return;

  const img = new Image();

  img.src = URL.createObjectURL(file);

  img.onload = () => {

    const canvas = document.createElement("canvas");

    const MAX = 800;

    let { width, height } = img;

    if (width > height) {

      if (width > MAX) {

        height *= MAX / width;
        width = MAX;

      }

    } else {

      if (height > MAX) {

        width *= MAX / height;
        height = MAX;

      }

    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(img, 0, 0, width, height);

    const base64 = canvas.toDataURL("image/jpeg", 0.7);

    setImagen(base64);

  };

};

  return (
    <div className="max-w-xl mx-auto bg-white shadow rounded-xl p-6">

      <h1 className="text-2xl font-bold mb-6 text-center">
        Nuevo Equipo
      </h1>

      <div className="space-y-4">

        <div>
          <label className="block font-semibold mb-1">
            Descripción *
          </label>

          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">
            Marca / Modelo
          </label>

          <input
            type="text"
            value={marcaModelo}
            onChange={(e) => setMarcaModelo(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">
            Número de serie *
          </label>

          <input
            type="text"
            value={numeroSerie}
            onChange={(e) => setNumeroSerie(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">
            Servicio
          </label>

          <select
  value={servicio}
  onChange={(e) => {

    setServicio(e.target.value);

    setSubServicio("");
    setEncargado("");

  }}
  className="w-full border rounded p-2"
>

  <option value="">Seleccione un servicio</option>

  {[
    ...new Map(
      servicios
        .filter(s => s.area === area)
        .map(s => [s.servicio, s])
    ).values()
  ].map((s) => (

    <option
      key={s.servicio}
      value={s.servicio}
    >
      {s.servicio}
    </option>

  ))}

</select>
        </div>

        <div>
          <label className="block font-semibold mb-1">
            Subservicio
          </label>

          <select
  value={subServicio}
  onChange={(e) => {

    const valor = e.target.value;

    setSubServicio(valor);

    const fila = servicios.find(
      s =>
        s.area === area &&
        s.servicio === servicio &&
        s.subservicio === valor
    );

    setEncargado(fila?.encargado || "");

  }}
  className="w-full border rounded p-2"
>

  <option value="">Seleccione un subservicio</option>

  {servicios
    .filter(
      s =>
        s.area === area &&
        s.servicio === servicio
    )
    .map((s) => (

      <option
        key={s.subservicio}
        value={s.subservicio}
      >
        {s.subservicio}
      </option>

    ))}

</select>
         
  <label className="block font-semibold mb-1">
    Encargado
  </label>

  <input
    type="text"
    value={encargado}
    readOnly
    className="w-full border rounded p-2 bg-gray-100"
  />
</div>

        <div>
          <label className="block font-semibold mb-1">
            Área
          </label>

         <select
  value={area}
  onChange={(e) => {

    setArea(e.target.value);

    setServicio("");
    setSubServicio("");
    setEncargado("");

  }}
  className="w-full border rounded p-2"
>

  <option value="">Seleccione un área</option>

  {areas.map((a) => (

    <option key={a.id} value={a.area}>
      {a.area}
    </option>

  ))}

</select>
        </div>

        <div>
          <label className="block font-semibold mb-1">
            Estado
          </label>

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option>Activo</option>
            <option>Fuera de servicio</option>
            <option>Ingresado</option>
            <option>Reparación en fábrica</option>
            <option>Obsoleto</option>
            <option>De baja</option>
          </select>
        </div>

        <button
          onClick={() => inputImagenRef.current.click()}
          className="w-full bg-gray-600 text-white rounded p-2"
        >
          📷 Agregar fotografía
        </button>

          {imagen && (

  <div className="mt-3">

    <img
      src={imagen}
      alt="Equipo"
      className="w-full rounded-lg border shadow"
    />

  </div>

)}

        <input
  ref={inputImagenRef}
  type="file"
  accept="image/*"
  capture="environment"
  style={{ display: "none" }}
  onChange={subirImagen}
/>

      </div>

      <div className="flex gap-3 mt-6">

       <button
  onClick={guardarEquipo}
  className="flex-1 bg-green-600 text-white rounded p-3"
>
  💾 Guardar equipo
</button>

        <button
          onClick={() => setVista("equipos")}
          className="flex-1 bg-gray-500 text-white rounded p-3"
        >
          Cancelar
        </button>

      </div>

    </div>
  );

}
