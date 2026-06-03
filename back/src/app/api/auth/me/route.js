import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { corsHeaders, getUsuarioFromToken } from '@/app/lib/helpers';
 
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
 
export async function GET(req) {
  try {
    const usuario = await getUsuarioFromToken(req);
    if (!usuario) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401, headers: corsHeaders }
      );
    }
 
    const { data: perfil, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', usuario.id)
      .single();
 
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: corsHeaders }
      );
    }
 
    return NextResponse.json(
      { user: usuario, perfil },
      { status: 200, headers: corsHeaders }
    );
 
  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500, headers: corsHeaders }
    );
  }
}