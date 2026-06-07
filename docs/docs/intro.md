# Introducción

Bienvenido al manual de mantenimiento de **CoreGymDesk**, una aplicación web y móvil de gestión de gimnasio.

## ¿Qué es CoreGymDesk?

CoreGymDesk es una plataforma completa para la gestión del **Gimnasio Combo** de El Cuervo. Permite a los socios reservar clases, gestionar rutinas y comprar merchandising, mientras que el administrador puede gestionar usuarios, clases, cuotas y pedidos desde un panel dedicado.

## Tecnologías utilizadas

| Capa | Tecnología |
|------|-----------|
| Backend | Next.js + API Routes |
| Base de datos | Supabase (PostgreSQL) |
| Frontend web | Expo (React Native Web) |
| App móvil | Expo (Android APK) |
| Despliegue back | Vercel |
| Despliegue front | Vercel / EAS Build |
| Almacenamiento | Supabase Storage |

## URLs del sistema

- **Aplicación web:** https://core-gym-desk-ddva.vercel.app
- **API Backend:** https://core-gym-desk.vercel.app/api
- **Panel Supabase:** https://supabase.com

## Estructura del repositorio

```
CoreGymDesk/
├── back/       → Next.js backend
├── front/      → Expo frontend
└── docs/       → Este manual
```