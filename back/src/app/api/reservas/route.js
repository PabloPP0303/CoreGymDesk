import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { corsHeaders, getUsuarioFromToken } from '@/app/lib/helpers';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET - mis reservas
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
      .from('reservas')
      .select('*, clases(*)')
      .eq('usuario_id', usuarioId)
      .eq('estado', 'confirmada')
      .gte('fecha', new Date().toISOString().split('T')[0])
      .order('fecha', { ascending: true });

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

// POST - reservar clase
export async function POST(req) {
  try {
    const usuario = await getUsuarioFromToken(req);
    if (!usuario) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { clase_id, fecha, usuario_id } = await req.json();
    const targetUsuarioId = usuario_id || usuario.id;
    const fechaReserva = fecha || new Date().toISOString().split('T')[0];

    // Verificar que la clase existe
    const { data: clase, error: claseError } = await supabase
      .from('clases')
      .select('*')
      .eq('id', clase_id)
      .single();

    if (claseError || !clase) {
      return NextResponse.json(
        { error: 'Clase no encontrada' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verificar aforo
    const { count } = await supabase
      .from('reservas')
      .select('*', { count: 'exact', head: true })
      .eq('clase_id', clase_id)
      .eq('fecha', fechaReserva)
      .eq('estado', 'confirmada');

    if (count >= clase.aforo_maximo) {
      return NextResponse.json(
        { error: 'Aforo completo' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Intentar insertar (unique constraint evita duplicados)
    const { data, error } = await supabase
      .from('reservas')
      .insert([{ usuario_id: targetUsuarioId, clase_id, fecha: fechaReserva }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya tienes una reserva para esta clase en esta fecha' },
          { status: 400, headers: corsHeaders }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(data, { status: 201, headers: corsHeaders });

  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE - cancelar reserva
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
    const reservaId = searchParams.get('id');

    const { error } = await supabase
      .from('reservas')
      .update({ estado: 'cancelada' })
      .eq('id', reservaId)
      .eq('usuario_id', usuario.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { message: 'Reserva cancelada correctamente' },
      { status: 200, headers: corsHeaders }
    );

  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500, headers: corsHeaders }
    );
  }
}