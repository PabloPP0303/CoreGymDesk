# Instalación del frontend

## Acceder a la carpeta

```bash
cd CoreGymDesk/front
```

## Instalar dependencias

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env.local` en la carpeta `front/` con el siguiente contenido:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
```

Importante
En producción la variable `EXPO_PUBLIC_API_URL` debe apuntar a la URL de Vercel: `https://core-gym-desk.vercel.app/api`


## Arrancar en local

```bash
npx expo start --clear
```

Se abrirá el servidor de Expo. Puedes acceder a la app:
- **Web:** abre `http://localhost:8081`
- **Móvil:** escanea el QR con la app Expo Go

## Generar APK Android

```bash
eas build --platform android --profile preview
```

El APK se generará en los servidores de Expo y estará disponible para descargar en https://expo.dev