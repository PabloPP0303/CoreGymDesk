# Despliegue del backend en Vercel

## URL de producción

```
https://core-gym-desk.vercel.app
```

## Pasos para desplegar

1. Entra en https://vercel.com con tu cuenta
2. Pulsa **Add New Project**
3. Selecciona el repositorio `CoreGymDesk` de GitHub
4. En **Root Directory** pon `back`
5. En **Framework Preset** selecciona **Next.js**
6. Añade las variables de entorno (ver abajo)
7. Pulsa **Deploy**

## Variables de entorno en Vercel

Configura estas variables en **Settings → Environment Variables**:

| Variable | Descripción |
|----------|------------|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | Clave de servicio de Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `RESEND_API_KEY` | Clave de Resend para emails |

## Actualizaciones automáticas

Vercel despliega automáticamente cada vez que se hace un push a la rama `main` del repositorio. No es necesario ninguna acción manual.

## Verificar que funciona

Accede a esta URL en el navegador:

```
https://core-gym-desk.vercel.app/api/clases
```

Debe devolver un array JSON con las clases disponibles.