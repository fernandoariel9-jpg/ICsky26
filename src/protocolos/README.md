# Estándar de protocolos RIC

RIC29 es la referencia funcional y visual del sistema. Todo protocolo nuevo debe conservar su patrón de trabajo salvo que el formulario original exija una excepción.

## Patrón obligatorio

Todos los RIC nuevos deben mantener:

- Fondo general `bg-gray-50`.
- Contenido principal `max-w-xl mx-auto`.
- Barra superior sticky con código RIC, etapa, contador y progreso.
- Ficha compacta de equipo con descripción, marca/modelo, serie, área y servicio.
- Etapas dentro de tarjetas `bg-white rounded-xl shadow p-4`.
- Instrucciones dentro de bloque `bg-gray-50 rounded-lg p-3`.
- Botones de navegación con el mismo patrón de RIC29:
  - Volver: gris.
  - Cancelar: rojo.
  - Continuar/Aceptar: azul.
- Botón Cancelar disponible durante todo el protocolo. Debe eliminar la tarea preventiva creada y limpiar `tareaActiva` y el borrador.
- Borrador local para no perder datos durante la carga.
- Resumen final con:
  - bloque verde `MANTENIMIENTO CONFORME`, o
  - bloque rojo `MANTENIMIENTO NO CONFORME` y detalle de fallas.
- Observaciones generales.
- Botón `Guardar preventivo`.
- Después de guardar, preguntar `¿En qué estado queda el equipo?`.
- Finalizar `ric01`, guardar `fecha_fin` y actualizar el estado del equipo.
- Botón `Ver / Descargar PDF`.
- Botón `Salir`.
- Botón `Enviar a Google Drive`.
- Volver a Equipos conservando el refresco mediante `equipoActualizado`.

## Componentes comunes

### `ProtocoloBase.jsx`

Contiene:

- `useProtocoloBase`
- `ProtocoloLayout`
- `FichaEquipo`
- `TarjetaEtapa`
- `BotonesNavegacion`
- `ResumenMantenimiento`
- `ModalEstadoFinal`
- `fechaHoraLocalProtocolo`
- `normalizarTextoProtocolo`

No duplicar estas funciones en un RIC nuevo salvo que haya una necesidad específica del protocolo.

### `ProtocoloChecklist.jsx`

Motor para formularios cuyos puntos usan:

- Conforme
- No conforme
- No aplica

Incluye automáticamente:

- navegación punto por punto;
- observaciones por punto;
- borrador;
- validación;
- resumen;
- guardado;
- Cancelar;
- estado final del equipo;
- PDF;
- Drive;
- Salir.

## Ejemplo de un nuevo RIC checklist

```jsx
import { API_URL } from "./config";
import ProtocoloChecklist from "./protocolos/ProtocoloChecklist";

const configRICXX = {
  codigo: "RICXX",
  tituloCorto: "MP Nombre del equipo",
  tituloEtapa: "1. Verificación funcional",
  defaultDescripcion: "NOMBRE DEL EQUIPO",
  endpoint: API_URL.RicXX,
  nombreIdRespuesta: "ricxx_id",
  borradorPrefijo: "preventivo:ricxx",
  requiereEnUso: false,
  puntos: [
    "Punto 1",
    "Punto 2",
    "Punto 3"
  ]
};

export default function RICXX({ setVista, personal }) {
  return (
    <ProtocoloChecklist
      config={configRICXX}
      setVista={setVista}
      personal={personal}
    />
  );
}
```

## Registro de equipos y protocolos

`registroProtocolos.js` centraliza la relación entre descripción del equipo, código RIC y vista.

Al agregar un nuevo protocolo específico se debe incorporar allí la descripción o alias del equipo, normalizados sin depender de mayúsculas ni tildes.

## Protocolos con mediciones

Los RIC con mediciones numéricas, rangos, incertidumbres, secuencias especiales o instrumentos específicos pueden tener etapas propias, pero deben seguir usando `ProtocoloBase.jsx` para toda la infraestructura y estética común.

RIC29 sigue siendo el patrón principal para este tipo de protocolo avanzado.
