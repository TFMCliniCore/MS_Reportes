# 📊 MS Reportes y Métricas — CliniCore

Microservicio transversal del ecosistema **CliniCore** encargado de consolidar y exponer datos de todos los microservicios para producir reportes operativos, estadísticas de negocio e indicadores de rendimiento (KPIs).

## ✨ Características

- ✅ Todos los endpoints son **GET con query params** — responden **200 OK** con JSON puro
- ✅ El frontend es responsable de renderizar PDF/XLSX con los datos devueltos
- ✅ **Métricas en tiempo real** — dashboard, inventario y citas se calculan consultando los MS fuente directamente; el cron persiste snapshots cada 10 minutos como respaldo histórico
- ✅ **Interceptor global de auditoría** — cada petición queda registrada en `reporte_logs` con tipo, duración, estado y fuentes fallidas
- ✅ **Tolerancia a fallos parciales** — si un MS fuente no responde, el reporte se genera con los datos disponibles e indica las fuentes fallidas en `fuentesFallidas[]`
- ✅ Solo lectura sobre microservicios fuente — nunca escribe en otros MS
- ✅ Base de datos propia PostgreSQL — no comparte esquema con ningún otro MS
- ✅ Normalización automática de formatos de respuesta de los MS fuente (array plano, `{ data: [] }`, `{ items: [] }`)

## 🛠️ Stack

| Tecnología | Versión | Uso |
| --- | --- | --- |
| NestJS | ^11 | Framework principal |
| Prisma ORM | ^6 | Acceso a base de datos |
| PostgreSQL | 16 | Base de datos propia |
| TypeScript | ^5.7 | Lenguaje |
| @nestjs/schedule | ^5 | Cron jobs para snapshots de métricas |
| Docker / Docker Compose | — | Contenedorización |
| Node.js | >= 22 | Runtime |

## 📋 Requisitos previos

- Node.js 22 o superior
- Docker y Docker Compose
- (Opcional para desarrollo local) PostgreSQL 16

## ⚙️ Variables de entorno

```bash
cp .env.example .env
```

```env
PORT=3006
POSTGRES_USER=reportes_user
POSTGRES_PASSWORD=secret
POSTGRES_DB=ms_reportes
POSTGRES_PORT=5437
DATABASE_URL=postgresql://reportes_user:secret@localhost:5437/ms_reportes?schema=public

# ── Ejecución LOCAL ───────────────────────────────────────────────────────────
MS_ENTIDADES_URL=http://localhost:3001/api/v1
MS_INVENTARIO_URL=http://localhost:3007/api/v1
MS_AGENDA_URL=http://localhost:3003/api/v1
MS_HISTORIA_URL=http://localhost:3005/api/v1
MS_VENTAS_URL=http://localhost:3008/api/v1

# ── Ejecución en Docker (descomentar si se levanta con docker compose) ────────
# MS_ENTIDADES_URL=http://host.docker.internal:3001/api/v1
# MS_INVENTARIO_URL=http://host.docker.internal:3007/api/v1
# MS_AGENDA_URL=http://host.docker.internal:3003/api/v1
# MS_HISTORIA_URL=http://host.docker.internal:3005/api/v1
# MS_VENTAS_URL=http://host.docker.internal:3008/api/v1

CACHE_TTL_MINUTES=5
SNAPSHOT_INTERVAL_MINUTES=15
MAX_DATE_RANGE_DAYS=366
```

## 🐳 Ejecución con Docker

```bash
docker compose up --build        # construir y levantar
docker compose up -d             # solo levantar
docker compose stop              # parar contenedores
docker compose down -v           # detener y borrar volúmenes
```

| Servicio | URL |
| --- | --- |
| API | `http://localhost:3006` |
| PostgreSQL | `localhost:5437` |

Al iniciar el contenedor la API ejecuta automáticamente:
1. `prisma db push` — crea/actualiza las tablas
2. `npm run prisma:seed` — carga las 7 plantillas de reporte
3. `node dist/main.js` — arranca el servidor

## 💻 Ejecución local

```bash
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run start:dev
```

```bash
npm run build                    # compilar TypeScript
npm run start:dev                # modo desarrollo (watch)
npm run start:prod               # modo producción
npm run prisma:generate          # regenerar cliente Prisma
npm run prisma:migrate:dev       # crear nueva migración
npm run prisma:seed              # cargar plantillas iniciales
```

## 🏗️ Estructura del proyecto

