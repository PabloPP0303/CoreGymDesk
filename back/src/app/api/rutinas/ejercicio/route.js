import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { corsHeaders, getUsuarioFromToken } from '@/app/lib/helpers';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req) {
  try {
    const usuario = await getUsuarioFromToken(req);
    if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: corsHeaders });

    const { rutina_id, ejercicio_id, dia, series, repeticiones } = await req.json();

    const { data, error } = await supabase
      .from('rutina_ejercicios')
      .insert([{ rutina_id, ejercicio_id, dia, series, repeticiones }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });

    return NextResponse.json(data, { status: 201, headers: corsHeaders });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(req) {
  try {
    const usuario = await getUsuarioFromToken(req);
    if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: corsHeaders });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    const { data, error } = await supabase
      .from('rutina_ejercicios')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });

    return NextResponse.json(data, { status: 200, headers: corsHeaders });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(req) {
  try {
    const usuario = await getUsuarioFromToken(req);
    if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: corsHeaders });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const { error } = await supabase.from('rutina_ejercicios').delete().eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });

    return NextResponse.json({ message: 'Ejercicio eliminado' }, { status: 200, headers: corsHeaders });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}