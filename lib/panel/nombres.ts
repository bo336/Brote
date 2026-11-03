/** Cómo se llama cada cosa en el panel (claves de la analítica → castellano). */

export const NOMBRE_SECCION: Record<string, string> = {
  inicio: 'Inicio',
  acciones: 'Acciones',
  mundo: 'Tu mundo',
  academia: 'Academia',
  plaza: 'La Plaza',
  buscar: 'Buscar',
  mercado: 'Mercado',
  ranking: 'Ranking',
  perfil: 'Perfil',
  ajustes: 'Ajustes',
  proyectos: 'Proyectos',
  competencias: 'Competencias',
  notificaciones: 'Notificaciones',
  brote_plus: 'Brote+',
  negocio: 'Espacio de empresa',
  onboarding: 'Onboarding',
};

export const NOMBRE_EVENTO: Record<string, string> = {
  avisos_activados: 'Activó los avisos',
  avisos_rechazados: 'Rechazó los avisos',
  aviso_abierto: 'Abrió un aviso',
  app_instalada: 'Instaló la app',
  onb_fin: 'Terminó el onboarding',
  plus_visto: 'Vio Brote+',
  plus_iniciar: 'Empezó a suscribirse a Brote+',
  compartir: 'Compartió algo',
};

export const NOMBRE_TIPO_CUENTA: Record<string, string> = {
  adult: 'Adultos',
  teen: 'Adolescentes (13–17)',
  kid: 'Chicos (hasta 12)',
  sin_dato: 'Sin dato',
};
export const NOMBRE_PLATAFORMA: Record<string, string> = { telefono: 'Teléfono', tablet: 'Tablet', compu: 'Compu', sin_dato: 'Sin dato' };
export const NOMBRE_SISTEMA: Record<string, string> = {
  android: 'Android',
  ios: 'iPhone / iPad',
  windows: 'Windows',
  mac: 'Mac',
  linux: 'Linux',
  otro: 'Otro',
  sin_dato: 'Sin dato',
};
export const NOMBRE_NAVEGADOR: Record<string, string> = {
  chrome: 'Chrome',
  safari: 'Safari',
  firefox: 'Firefox',
  edge: 'Edge',
  samsung: 'Samsung',
  otro: 'Otro',
  sin_dato: 'Sin dato',
};
export const NOMBRE_AVISO: Record<string, string> = {
  streak_risk: 'Racha en riesgo',
  streak_lost: 'Racha perdida',
  rank_up: 'Subió de rango',
  rango: 'Liga de la semana',
  plaza: 'Novedades de la Plaza',
  reenganche: 'Te extrañamos',
  system: 'Sistema / resumen',
  follow: 'Seguidores',
  reply: 'Respuestas',
  mention: 'Menciones',
  like: 'Reacciones',
  academia_riego: 'Academia',
  challenge: 'Retos',
  project: 'Proyectos',
  admin: 'Para el equipo',
};

export const NOMBRE_TIPO_PASO: Record<string, string> = {
  teoria: 'Teoría',
  ejemplo: 'Ejemplo',
  opcion: 'Opción única',
  multiple: 'Opción múltiple',
  vf: 'Verdadero o falso',
  ordenar: 'Ordenar',
  ranking: 'Ranking',
  cadena: 'Cadena',
  clasificar: 'Clasificar',
  emparejar: 'Emparejar',
  completar: 'Completar',
  numero: 'Cálculo',
  estimar: 'Estimar',
  detectar: 'Detectar',
};
