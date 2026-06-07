const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Instalación',
      items: [
        'instalacion/requisitos',
        'instalacion/back',
        'instalacion/front',
      ],
    },
    {
      type: 'category',
      label: 'Base de datos',
      items: [
        'baseDeDatos/esquema',
        'baseDeDatos/supabase',
      ],
    },
    {
      type: 'category',
      label: 'Despliegue',
      items: [
        'despliegue/vercel-back',
        'despliegue/vercel-front',
      ],
    },
    {
      type: 'category',
      label: 'Mantenimiento',
      items: [
        'mantenimiento/variables-entorno',
        'mantenimiento/actualizaciones',
      ],
    },
  ],
};

module.exports = sidebars;