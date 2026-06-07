# Gestión de Supabase

## Acceso al panel

Accede al panel de Supabase en https://supabase.com con las credenciales del proyecto.

## Buckets de almacenamiento

La aplicación usa dos buckets públicos en Supabase Storage:

| Bucket | Uso |
|--------|-----|
| `ejercicios` | Imágenes de los ejercicios |
| `productos` | Imágenes de los productos de merchandising |

:::caution
Ambos buckets deben estar configurados como **públicos** para que las imágenes sean accesibles desde la app.
:::

## Políticas de Storage

Ejecutar en el SQL Editor de Supabase para configurar los permisos:

```sql
create policy "allow uploads ejercicios" on storage.objects
for insert with check (bucket_id = 'ejercicios');

create policy "allow public read ejercicios" on storage.objects
for select using (bucket_id = 'ejercicios');

create policy "allow uploads productos" on storage.objects
for insert with check (bucket_id = 'productos');

create policy "allow public read productos" on storage.objects
for select using (bucket_id = 'productos');
```

## Row Level Security (RLS)

La aplicación **no usa RLS**.

## Gestión de usuarios

Los usuarios se gestionan desde **Authentication → Users** en el panel de Supabase. Desde ahí se pueden:
- Ver todos los usuarios registrados
- Eliminar usuarios
- Verificar correos electrónicos manualmente

## Backups

Para el plan gratuito de Supabase se recomienda exportar los datos periódicamente desde **Database → Backups**.