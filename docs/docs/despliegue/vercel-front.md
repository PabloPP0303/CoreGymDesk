# Despliegue del frontend en Vercel

## URL de producción

```
https://core-gym-desk-ddva.vercel.app
```

## Pasos para desplegar

1. Entra en https://vercel.com con tu cuenta
2. Pulsa **Add New Project**
3. Selecciona el repositorio `CoreGymDesk` de GitHub
4. En **Root Directory** pon `front`
5. En **Framework Preset** selecciona **Other**
6. Añade las variables de entorno (ver abajo)
7. Pulsa **Deploy**

## Variables de entorno en Vercel

| Variable | Valor |
|----------|-------|
| `EXPO_PUBLIC_API_URL` | `https://core-gym-desk.vercel.app/api` |
| `EXPO_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase |

## Archivo vercel.json

El archivo `front/vercel.json` es necesario para que Vercel compile correctamente la app Expo:

```json
{
  "buildCommand": "npx expo export --platform web",
  "outputDirectory": "dist",
  "framework": null
}
```

## Actualizar la app web

Cada push a `main` despliega automáticamente la nueva versión.

## Actualizar la app móvil

Para actualizaciones menores sin cambios nativos:

```bash
cd front
eas update --branch preview --message "descripción del cambio"
```

Para cambios que requieren nueva compilación:

```bash
eas build --platform android --profile preview
```