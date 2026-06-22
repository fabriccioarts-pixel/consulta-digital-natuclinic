
import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const AMIGO_TOKEN = process.env.AMIGO_TOKEN!;
const AMIGO_BASE = 'https://amigobot-api.amigoapp.com.br';

interface Utm {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
}

function buildObservation(utm: Utm, funnel: string): string {
  const parts = [`Funil: ${funnel}`];
  if (utm.campaign) parts.push(`Campanha: ${utm.campaign}`);
  if (utm.source)   parts.push(`Origem: ${utm.source}`);
  if (utm.medium)   parts.push(`Mídia: ${utm.medium}`);
  if (utm.content)  parts.push(`Conteúdo: ${utm.content}`);
  return parts.join(' | ');
}

function buildUtmTag(utm: Utm): string {
  if (!utm.source && !utm.campaign) return '🔗 _Acesso direto_';
  const parts = [];
  if (utm.source)   parts.push(utm.source);
  if (utm.medium)   parts.push(utm.medium);
  if (utm.campaign) parts.push(utm.campaign);
  return `🎯 ${parts.filter(Boolean).join(' › ')}`;
}

async function upsertPatientInCRM(name: string, phone: string, observation: string) {
  const headers = {
    Authorization: `Bearer ${AMIGO_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const existsRes = await fetch(
    `${AMIGO_BASE}/patients/exists?contact_cellphone=${encodeURIComponent(phone)}`,
    { headers },
  );
  const existsData = await existsRes.json();

  if (existsData.data?.id) {
    // Paciente já existe — atualiza observação
    const patientId = existsData.data.id;
    await fetch(`${AMIGO_BASE}/patients/${patientId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ observations: observation }),
    }).catch(() => {});
    return patientId;
  }

  const createRes = await fetch(`${AMIGO_BASE}/patients`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, contact_cellphone: phone, observations: observation }),
  });
  const createData = await createRes.json();
  return createData.data?.id ?? null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, unit, complaint, details, utm = {} } = body;

    // Input validation
    if (
      typeof name !== 'string' || name.trim().length < 2 || name.length > 100 ||
      typeof phone !== 'string' ||
      typeof complaint !== 'string' || complaint.length > 200 ||
      typeof details !== 'string' || details.length > 2000
    ) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const plainPhone = phone.replace(/\D/g, '');
    if (plainPhone.length < 10 || plainPhone.length > 11) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
    }

    const safeName = name.trim();
    const funnel = complaint.startsWith('[Harmonização]') ? 'Harmonização Facial' : 'Limpeza de Pele';
    const observation = buildObservation(utm, funnel);
    const utmTag = buildUtmTag(utm);

    const [, telegramRes] = await Promise.all([
      upsertPatientInCRM(safeName, plainPhone, observation).catch(() => null),
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: `🆕 *Novo Lead Natuclinic*\n\n👤 *Nome:* ${safeName}\n📍 *Unidade:* ${unit || 'Não informada'}\n🩺 *Queixa:* ${complaint}\n📝 *Detalhes:* ${details}\n${utmTag}\n\n📱 *WhatsApp:* [${phone}](https://wa.me/55${plainPhone})`,
          parse_mode: 'Markdown',
        }),
      }),
    ]);

    const telegramData = await telegramRes.json();

    if (!telegramData.ok) {
      return NextResponse.json({ error: 'Erro ao enviar para Telegram' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
