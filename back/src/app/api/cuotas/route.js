import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { corsHeaders, getUsuarioFromToken } from '@/app/lib/helpers';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET - listar cuotas (admin) o mi cuota (cliente)
export async function GET(req) {
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

    if (perfil?.rol === 'admin') {
      const { data, error } = await supabase
        .from('cuotas')
        .select('*, perfiles(nombre, apellidos, email:id)')
        .order('fecha_vencimiento', { ascending: true });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json(data, { status: 200, headers: corsHeaders });
    }

    // Cliente solo ve su propia cuota
    const { data, error } = await supabase
      .from('cuotas')
      .select('*')
      .eq('usuario_id', usuario.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404, headers: corsHeaders }
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

// POST - crear cuota para un usuario (admin)
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

    const { usuario_id, importe, fecha_pago, fecha_vencimiento } = await req.json();

    const { data, error } = await supabase
      .from('cuotas')
      .upsert([{
        usuario_id,
        importe,
        fecha_pago,
        fecha_vencimiento,
        estado: 'al_dia',
        updated_at: new Date().toISOString(),
      }])
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

// PUT - actualizar estado cuota (admin)
export async function PUT(req) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    const { data, error } = await supabase
      .from('cuotas')
      .update({ ...body, updated_at: new Date().toISOString() })
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