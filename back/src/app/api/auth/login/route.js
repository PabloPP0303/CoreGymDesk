import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '@/app/lib/helpers';
 
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
 
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
 
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
 
export async function POST(req) {
  try {
    const { email, password } = await req.json();
 
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
 
    if (error) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401, headers: corsHeaders }
      );
    }
 
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
 
    return NextResponse.json(
      { user: data.user, session: data.session, perfil },
      { status: 200, headers: corsHeaders }
    );
 
  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500, headers: corsHeaders }
    );
  }
}