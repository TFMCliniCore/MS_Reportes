const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const plantillas = [
  {
    nombre: 'clientes_v1',
    tipo: 'CLIENTES',
    configuracion: {
      columnas: ['nombre', 'documento', 'telefono', 'email', 'nMascotas', 'ultimaVisita', 'sucursal'],
      coloresEncabezado: '#0E314D',
      logoPath: 'assets/logo-clinicor.png',
      margenes: { top: 40, left: 40, right: 40, bottom: 40 },
    },
  },
  {
    nombre: 'pacientes_v1',
    tipo: 'PACIENTES',
    configuracion: {
      columnas: ['nombre', 'especie', 'raza', 'sexo', 'edad', 'propietario', 'sucursal'],
      coloresEncabezado: '#0E314D',
      logoPath: 'assets/logo-clinicor.png',
      margenes: { top: 40, left: 40, right: 40, bottom: 40 },
    },
  },
  {
    nombre: 'citas_v1',
    tipo: 'CITAS',
    configuracion: {
      columnas: ['fecha', 'hora', 'paciente', 'propietario', 'veterinario', 'estado', 'tipoServicio'],
      coloresEncabezado: '#0E314D',
      logoPath: 'assets/logo-clinicor.png',
      margenes: { top: 40, left: 40, right: 40, bottom: 40 },
    },
  },
  {
    nombre: 'inventario_v1',
    tipo: 'INVENTARIO',
    configuracion: {
      columnas: ['nombre', 'codigo', 'categoria', 'cantidadActual', 'cantidadMinima', 'precioVenta', 'sucursal'],
      coloresEncabezado: '#0E314D',
      logoPath: 'assets/logo-clinicor.png',
      margenes: { top: 40, left: 40, right: 40, bottom: 40 },
    },
  },
  {
    nombre: 'ventas_v1',
    tipo: 'VENTAS',
    configuracion: {
      columnas: ['fecha', 'cliente', 'producto', 'cantidad', 'precioUnitario', 'total', 'metodoPago'],
      coloresEncabezado: '#0E314D',
      logoPath: 'assets/logo-clinicor.png',
      margenes: { top: 40, left: 40, right: 40, bottom: 40 },
    },
  },
  {
    nombre: 'historia_clinica_v1',
    tipo: 'HISTORIA_CLINICA',
    configuracion: {
      columnas: ['fecha', 'motivo', 'diagnostico', 'tratamiento', 'veterinario'],
      coloresEncabezado: '#0E314D',
      logoPath: 'assets/logo-clinicor.png',
      marcaAgua: 'CONFIDENCIAL',
      margenes: { top: 40, left: 40, right: 40, bottom: 40 },
    },
  },
  {
    nombre: 'caja_v1',
    tipo: 'CAJA',
    configuracion: {
      columnas: ['hora', 'concepto', 'metodoPago', 'monto'],
      coloresEncabezado: '#0E314D',
      logoPath: 'assets/logo-clinicor.png',
      margenes: { top: 40, left: 40, right: 40, bottom: 40 },
    },
  },
];

async function main() {
  for (const plantilla of plantillas) {
    await prisma.plantillaReporte.upsert({
      where: { nombre: plantilla.nombre },
      update: { configuracion: plantilla.configuracion, activa: true },
      create: plantilla,
    });
    console.log('Plantilla registrada:', plantilla.nombre);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Error ejecutando el seed de MS Reportes:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
