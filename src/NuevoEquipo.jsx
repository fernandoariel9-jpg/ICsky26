import { useState, useEffect, useRef } from "react";
import { API_URL } from "./config";

export default function NuevoEquipo({ setVista }) {

  //====================================================
  // DATOS DEL EQUIPO
  //====================================================

  const [descripcion, setDescripcion] = useState("");
  const [marcaModelo, setMarcaModelo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");

  const [estado, setEstado] = useState("Activo");

  const [imagen, setImagen] = useState(null);

  const [modoEdicion, setModoEdicion] = useState(false);
  const [equipoEditar, setEquipoEditar] = useState(null);

  //====================================================
  // UBICACIÓN
  //====================================================

  const [areas, setAreas] = useState([]);
  const [servicios, setServicios] = useState([]);

  const [area, setArea] = useState("");
  const [servicio, setServicio] = useState("");
  const [subServicio, setSubServicio] = useState("");
  const [encargado, setEncargado] = useState("");

  //====================================================
  // OTROS
  //====================================================

  const [guardando, setGuardando] = useState(false);

  const inputImagenRef = useRef(null);
  const inputCamaraRef = useRef(null);
  const inputGaleriaRef = useRef(null);
  
  //====================================================
  // CARGAR DATOS
  //====================================================

useEffect(() => {
  cargarDatos();

  const guardado = localStorage.getItem("equipoEditar");

  if (guardado) {
    try {
      const equipo = JSON.parse(guardado);

      console.log("Equipo a editar:", equipo);

      setEquipoEditar(equipo);
      setModoEdicion(true);

      setNumeroSerie(equipo.numero_serie || "");
      setDescripcion(equipo.descripcion || "");
      setMarcaModelo(equipo.marca_modelo || "");
      setEstado(equipo.estado || "Activo");
      setImagen(equipo.imagen || null);

    } catch (error) {
      console.error("Error leyendo equipo a editar:", error);
    }
  }
}, []);

  useEffect(() => {

  if (!modoEdicion || !equipoEditar || servicios.length === 0) {
    return;
  }

  const equipo = equipoEditar;

  console.log("Cargando datos de ubicación:", {
    area: equipo.area,
    servicio: equipo.servicio,
    subServicio: equipo.sub_servicio
  });

  setArea(equipo.area || "");
  setServicio(equipo.servicio || "");
  setSubServicio(equipo.sub_servicio || "");

  // Buscar el encargado correspondiente
  const fila = servicios.find(
    s =>
      s.area === equipo.area &&
      s.servicio === equipo.servicio &&
      s.subservicio === equipo.sub_servicio
  );

  setEncargado(
    equipo.encargado ||
    fila?.encargado ||
    ""
  );

}, [modoEdicion, equipoEditar, servicios]);

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
      console.error(err);
      alert("Error cargando áreas y servicios");
    }
  };

  //====================================================
  // GUARDAR EQUIPO
  //====================================================

  const guardarEquipo = async () => {

    if (!descripcion.trim()) {
      alert("Ingrese la descripción.");
      return;
    }
    if (!numeroSerie.trim()) {
      alert("Ingrese el número de serie.");
      return;
    }
    if (!area) {
      alert("Seleccione un área.");
      return;
    }
    if (!servicio) {
      alert("Seleccione un servicio.");
      return;
    }
    if (!subServicio) {
      alert("Seleccione un subservicio.");
      return;
    }
    try {

      setGuardando(true);
      const res = await fetch(API_URL.Equipos, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          numero_serie: numeroSerie.toUpperCase().trim(),
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
        throw new Error(data.error);
      }
      alert("Equipo creado correctamente.");
      setVista("equipos");
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  //====================================================
  // TOMAR FOTO
  //====================================================

  const subirImagen = (e) => {
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
      setImagen(
        canvas.toDataURL(
          "image/jpeg",
          0.70
        )
      );
    };
  };

  return (
  <div className="max-w-xl mx-auto bg-white shadow rounded-xl p-6">

    <h1 className="text-2xl font-bold mb-6 text-center">
  {modoEdicion ? "Editar Equipo" : "Nuevo Equipo"}
</h1>

    <div className="space-y-4">

      {/* Descripción */}

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

      {/* Marca */}

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

      {/* Serie */}

      <div>
        <label className="block font-semibold mb-1">
          Número de serie *
        </label>

        <input
          type="text"
          value={numeroSerie}
          onChange={(e) =>
            setNumeroSerie(
              e.target.value.toUpperCase()
            )
          }
          className="w-full border rounded p-2"
        />
      </div>

      {/* Área */}

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

          <option value="">
            Seleccione un área
          </option>

          {areas.map((a) => (

            <option
              key={a.id}
              value={a.area}
            >
              {a.area}
            </option>

          ))}
        </select>
      </div>

      {/* Servicio */}

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

          <option value="">
            Seleccione un servicio
          </option>

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

      {/* Subservicio */}

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
            setEncargado(
              fila?.encargado || ""
            );
          }}
          className="w-full border rounded p-2"
        >

          <option value="">
            Seleccione un subservicio
          </option>
          
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
      </div>

      {/* Encargado */}

      <div>
        <label className="block font-semibold mb-1">
          Encargado
        </label>

        <input
          value={encargado}
          readOnly
          className="w-full border rounded p-2 bg-gray-100"
        />
      </div>

      {/* Estado */}

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
          <option>Ingresado</option>
          <option>Fuera de servicio</option>
          <option>Reparación en fábrica</option>
          <option>Obsoleto</option>
          <option>De baja</option>
        </select>
      </div>

      {/* Imagen */}

       <div className="flex gap-2">
       <button
  onClick={() => inputCamaraRef.current.click()}
  className="w-full bg-blue-600 text-white rounded p-2 mt-2"
>
📷 Tomar fotografía
</button>

<button
  onClick={() => inputGaleriaRef.current.click()}
  className="w-full bg-gray-600 text-white rounded p-2 mt-2"
>
🖼 Elegir desde galería
</button>
       </div>

     {/* Cámara */}
<input
  ref={inputCamaraRef}
  type="file"
  accept="image/*"
  capture="environment"
  hidden
  onChange={subirImagen}
/>

{/* Galería */}
<input
  ref={inputGaleriaRef}
  type="file"
  accept="image/*"
  hidden
  onChange={subirImagen}
/>

      {imagen && (
        <img
          src={imagen}
          alt="Equipo"
          className="rounded-lg border shadow w-full"
        />
      )}
    </div>

    {/* Botones */}

    <div className="flex gap-3 mt-6">

      <button
  onClick={guardarEquipo}
  className="flex-1 bg-green-600 text-white rounded p-3"
>
  {modoEdicion ? "💾 Guardar cambios" : "💾 Guardar equipo"}
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
