import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '@/app/lib/helpers';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req) {
  try {
    const { email, password, nombre, apellidos, telefono, fecha_nacimiento } = await req.json();

    if (!email || !password || !nombre || !apellidos) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verificar mayoría de edad
    if (fecha_nacimiento) {
      const hoy = new Date();
      const nacimiento = new Date(fecha_nacimiento);
      const edad = hoy.getFullYear() - nacimiento.getFullYear();
      if (edad < 18) {
        return NextResponse.json(
          { error: 'Debes tener al menos 18 años para registrarte' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Crear usuario en Supabase Auth
    const { data, error } = await supabasePublic.auth.signUp({ email, password });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      );
    }

    // Actualizar perfil con los datos adicionales
    const { error: perfilError } = await supabase
      .from('perfiles')
      .update({ nombre, apellidos, telefono, fecha_nacimiento })
      .eq('id', data.user.id);

    if (perfilError) {
      return NextResponse.json(
        { error: perfilError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { message: 'Usuario registrado correctamente', user: data.user },
      { status: 201, headers: corsHeaders }
    );

  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500, headers: corsHeaders }
    );
  }
}