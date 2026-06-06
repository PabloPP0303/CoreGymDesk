import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { corsHeaders, getUsuarioFromToken } from '@/app/lib/helpers';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET - detalle de una clase con conteo de reservas
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const { data: clase, error } = await supabase
      .from('clases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Clase no encontrada' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Contar reservas activas de hoy
    const hoy = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('reservas')
      .select('*', { count: 'exact', head: true })
      .eq('clase_id', id)
      .eq('fecha', hoy)
      .eq('estado', 'confirmada');

    return NextResponse.json(
      { ...clase, plazas_ocupadas: count || 0 },
      { status: 200, headers: corsHeaders }
    );

  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT - editar clase (solo admin)
export async function PUT(req, { params }) {
  try {
    const usuario = await getUsuarioFromToken(req);
    if (!usuario) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', usuario.id)
      .single();

    if (perfil?.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { id } = await params;
    const body = await req.json();

    if (body.aforo_maximo > 30) {
      return NextResponse.json(
        { error: 'El aforo máximo permitido es 30' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data, error } = await supabase
      .from('clases')
      .update(body)
      .eq('id', id)
      .select()
      .single();

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

// DELETE - eliminar clase (solo admin)
export async function DELETE(req, { params }) {
  try {
    const usuario = await getUsuarioFromToken(req);
    if (!usuario) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', usuario.id)
      .single();

    if (perfil?.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { id } = await params;

    const { error } = await supabase
      .from('clases')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { message: 'Clase eliminada correctamente' },
      { status: 200, headers: corsHeaders }
    );

  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500, headers: corsHeaders }
    );
  }
}