import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { corsHeaders, getUsuarioFromToken } from '@/app/lib/helpers';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET - listar todos los usuarios (solo admin)
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

    if (perfil?.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
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

// PUT - editar perfil de usuario
export async function PUT(req) {
  try {
    const usuario = await getUsuarioFromToken(req);
    if (!usuario) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(req.url);
    const usuarioId = searchParams.get('id') || usuario.id;
    const body = await req.json();

    const { data, error } = await supabase
      .from('perfiles')
      .update(body)
      .eq('id', usuarioId)
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

// DELETE - eliminar usuario (solo admin)
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
    const usuarioId = searchParams.get('id');

    const { error } = await supabaseAdmin.auth.admin.deleteUser(usuarioId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { message: 'Usuario eliminado correctamente' },
      { status: 200, headers: corsHeaders }
    );

  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500, headers: corsHeaders }
    );
  }
}