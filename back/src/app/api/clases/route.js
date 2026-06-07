import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { corsHeaders, getUsuarioFromToken } from '@/app/lib/helpers';
 
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
 
// GET - listar todas las clases activas
export async function GET(req) {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
  .from('clases')
  .select('*, reservas(count)')
  .eq('activa', true)
  .eq('reservas.estado', 'confirmada')
  .order('hora_inicio', { ascending: true })
 
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
 
// POST - crear clase (solo admin)
export async function POST(req) {
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
 
    const body = await req.json();
    const { nombre, descripcion, sala, hora_inicio, hora_fin, dias, aforo_maximo } = body;
 
    if (aforo_maximo > 30) {
      return NextResponse.json(
        { error: 'El aforo máximo permitido es 30' },
        { status: 400, headers: corsHeaders }
      );
    }
 
    const { data, error } = await supabase
      .from('clases')
      .insert([{ nombre, descripcion, sala, hora_inicio, hora_fin, dias, aforo_maximo }])
      .select()
      .single();
 
    if (error) {
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