```
ms-reportes/
├── prisma/
│   ├── schema.prisma               # ReportLog · MetricaSnapshot · PlantillaReporte · ReporteCache
│   └── seed.js                     # 7 plantillas de reporte iniciales
│
├── src/
│   ├── main.ts                     # Bootstrap: puerto 3006, prefijo api/v1, pipes, filtros
│   ├── app.module.ts               # Módulo raíz — registra módulos e interceptor global
│   │
│   ├── prisma/
│   │   ├── prisma.service.ts
│   │   ├── prisma.module.ts        # @Global
│   │   └── prisma-client-exception.filter.ts
│   │
│   ├── clientes-ms/
│   │   ├── ms-client.service.ts    # get() y getArray() — normaliza array plano / {data:[]} / {items:[]}
│   │   └── ms-client.module.ts     # @Global
│   │
│   ├── interceptors/
│   │   └── reporte-log.interceptor.ts  # Persiste ReportLog en cada petición (éxito y error)
│   │
│   ├── health/
│   │   └── health.controller.ts    # GET /health
│   │
│   ├── metricas/
│   │   ├── metricas.controller.ts  # GET /reportes/metricas/*
│   │   ├── metricas.service.ts     # Cálculo en tiempo real + @Cron cada 10 min (snapshots)
│   │   └── metricas.module.ts
│   │
│   ├── clientes/
│   │   ├── dto/reporte-clientes.dto.ts
│   │   ├── clientes.controller.ts  # GET /reportes/clientes | /sin-visita | /top-gasto
│   │   ├── clientes.service.ts     # Consume: MS Entidades (clientes), MS Ventas (top-gasto)
│   │   └── clientes.module.ts
│   │
│   ├── pacientes/
│   │   ├── dto/reporte-pacientes.dto.ts
│   │   ├── pacientes.controller.ts # GET /reportes/pacientes | /vacunas-vencer | /:id/ficha | /historia-clinica
│   │   ├── pacientes.service.ts    # Consume: MS Entidades (pacientes), MS Historia (ficha, historias)
│   │   └── pacientes.module.ts
│   │
│   ├── citas/
│   │   ├── dto/reporte-citas.dto.ts   # Estados: NO_COMPLETADO · COMPLETADO · CANCELADO
│   │   ├── citas.controller.ts     # GET /reportes/citas | /tasa-asistencia | /recordatorios | /sala-espera
│   │   ├── citas.service.ts        # Consume: MS Agenda (citas, recordatorios, sala-espera)
│   │   └── citas.module.ts         # tasa-asistencia se calcula aquí (no existe en MS Agenda)
│   │
│   ├── inventario/
│   │   ├── dto/reporte-inventario.dto.ts  # Tipos movimiento: ENTRADA · SALIDA · AJUSTE
│   │   ├── inventario.controller.ts  # GET /reportes/inventario/stock | /movimientos | /valoracion
│   │   ├── inventario.service.ts   # Consume: MS Inventario (productos, movimientos-stock)
│   │   └── inventario.module.ts
│   │
│   ├── ventas/
│   │   ├── dto/reporte-ventas.dto.ts
│   │   ├── ventas.controller.ts    # GET /reportes/ventas | /por-producto | /por-categoria | /caja-diaria
│   │   ├── ventas.service.ts       # Consume: MS Ventas
│   │   └── ventas.module.ts
│   │
│   ├── logs/
│   │   ├── logs.controller.ts      # GET /reportes/logs (paginado) | /logs/:id
│   │   ├── logs.service.ts
│   │   └── logs.module.ts
│   │
│   └── common/
│       ├── dto/reporte-base.dto.ts
│       └── helpers/reporte.helper.ts   # validarRangoFechas()
│
├── postman/
│   ├── MS_Reportes.postman_collection.json
│   └── MS_Reportes.postman_environment.json
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## 🌐 URL Base

```
http://localhost:3006/api/v1
```

## 📡 Endpoints

> Todos son `GET`. Responden `200 OK` con JSON:
> ```json
> { "data": [...], "resumen": { ... }, "fuentesFallidas": [], "generadoEn": "ISO" }
> ```

### 🔍 Health

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/v1/health` | Estado del MS y conexión a BD |

### 📈 Métricas del dashboard

Calculan en tiempo real consultando los MS fuente. El cron las persiste cada 10 minutos como historial.

