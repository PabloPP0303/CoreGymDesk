import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { corsHeaders, getUsuarioFromToken } from '@/app/lib/helpers';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET - mis rutinas con ejercicios
export async function GET(req) {
  try {
    const usuario = await getUsuarioFromToken(req);
    if (!usuario) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(req.url);
    const usuarioId = searchParams.get('usuario_id') || usuario.id;

    const { data, error } = await supabase
      .from('rutinas')
      .select(`
        *,
        rutina_ejercicios (
          *,
          ejercicios (nombre, grupo_muscular, imagen_url)
        )
      `)
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(data, { status: 200, headers: corsHeaders });

  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST - crear rutina con ejercicios
export async function POST(req) {
  try {
    const usuario = await getUsuarioFromToken(req);
    if (!usuario) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { nombre, ejercicios, usuario_id } = await req.json();
    const targetUsuarioId = usuario_id || usuario.id;

    // Crear la rutina
    const { data: rutina, error: rutinaError } = await supabase
      .from('rutinas')
      .insert([{ nombre, usuario_id: targetUsuarioId }])
      .select()
      .single();

    if (rutinaError) {
      return NextResponse.json(
        { error: rutinaError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    // Insertar ejercicios si los hay
    if (ejercicios && ejercicios.length > 0) {
      const ejerciciosConRutina = ejercicios.map(e => ({
        rutina_id: rutina.id,
        ejercicio_id: e.ejercicio_id,
        dia: e.dia,
        series: e.series,
        repeticiones: e.repeticiones,
      }));

      const { error: ejerciciosError } = await supabase
        .from('rutina_ejercicios')
        .insert(ejerciciosConRutina);

      if (ejerciciosError) {
        return NextResponse.json(
          { error: ejerciciosError.message },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    return NextResponse.json(rutina, { status: 201, headers: corsHeaders });

  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE - eliminar rutina
export async function DELETE(req) {
  try {
    const usuario = await getUsuarioFromToken(req);
    if (!usuario) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const { error } = await supabase
      .from('rutinas')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { message: 'Rutina eliminada correctamente' },
      { status: 200, headers: corsHeaders }
    );

  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500, headers: corsHeaders }
    );
  }
}