# Esquema de base de datos

CoreGymDesk utiliza **Supabase** como base de datos, que internamente usa **PostgreSQL**.

## Tablas

### perfiles
Extiende la tabla de usuarios de Supabase Auth con datos adicionales del socio.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | Referencia al usuario de Auth |
| nombre | text | Nombre del socio |
| apellidos | text | Apellidos del socio |
| telefono | text | Teléfono de contacto |
| fecha_nacimiento | date | Fecha de nacimiento |
| sexo | text | hombre / mujer / otro |
| peso | numeric | Peso en kg |
| altura | numeric | Altura en cm |
| rol | text | cliente / admin |

### clases
Clases disponibles en el gimnasio.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | serial PK | Identificador |
| nombre | text | Nombre de la clase |
| sala | text | Sala donde se imparte |
| hora_inicio | time | Hora de inicio |
| hora_fin | time | Hora de fin |
| dias | text[] | Días de la semana |
| aforo_maximo | int | Máximo 30 plazas |
| activa | boolean | Si la clase está activa |

### reservas
Reservas de clases por usuario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | serial PK | Identificador |
| usuario_id | uuid FK | Referencia a perfiles |
| clase_id | int FK | Referencia a clases |
| fecha | date | Fecha de la reserva |
| estado | text | confirmada / cancelada |

### rutinas
Rutinas de entrenamiento de cada usuario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | serial PK | Identificador |
| usuario_id | uuid FK | Referencia a perfiles |
| nombre | text | Nombre de la rutina |

### ejercicios
Banco de ejercicios disponibles.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | serial PK | Identificador |
| nombre | text | Nombre del ejercicio |
| descripcion | text | Descripción |
| grupo_muscular | text | Grupo muscular |
| imagen_url | text | URL de la imagen |

### rutina_ejercicios
Relación entre rutinas y ejercicios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | serial PK | Identificador |
| rutina_id | int FK | Referencia a rutinas |
| ejercicio_id | int FK | Referencia a ejercicios |
| dia | text | Día de la semana |
| series | int | Número de series |
| repeticiones | int | Número de repeticiones |

### productos
Productos del merchandising.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | serial PK | Identificador |
| nombre | text | Nombre del producto |
| categoria | text | Ropa / Accesorios / Nutrición |
| precio | numeric | Precio en euros |
| stock | int | Unidades disponibles |
| imagen_url | text | URL de la imagen |

### pedidos
Pedidos de merchandising.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | serial PK | Identificador |
| usuario_id | uuid FK | Referencia a perfiles |
| producto_id | int FK | Referencia a productos |
| cantidad | int | Unidades pedidas |
| estado | text | pendiente / completado / cancelado |

### cuotas
Cuotas mensuales de los socios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | serial PK | Identificador |
| usuario_id | uuid FK | Referencia a perfiles |
| importe | numeric | Importe en euros |
| fecha_pago | date | Fecha del último pago |
| fecha_vencimiento | date | Fecha de vencimiento |
| estado | text | al_dia / vencida / pendiente |

### progreso
Registros de progreso físico.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | serial PK | Identificador |
| usuario_id | uuid FK | Referencia a perfiles |
| fecha | date | Fecha del registro |
| peso | numeric | Peso en kg |
| altura | numeric | Altura en cm |
| ejercicio_id | int FK | Ejercicio levantado |
| peso_levantado | numeric | Peso levantado en kg |
| repeticiones | int | Repeticiones realizadas |

## Trigger automático

Al registrarse un usuario en Supabase Auth se crea automáticamente su perfil en la tabla `perfiles` mediante un trigger:

```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into perfiles (id, nombre, apellidos)
  values (new.id, 'Sin nombre', 'Sin apellidos');
  return new;
end;
$$ language plpgsql security definer;
```