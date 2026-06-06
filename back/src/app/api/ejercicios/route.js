import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { corsHeaders, getUsuarioFromToken } from '@/app/lib/helpers';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET - listar todos los ejercicios
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('ejercicios')
      .select('*')
      .order('nombre', { ascending: true });

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

// POST - crear ejercicio (solo admin)
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

    const { nombre, descripcion, grupo_muscular, imagen_url } = await req.json();

    const { data, error } = await supabase
      .from('ejercicios')
      .insert([{ nombre, descripcion, grupo_muscular, imagen_url }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Este ejercicio ya existe' },
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

export async function PUT(req) {
  try {
    const usuario = await getUsuarioFromToken(req);
    if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: corsHeaders });

    const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', usuario.id).single();
    if (perfil?.rol !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403, headers: corsHeaders });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    const { data, error } = await supabase.from('ejercicios').update(body).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });

    return NextResponse.json(data, { status: 200, headers: corsHeaders });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}

// DELETE - eliminar ejercicio (solo admin)
export async function DELETE(req) {
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

    const { error } = await supabase
      .from('ejercicios')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { message: 'Ejercicio eliminado correctamente' },
      { status: 200, headers: corsHeaders }
    );

  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500, headers: corsHeaders }
    );
  }
}