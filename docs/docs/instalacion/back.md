# Instalación del backend

## Clonar el repositorio

```bash
git clone https://github.com/PabloPP0303/CoreGymDesk.git
cd CoreGymDesk/back
```

## Instalar dependencias

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env.local` en la carpeta `back/` con el siguiente contenido:

```env
SUPABASE_URL=https://TU_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=TU_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
RESEND_API_KEY=TU_RESEND_API_KEY
```

Las claves de Supabase se encuentran en **Project Settings → API** dentro del panel de Supabase.

## Arrancar en local

```bash
npm run dev
```

El backend estará disponible en `http://localhost:3000`

## Endpoints disponibles

| Endpoint | Descripción |
|----------|------------|
| `/api/auth/register` | Registro de usuarios |
| `/api/auth/login` | Inicio de sesión |
| `/api/auth/me` | Datos del usuario actual |
| `/api/clases` | Gestión de clases |
| `/api/reservas` | Gestión de reservas |
| `/api/rutinas` | Gestión de rutinas |
| `/api/ejercicios` | Gestión de ejercicios |
| `/api/productos` | Gestión de productos |
| `/api/pedidos` | Gestión de pedidos |
| `/api/cuotas` | Gestión de cuotas |
| `/api/progreso` | Progreso físico |
| `/api/usuarios` | Gestión de usuarios |