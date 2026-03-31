
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend('re_625wNUyt_NoaceuVJt7kgaJwtSewNESzt');

export async function POST(request: Request) {
  try {
    const { name, phone, complaint, details } = await request.json();

    const { data, error } = await resend.emails.send({
      from: 'Natuclinic Leads <onboarding@resend.dev>',
      to: ['markertingantuclininc@gmail.com'], // E-mail configurado conforme solicitado
      subject: `Novo Lead Natuclinic: ${name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #4A3328;">
          <h2 style="border-bottom: 2px solid #4A3328; padding-bottom: 10px;">Novo Lead Capturado - Natuclinic</h2>
          <p><strong>Nome:</strong> ${name}</p>
          <p><strong>WhatsApp:</strong> ${phone}</p>
          <p><strong>Queixa Principal:</strong> ${complaint}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Anotações e Detalhes:</strong></p>
          <div style="background: #f4ebe6; padding: 15px; border-radius: 8px;">
            ${details}
          </div>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