| Método | Ruta | Query params | Descripción |
| --- | --- | --- | --- |
| GET | `/api/v1/reportes/metricas/dashboard` | `sucursalId?` | KPIs consolidados: inventario + pacientes + clientes + agenda |
| GET | `/api/v1/reportes/metricas/ventas` | `sucursalId?`, `periodo?` | Total ventas, transacciones y ticket promedio del período |
| GET | `/api/v1/reportes/metricas/citas` | `sucursalId?` | Completadas, canceladas, pendientes y tasas del mes |
| GET | `/api/v1/reportes/metricas/inventario` | `sucursalId?` | Total productos, valor de compra/venta, productos bajo mínimo |

`periodo` acepta: `HOY` · `SEMANA` · `MES` · `TRIMESTRE` · `ANUAL` (default: `MES`)

**Respuesta de `/metricas/dashboard`:**

```json
{
  "inventario": {
    "totalProductos": 124,
    "valorInventarioCompra": 12500.00,
    "valorInventarioVenta": 54320.50,
    "stockBajo": 8
  },
  "pacientes": { "total": 152 },
  "clientes":  { "total": 89 },
  "agenda": {
    "citasHoy": 5,
    "citasMes": 23,
    "completadasMes": 18,
    "canceladasMes": 2,
    "pendientesMes": 3,
    "tasaCompletadasMes": 78.3
  },
  "fuentesFallidas": [],
  "generadoEn": "2026-05-31T..."
}
```

**Respuesta de `/metricas/inventario`:**

```json
{
  "totalProductos": 124,
  "valorInventarioCompra": 12500.00,
  "valorInventarioVenta": 54320.50,
  "stockBajo": 8,
  "fuentesFallidas": [],
  "generadoEn": "..."
}
```

**Respuesta de `/metricas/citas`:**

```json
{
  "periodo": "MES",
  "total": 23,
  "completadas": 18,
  "canceladas": 2,
  "pendientes": 3,
  "tasaCompletadas": 78.3,
  "tasaCanceladas": 8.7,
  "porTipo": { "Consulta": 12, "Vacunacion": 7, "Cirugia": 4 },
  "fuentesFallidas": [],
  "generadoEn": "..."
}
```

**Respuesta de `/metricas/ventas`:**

```json
{
  "periodo": "MES",
  "totalVentas": 54320.50,
  "totalTransacciones": 89,
  "ticketPromedio": 610.34,
  "detalle": [ ... ],
  "fuentesFallidas": [],
  "generadoEn": "..."
}
```

### 👥 Clientes

Fuente: **MS Entidades Core** `:3001`

| Método | Ruta | Query params | Descripción |
| --- | --- | --- | --- |
| GET | `/api/v1/reportes/clientes` | `sucursalId?` | Todos los clientes activos |
| GET | `/api/v1/reportes/clientes/sin-visita` | `diasSinVisita`, `sucursalId?` | Clientes sin visita en N días |
| GET | `/api/v1/reportes/clientes/top-gasto` | `desde?`, `hasta?`, `limite?`, `sucursalId?` | Ranking por monto facturado |

### 🐾 Pacientes

Fuentes: **MS Entidades Core** `:3001` · **MS Historia Clínica** `:3005`

| Método | Ruta | Query params | Descripción |
| --- | --- | --- | --- |
| GET | `/api/v1/reportes/pacientes` | `especie?`, `raza?`, `sucursalId?` | Listado de pacientes activos |
| GET | `/api/v1/reportes/pacientes/vacunas-vencer` | `diasAlerta`, `sucursalId?` | Vacunas próximas a vencer |
| GET | `/api/v1/reportes/pacientes/:id/ficha` | — | Ficha completa: paciente + historias + citas + recordatorios |
| GET | `/api/v1/reportes/historia-clinica` | `pacienteId?`, `sucursalId?`, `desde?`, `hasta?` | Listado de historias clínicas con filtros |

### 📅 Citas y Agenda

Fuente: **MS Agenda** `:3003`

| Método | Ruta | Query params | Descripción |
| --- | --- | --- | --- |
| GET | `/api/v1/reportes/citas` | `desde?`, `hasta?`, `estado?`, `tipo?`, `pacienteId?` | Listado de citas |
| GET | `/api/v1/reportes/citas/tasa-asistencia` | `desde?`, `hasta?`, `pacienteId?` | Tasas de completadas, canceladas y pendientes |
| GET | `/api/v1/reportes/recordatorios` | `desde?`, `hasta?`, `estado?`, `pacienteId?` | Listado de recordatorios |
| GET | `/api/v1/reportes/sala-espera` | `desde?`, `hasta?`, `pacienteId?` | Entradas en sala de espera |

