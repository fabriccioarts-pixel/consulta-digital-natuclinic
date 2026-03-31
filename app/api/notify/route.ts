
import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = '8740764298:AAFwVjTTicpv53Ec5XWWVSW71m0quvgkI18'; 
const TELEGRAM_CHAT_ID = '6034449977'; 

export async function POST(request: Request) {
  try {
    const { name, phone, complaint, details } = await request.json();
    
    // Format phone to just numbers for URL 
    const plainPhone = phone.replace(/\D/g, "");
    const waLink = `https://wa.me/55${plainPhone}`;

    const text = `
🆕 *Novo Lead Natuclinic*

👤 *Nome:* ${name}
🩺 *Queixa:* ${complaint}
📝 *Detalhes:* ${details}

📱 *WhatsApp:* [${phone}](${waLink})
    `;

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json({ error: 'Erro ao enviar para Telegram' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
