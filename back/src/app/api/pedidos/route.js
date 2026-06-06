import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { corsHeaders, getUsuarioFromToken } from '@/app/lib/helpers';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req) {
  try {
    const usuario = await getUsuarioFromToken(req);
    if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: corsHeaders });

    const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', usuario.id).single();

    let query = supabase.from('pedidos').select('*, productos(*), perfiles(nombre, apellidos)').order('created_at', { ascending: false });

    if (perfil?.rol !== 'admin') {
      query = query.eq('usuario_id', usuario.id);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });

    return NextResponse.json(data, { status: 200, headers: corsHeaders });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req) {
  try {
    const usuario = await getUsuarioFromToken(req);
    if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: corsHeaders });

    const { producto_id, cantidad } = await req.json();

    // Verificar stock
    const { data: producto } = await supabase.from('productos').select('stock, nombre').eq('id', producto_id).single();
    if (!producto || producto.stock <= 0) {
      return NextResponse.json({ error: 'Producto sin stock' }, { status: 400, headers: corsHeaders });
    }

    // Crear pedido
    const { data, error } = await supabase
      .from('pedidos')
      .insert([{ usuario_id: usuario.id, producto_id, cantidad }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });

    // Reducir stock
    await supabase.from('productos').update({ stock: producto.stock - cantidad }).eq('id', producto_id);

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

    const { data, error } = await supabase.from('pedidos').update(body).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });

    return NextResponse.json(data, { status: 200, headers: corsHeaders });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}