
import { NextResponse } from 'next/server'

const AMIGO_TOKEN = process.env.AMIGO_TOKEN!
const AMIGO_BASE = 'https://amigobot-api.amigoapp.com.br'
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!
const EVENT_ID = 176910
const PLACE_ID = 32337
const USER_ID = 102962

// Slot ID format from the Amigo API: placeId-eventId-userId-YYYY-MM-DD-unixTimestamp
const SLOT_ID_REGEX = /^\d+-\d+-\d+-\d{4}-\d{2}-\d{2}-\d+$/

const amigoHeaders = {
  Authorization: `Bearer ${AMIGO_TOKEN}`,
  'Content-Type': 'application/json',
}

export async function GET() {
  try {
    const res = await fetch(`${AMIGO_BASE}/calendar?event_id=${EVENT_ID}&place_id=${PLACE_ID}`, {
      headers: amigoHeaders,
    })
    const data = await res.json()

    const availableDates = (data.data || [])
      .filter((d: any) => d.status === 'AVAILABLE')
      .map((d: any) => {
        const slots = (d.slotsByUser?.[0]?.slots || []).map((s: any) => ({
          id: s.id,
          start: s.start,
          end: s.end,
          timegrid_id: s.timegrid_id,
        }))
        return { date: d.date, slots }
      })
      .filter((d: any) => d.slots.length > 0)

    return NextResponse.json({ dates: availableDates })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar horários' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, unit, slotId, timegridId } = body

    // Input validation
    if (
      typeof name !== 'string' || name.trim().length < 2 || name.length > 100 ||
      typeof phone !== 'string' ||
      typeof slotId !== 'string' || !SLOT_ID_REGEX.test(slotId) ||
      typeof timegridId !== 'number'
    ) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const plainPhone = phone.replace(/\D/g, '')
    if (plainPhone.length < 10 || plainPhone.length > 11) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
    }

    const safeName = name.trim()

    // Parse start_date from slot ID
    const parts = slotId.split('-')
    const timestamp = parseInt(parts[parts.length - 1])
    if (isNaN(timestamp) || timestamp < Date.now() / 1000) {
      return NextResponse.json({ error: 'Horário inválido ou expirado' }, { status: 400 })
    }

    const startDate = new Date(timestamp * 1000).toISOString()
    const endDate = new Date(timestamp * 1000 + 80 * 60 * 1000).toISOString()

    // Check if patient exists
    let patientId: number | null = null
    const existsRes = await fetch(
      `${AMIGO_BASE}/patients/exists?contact_cellphone=${encodeURIComponent(plainPhone)}`,
      { headers: amigoHeaders },
    )
    const existsData = await existsRes.json()

    if (existsData.data?.id) {
      patientId = existsData.data.id
    } else {
      const createRes = await fetch(`${AMIGO_BASE}/patients`, {
        method: 'POST',
        headers: amigoHeaders,
        body: JSON.stringify({ name: safeName, contact_cellphone: plainPhone }),
      })
      const createData = await createRes.json()
      patientId = createData.data?.id
    }

    if (!patientId) {
      return NextResponse.json({ error: 'Erro ao criar paciente' }, { status: 500 })
    }

    // Create attendance
    const attPayload = {
      event_id: EVENT_ID,
      place_id: PLACE_ID,
      user_id: USER_ID,
      patient_id: patientId,
      timegrid_id: timegridId,
      start_date: startDate,
      end_date: endDate,
    }
    console.log('[schedule] criando attendance:', JSON.stringify(attPayload))

    const attRes = await fetch(`${AMIGO_BASE}/attendances`, {
      method: 'POST',
      headers: amigoHeaders,
      body: JSON.stringify(attPayload),
    })
    const attData = await attRes.json()
    console.log('[schedule] resposta attendance:', JSON.stringify(attData))

    if (attData.status !== 'success') {
      return NextResponse.json(
        { error: attData.message || 'Erro ao agendar', debug: attData },
        { status: 500 },
      )
    }

    // Notify Telegram
    const dateObj = new Date(timestamp * 1000)
    const dateStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'America/Sao_Paulo' })
    const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
    const waLink = `https://wa.me/55${plainPhone}`

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: `✅ *Agendamento Confirmado!*\n\n👤 *Nome:* ${safeName}\n📱 *WhatsApp:* [${phone}](${waLink})\n📍 *Unidade:* ${unit || 'Não informada'}\n🗓️ *Data:* ${dateStr}\n🕐 *Horário:* ${timeStr}\n💆 *Serviço:* Limpeza de Pele`,
        parse_mode: 'Markdown',
      }),
    })

    return NextResponse.json({ success: true, attendance: attData.data })
  } catch (err) {
    console.error('[schedule] erro interno:', err)
    return NextResponse.json({ error: 'Erro interno', detail: String(err) }, { status: 500 })
  }
}