**Estados válidos de cita:** `NO_COMPLETADO` · `COMPLETADO` · `CANCELADO`

> `tasa-asistencia` calcula `tasaCompletadas`, `tasaCanceladas` y `tasaPendientes` (%) a partir de las citas del período. El endpoint no existe en MS Agenda; lo agrega este MS.

### 📦 Inventario

Fuente: **MS Inventario** `:3007`

| Método | Ruta | Query params | Descripción |
| --- | --- | --- | --- |
| GET | `/api/v1/reportes/inventario/stock` | `sucursalId?`, `categoriaId?`, `stockBajo?` | Stock actual de productos |
| GET | `/api/v1/reportes/inventario/movimientos` | `productoId?`, `tipo?`, `sucursalId?`, `usuarioId?` | Movimientos de stock |
| GET | `/api/v1/reportes/inventario/valoracion` | `sucursalId?` | Valorización: precio compra vs venta |

**Tipos de movimiento válidos:** `ENTRADA` · `SALIDA` · `AJUSTE`

`stockBajo=true` filtra productos con `cantidadActual <= cantidadMinima`.

### 💰 Ventas

Fuente: **MS Ventas** `:3008`

| Método | Ruta | Query params | Descripción |
| --- | --- | --- | --- |
| GET | `/api/v1/reportes/ventas` | `desde?`, `hasta?`, `sucursalId?`, `agrupacion?` | Ventas por período |
| GET | `/api/v1/reportes/ventas/por-producto` | `desde?`, `hasta?`, `limite?`, `sucursalId?` | Ranking de productos más vendidos |
| GET | `/api/v1/reportes/ventas/por-categoria` | `desde?`, `hasta?`, `sucursalId?` | Distribución por categoría |
| GET | `/api/v1/reportes/ventas/caja-diaria` | `fecha`, `sucursalId` | Resumen de caja del día |

`agrupacion` acepta: `dia` · `semana` · `mes`

### 🗒️ Auditoría

| Método | Ruta | Query params | Descripción |
| --- | --- | --- | --- |
| GET | `/api/v1/reportes/logs` | `page?`, `limit?`, `tipo?`, `usuarioId?`, `sucursalId?` | Historial paginado de consultas |
| GET | `/api/v1/reportes/logs/:id` | — | Detalle de un log |

**Tipos de log:** `CLIENTES` · `PACIENTES` · `CITAS` · `INVENTARIO` · `VENTAS` · `HISTORIA_CLINICA` · `CAJA` · `METRICAS`

## 📦 Formato de respuesta

Todos los endpoints de reporte devuelven:

```json
{
  "data": [ ... ],
  "resumen": { "total": 4, "bajosStock": 1 },
  "fuentesFallidas": [],
  "generadoEn": "2026-05-31T02:00:00.000Z"
}
```

La ficha clínica (`/pacientes/:id/ficha`) devuelve:

```json
{
  "paciente": { ... },
  "historias": [ ... ],
  "citas": [ ... ],
  "recordatorios": [ ... ],
  "fuentesFallidas": [],
  "generadoEn": "..."
}
```

Si `fuentesFallidas` no está vacío, el log queda con estado `PARCIAL`.

## 🗄️ Modelo de datos

### ReportLog

```
id              — PK
tipo            — CLIENTES | PACIENTES | CITAS | INVENTARIO | VENTAS | HISTORIA_CLINICA | CAJA | METRICAS
formato         — JSON (todos los endpoints devuelven JSON)
parametros      — JSON con los query params aplicados
estado          — EXITOSO | PARCIAL | FALLIDO | EN_PROCESO
fuentesFallidas — string[] de MS que no respondieron
duracionMs      — milisegundos de generación
usuarioId       — del header x-usuario-id (0 si no se envía)
sucursalId
errorDetalle
createdAt
```

### MetricaSnapshot

```
id · clave · valor · valorAnterior · variacionPct
sucursalId · periodo · extras (JSON) · calculadoEn · vigente
```

Índice compuesto: `[clave, sucursalId, periodo, vigente]`

### PlantillaReporte

```
id · nombre (UNIQUE) · tipo · configuracion (JSON) · activa · version · createdAt · updatedAt
```

### ReporteCache

