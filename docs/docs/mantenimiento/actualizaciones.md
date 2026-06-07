# Actualizaciones

## Flujo de trabajo con Git

El proyecto usa dos ramas principales:

| Rama | Uso |
|------|-----|
| `main` | Producción, desplegada en Vercel |
| `develop` | Desarrollo, cambios en progreso |

## Proceso para añadir nuevas funcionalidades

```bash
# 1. Crear rama de feature
git checkout develop
git pull origin develop
git checkout -b feature/nombre-funcionalidad

# 2. Desarrollar y hacer commits
git add .
git commit -m "feat: descripción del cambio"
git push origin feature/nombre-funcionalidad

# 3. Crear Pull Request en GitHub hacia develop
# 4. Revisar y mergear a develop
# 5. Cuando esté listo, mergear develop a main
git checkout main
git merge develop
git push origin main
```

## Actualizar dependencias del backend

```bash
cd back
npm update
npm audit fix
```

## Actualizar dependencias del frontend

```bash
cd front
npx expo install --fix
npm audit fix
```

## Actualizar la app móvil

### Cambios de JavaScript (sin cambios nativos)
```bash
cd front
eas update --branch preview --message "descripción"
```

### Cambios nativos (nueva APK)
```bash
cd front
eas build --platform android --profile preview
```

## Convención de commits

| Prefijo | Uso |
|---------|-----|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de error |
| `style:` | Cambios de estilo/UI |
| `chore:` | Tareas de mantenimiento |
| `docs:` | Documentación |