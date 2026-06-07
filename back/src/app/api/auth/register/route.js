import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '@/app/lib/helpers';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);


export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log('Datos recibidos:', body);
    const { email, password, nombre, apellidos, telefono, fecha_nacimiento } = body;

    if (!email || !password || !nombre || !apellidos) {
      console.log('Falta campo obligatorio');
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verificar mayoría de edad
    if (fecha_nacimiento) {
      const hoy = new Date();
      const nacimiento = new Date(fecha_nacimiento);
      const edad = hoy.getFullYear() - nacimiento.getFullYear();
      console.log('Edad calculada:', edad);
      if (edad < 18) {
        return NextResponse.json(
          { error: 'Debes tener al menos 18 años para registrarte' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    console.log('createUser resultado:', data, error);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      );
    }

    // Actualizar perfil con los datos adicionales
    const { error: perfilError } = await supabase
      .from('perfiles')
      .update({ nombre, apellidos, telefono, fecha_nacimiento })
      .eq('id', data.user.id);

    if (perfilError) {
      return NextResponse.json(
        { error: perfilError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    // Enviar email de bienvenida
    await resend.emails.send({
      from: 'CoreGymDesk <onboarding@resend.dev>',
      to: email,
      subject: '¡Bienvenido a CoreGymDesk!',
      html: `
    <h1>¡Hola ${nombre}!</h1>
    <p>Tu cuenta en CoreGymDesk ha sido creada correctamente.</p>
    <p>Ya puedes acceder a la app y empezar a reservar clases.</p>
    <br/>
    <p>Gimnasio Combo - El Cuervo</p>
  `,
    });

    return NextResponse.json(
      { message: 'Usuario registrado correctamente', user: data.user },
      { status: 201, headers: corsHeaders }
    );

  } catch (e) {
    console.error('Error en registro:', e.message, e.stack);
    return NextResponse.json(
      { error: e.message },
      { status: 500, headers: corsHeaders }
    );
  }
}