```
id · claveHash (SHA-256, UNIQUE) · tipo · formato · datos (Bytes) · bytesArchivo · expiresAt · createdAt
```

## 🌱 Datos iniciales

El seed crea 7 plantillas de reporte:

| Nombre | Tipo |
| --- | --- |
| `clientes_v1` | CLIENTES |
| `pacientes_v1` | PACIENTES |
| `citas_v1` | CITAS |
| `inventario_v1` | INVENTARIO |
| `ventas_v1` | VENTAS |
| `historia_clinica_v1` | HISTORIA_CLINICA |
| `caja_v1` | CAJA |

## 🌐 Integración con microservicios fuente

| Variable | MS fuente | Puerto | Datos consumidos |
| --- | --- | --- | --- |
| `MS_ENTIDADES_URL` | MS Entidades Core | 3001 | Clientes, pacientes, sucursales, usuarios |
| `MS_INVENTARIO_URL` | MS Inventario | 3007 | Productos, movimientos de stock |
| `MS_AGENDA_URL` | MS Agenda | 3003 | Citas, recordatorios, sala de espera |
| `MS_HISTORIA_URL` | MS Historia Clínica | 3005 | Historias clínicas, ficha completa del paciente |
| `MS_VENTAS_URL` | MS Ventas | 3008 | Ventas, top clientes, caja diaria |

> 🔒 Solo lectura — este MS nunca realiza `POST`, `PUT`, `PATCH` ni `DELETE` hacia otros servicios.

## ⚡ Normalización de respuestas

El `MsClientService.getArray()` normaliza automáticamente cualquier formato de respuesta:

| Formato devuelto por el MS fuente | Resultado |
| --- | --- |
| `[ {...}, {...} ]` | ✅ array directo |
| `{ "data": [ ... ] }` | ✅ extrae `data` |
| `{ "items": [ ... ] }` | ✅ extrae `items` |
| Error o timeout (> 8 s) | ✅ `[]` + `fallido: true` |

## 📊 Métricas y snapshots

Los endpoints `/metricas/*` calculan **en tiempo real** consultando los MS fuente directamente:

- **`/metricas/dashboard`** → llama en paralelo a `GET /productos` (Inventario), `GET /pacientes`, `GET /clientes` (Entidades) y `GET /citas` con filtro de hoy y del mes (Agenda)
- **`/metricas/inventario`** → agrega `cantidadActual * precio` sobre el array completo de productos
- **`/metricas/citas`** → filtra el mes actual y cuenta por estado (`COMPLETADO`, `CANCELADO`, `NO_COMPLETADO`)
- **`/metricas/ventas`** → consulta el MS Ventas con el rango del período indicado

Adicionalmente, el `MetricasService` ejecuta un `@Cron` cada 10 minutos que:

1. Llama a `getDashboard()` con datos reales
2. Marca los snapshots anteriores como `vigente = false`
3. Persiste los nuevos valores en `metricas_snapshots` para consultas históricas

El cron es complementario — los endpoints no dependen de los snapshots para responder.

## 🛡️ Interceptor de auditoría

`ReporteLogInterceptor` es global. Cada controlador popula `req.reporteMeta` antes de invocar el servicio:

```typescript
req.reporteMeta = {
  tipo: 'CITAS',
  parametros: query,
  usuarioId: Number(req.headers['x-usuario-id'] ?? 0),
  sucursalId: query.sucursalId,
};
```

El interceptor persiste el log automáticamente al terminar, calculando `duracionMs` y el `estado` (`EXITOSO` / `PARCIAL` / `FALLIDO`).

## ✅ Validaciones

`ValidationPipe` global con `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true`.

Errores Prisma convertidos a HTTP:

| Código | HTTP | Descripción |
| --- | --- | --- |
| `P2002` | 409 | Valor único duplicado |
| `P2025` | 404 | Registro no encontrado |
| `P2003` | 400 | Violación de relación entre entidades |

## 📝 Notas

- Sin autenticación propia — el JWT lo valida el API Gateway y pasa `x-usuario-id` como header
- El MS está registrado en el API Gateway con `serviceKey: reportes`, prefijo `/reportes`, puerto `3006`
- El rango máximo por reporte es `MAX_DATE_RANGE_DAYS` (default 366); rangos mayores devuelven 400
- `tasa-asistencia` se calcula en este MS porque MS Agenda no expone ese endpoint

## 📄 Licencia

MIT License
