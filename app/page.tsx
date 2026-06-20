"use client"

import { useState, useEffect, useRef } from "react"
import { track, trackCustom } from "@/lib/pixel"
import { Phone, Video, CheckCheck, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ChatMessage {
  id: string
  type: "doctor" | "user" | "list-card" | "video" | "photo-gallery"
  content: string
  items?: string[]
  videoSrc?: string
  images?: string[]
  audioUrl?: string
  timestamp: Date
}

function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

type Complaint = "oleosa" | "manchas" | "acne" | "opaca" | "outro"

interface AvailableSlot {
  id: string
  start: string
  end: string
  timegrid_id: number
}
interface AvailableDate {
  date: string
  slots: AvailableSlot[]
}

interface ServiceInfo {
  title: string
  description: string
  longDescription: string
}

const complaints: { id: Complaint; label: string; icon: string }[] = [
  { id: "oleosa", label: "Pele oleosa e poros dilatados", icon: "🫧" },
  { id: "manchas", label: "Manchas e hiperpigmentação", icon: "✨" },
  { id: "acne", label: "Acne e cravos", icon: "🔍" },
  { id: "opaca", label: "Pele sem viço / Opaca", icon: "🌟" },
  { id: "outro", label: "Outros problemas de pele", icon: "💆" },
]

const services: Record<Complaint, ServiceInfo> = {
  oleosa: {
    title: "Limpeza de Pele Profunda",
    description: "Controle da oleosidade e desobstrução dos poros",
    longDescription: "Protocolo personalizado para pele oleosa com limpeza profunda, extração segura e ativos que equilibram a produção de sebo — deixando a pele limpa, opaca e renovada.",
  },
  manchas: {
    title: "Limpeza + Despigmentação",
    description: "Clareia e uniformiza o tom da pele",
    longDescription: "Combinação de limpeza profunda com ativos despigmentantes para reduzir manchas e hiperpigmentação, devolvendo luminosidade e uniformidade ao rosto.",
  },
  acne: {
    title: "Protocolo Anti-Acne",
    description: "Controle da acne com cuidado e segurança",
    longDescription: "Limpeza profunda aliada a ativos antibacterianos e anti-inflamatórios para controlar a acne ativa, prevenir novas lesões e recuperar a saúde da pele.",
  },
  opaca: {
    title: "Limpeza Revitalizante",
    description: "Devolva o viço e a luminosidade à sua pele",
    longDescription: "Protocolo de limpeza com hidratação profunda e estímulo celular — ideal para peles sem brilho, cansadas ou estressadas, promovendo renovação e luminosidade visível.",
  },
  outro: {
    title: "Avaliação de Pele Personalizada",
    description: "Diagnóstico completo para encontrar o melhor tratamento",
    longDescription: "Análise personalizada da sua pele para identificar as melhores soluções e protocolar o tratamento ideal para o seu tipo e necessidade específica.",
  },
}

export default function NatuclinicFunnel() {
  const [chatPhase, setChatPhase] = useState<
    | "welcome"
    | "intro"
    | "intro-cta"
    | "pre-qualify"
    | "pre-qualify-list"
    | "video-ended"
    | "pre-qualify-cta"
    | "name-question"
    | "name-input"
    | "phone-question"
    | "phone-input"
    | "qualifying-location"
    | "qualifying-availability"
    | "disqualified"
    | "complaint-question"
    | "complaint-selection"
    | "detail-question"
    | "detail-form"
    | "analyzing"
    | "service"
    | "scheduling"
    | "picking-date"
    | "picking-time"
    | "booking"
    | "booked"
    | "whatsapp"
  >("welcome")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [userName, setUserName] = useState("")
  const [userPhone, setUserPhone] = useState("")
  const [userUnit, setUserUnit] = useState("")
  const [audioProgress, setAudioProgress] = useState(0)
  const [currentPlayingUrl, setCurrentPlayingUrl] = useState<string | null>(null)

  const [previousProcedure, setPreviousProcedure] = useState("")
  const [skinConcern, setSkinConcern] = useState("")
  const [skinCareRoutine, setSkinCareRoutine] = useState("")
  const [generalDetails, setGeneralDetails] = useState("")

  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([])
  const [selectedDateData, setSelectedDateData] = useState<AvailableDate | null>(null)
  const [bookedInfo, setBookedInfo] = useState<{ date: string; start: string } | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const pencilSoundRef = useRef<HTMLAudioElement | null>(null)
  const receivesfxRef = useRef<HTMLAudioElement | null>(null)
  const sendSfxRef = useRef<HTMLAudioElement | null>(null)
  const audioQueueRef = useRef<{ url: string; onEnd?: () => void }[]>([])
  const audioUnlockedRef = useRef(false)
  const userHasInteracted = useRef(false)

  useEffect(() => {
    if (userHasInteracted.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, isTyping, chatPhase])

  useEffect(() => {
    playBackgroundMusic()
    setChatPhase("intro")

    addDoctorMessage("✨ Bem-vinda à Natuclinic", undefined, 400)

    setTimeout(() => {
      addDoctorMessage(
        "Na Natuclinic, criamos uma experiência de estética voltada para mulheres que valorizam **cuidado premium, conforto e resultados superiores**.",
        undefined, 800,
      )
    }, 1500)

    setTimeout(() => {
      addDoctorMessage("Não somos uma clínica popular.", undefined, 600)
    }, 3200)

    setTimeout(() => {
      addDoctorMessage("Nosso atendimento é pensado para quem busca **qualidade acima da média**.", undefined, 700)
    }, 4800)

    setTimeout(() => {
      setChatPhase("intro-cta")
    }, 6500)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleIntroCta = () => {
    unlockAudio()
    trackCustom("FunnelStart")
    addUserMessage("Quero entender como funciona")
    setChatPhase("pre-qualify")

    setTimeout(() => {
      addDoctorMessage(
        "Antes de te mostrar os detalhes, preciso entender se a **Natuclinic é realmente o que você procura**.",
        undefined, 800,
      )
    }, 800)

    setTimeout(() => {
      addDoctorMessage("Esse atendimento costuma atrair mulheres que valorizam:", undefined, 600)
      setTimeout(() => {
        addListCard(["exclusividade", "experiência diferenciada", "protocolos personalizados", "ambiente sofisticado"])
        setTimeout(() => addVideoMessage("/ambiente.mp4"), 400)
      }, 1500)
    }, 3500)

  }

  const handleVideoContinue = () => {
    addUserMessage("Continuar")
    setChatPhase("pre-qualify")

    setTimeout(() => {
      addDoctorMessage(
        "Nosso espaço foi projetado para proporcionar uma experiência estética premium, com **conforto, tranquilidade e atenção aos detalhes**.",
        undefined, 800,
      )
    }, 800)

    setTimeout(() => {
      addDoctorMessage("☕ cappuccino gourmet\n🌿 ambiente relaxante\n✨ protocolo avançado de cuidados com a pele", undefined, 600)
    }, 3800)

    setTimeout(() => {
      addDoctorMessage("Tudo pensado para transformar esse momento em uma **experiência única de autocuidado**.", undefined, 700)
    }, 6800)

    setTimeout(() => {
      addPhotoGallery([
        "/fotos-clinica/unnamed.webp",
        "/fotos-clinica/unnamed 1.webp",
        "/fotos-clinica/unnamed (1).webp",
        "/fotos-clinica/unnamed (2).webp",
        "/fotos-clinica/unnamed (3).webp",
        "/fotos-clinica/unnamed (4).webp",
        "/fotos-clinica/unnamed (5).webp",
      ])
    }, 9300)

    setTimeout(() => {
      addDoctorMessage(
        "✨ Nossa Limpeza de Pele ✨\n\nUm protocolo completo para limpar, renovar e cuidar profundamente da sua pele 💆🏻‍♀️\n\n✔️ Higienização da pele\n✔️ Esfoliação\n✔️ Peeling de Diamante\n✔️ Emoliência\n✔️ Vapor de ozônio\n✔️ Extração de cravos e impurezas\n✔️ Placa ultrassônica\n✔️ Aplicação de tônicos\n✔️ Alta frequência\n✔️ Água termal\n✔️ Hidratação\n✔️ Spa labial\n✔️ Finalização com protetor solar ☀️",
        undefined, 900,
      )
    }, 11300)

    setTimeout(() => {
      addDoctorMessage(
        "Uma experiência relaxante com cuidados que deixam sua pele mais saudável, iluminada e renovada ✨\n\n💰 Investimento: **R$179,90**\n💳 PIX ou cartão",
        undefined, 700,
      )
    }, 14800)

    setTimeout(() => {
      addDoctorMessage("Se esse é o seu perfil, **vamos continuar**.", undefined, 500)
      setTimeout(() => setChatPhase("pre-qualify-cta"), 1500)
    }, 17800)
  }

  const handlePreQualifyCta = () => {
    unlockAudio()
    addUserMessage("Continuar")
    setChatPhase("name-question")

    setTimeout(() => {
      addDoctorMessage("Ótimo! Vamos começar sua avaliação personalizada.")
      setTimeout(() => {
        addDoctorMessage("Antes de tudo, como você gostaria de ser chamada?")
        setTimeout(() => setChatPhase("name-input"), 1500)
      }, 2000)
    }, 800)
  }

  const startAudio = (url: string, onEnd?: () => void) => {
    setIsPlayingAudio(true)
    setCurrentPlayingUrl(url)
    setAudioProgress(0)

    if (backgroundMusicRef.current && !backgroundMusicRef.current.paused) {
      backgroundMusicRef.current.pause()
    }

    let audio = audioRef.current
    if (!audio) {
      audio = new Audio()
      audioRef.current = audio
    }

    const handleTimeUpdate = () => {
      if (audio && audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100)
      }
    }

    const handleEnd = () => {
      audio!.removeEventListener("ended", handleEnd)
      audio!.removeEventListener("error", handleError)
      audio!.removeEventListener("timeupdate", handleTimeUpdate)
      setAudioProgress(0)
      setCurrentPlayingUrl(null)
      if (onEnd) onEnd()

      if (audioQueueRef.current.length > 0) {
        setTimeout(() => {
          if (audioQueueRef.current.length > 0) {
            const next = audioQueueRef.current.shift()!
            startAudio(next.url, next.onEnd)
          }
        }, 100)
      } else {
        setIsPlayingAudio(false)
        if (backgroundMusicRef.current && backgroundMusicRef.current.paused) {
          backgroundMusicRef.current.play().catch(() => {})
        }
      }
    }

    const handleError = (err: any) => {
      console.warn("[Natuclinic] Audio error:", url, err)
      handleEnd()
    }

    audio.src = url
    audio.addEventListener("ended", handleEnd)
    audio.addEventListener("error", handleError)
    audio.addEventListener("timeupdate", handleTimeUpdate)

    audio.play().catch((err) => {
      console.warn("[Natuclinic] Play failed:", url, err)
      handleEnd()
    })
  }

  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    audioQueueRef.current = []
    setIsPlayingAudio(false)
    setCurrentPlayingUrl(null)
    setAudioProgress(0)
  }

  const playAudio = (url: string, onEnd?: () => void, immediate = false) => {
    if (immediate) {
      stopAllAudio()
      startAudio(url, onEnd)
      return
    }

    if (isPlayingAudio) {
      audioQueueRef.current.push({ url, onEnd })
    } else {
      startAudio(url, onEnd)
    }
  }

  const playBackgroundMusic = () => {
    if (!backgroundMusicRef.current) {
      backgroundMusicRef.current = new Audio("/background-music.mp3")
      backgroundMusicRef.current.loop = true
      backgroundMusicRef.current.volume = 0.15
    }
    backgroundMusicRef.current.play().catch(() => {})
  }

  const playPencilSound = () => {
    if (!pencilSoundRef.current) {
      pencilSoundRef.current = new Audio("/pencil-writing.mp3")
      pencilSoundRef.current.volume = 0.3
    }
    pencilSoundRef.current.play().catch(() => {})
  }

  const unlockAudio = () => {
    if (audioUnlockedRef.current) return
    audioUnlockedRef.current = true

    if (!receivesfxRef.current) {
      receivesfxRef.current = new Audio(encodeURI("/receive notification.mp3"))
      receivesfxRef.current.volume = 0.4
    }
    if (!sendSfxRef.current) {
      sendSfxRef.current = new Audio(encodeURI("/send notification.mp3"))
      sendSfxRef.current.volume = 0.4
    }
    // Unlock audio context with silent play
    const unlock = new Audio()
    unlock.play().catch(() => {})
  }

  const playReceiveSound = () => {
    if (!audioUnlockedRef.current) return
    const sfx = new Audio(encodeURI("/receive notification.mp3"))
    sfx.volume = 0.4
    sfx.play().catch(() => {})
  }

  const playSendSound = () => {
    if (!audioUnlockedRef.current) return
    const sfx = new Audio(encodeURI("/send notification.mp3"))
    sfx.volume = 0.4
    sfx.play().catch(() => {})
  }

  const addDoctorMessage = (content: string, audioUrl?: string, delay = 1000) => {
    setTimeout(() => {
      setIsTyping(true)

      setTimeout(() => {
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          type: "doctor",
          content,
          audioUrl,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, newMessage])
        playReceiveSound()
        setIsTyping(false)

        if (audioUrl) {
          playAudio(audioUrl)
        }
      }, delay)
    }, 300)
  }

  const addUserMessage = (content: string) => {
    userHasInteracted.current = true
    playPencilSound()
    playSendSound()

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const addListCard = (items: string[]) => {
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      type: "list-card",
      content: "",
      items,
      timestamp: new Date(),
    }])
  }

  const addVideoMessage = (src: string) => {
    setMessages((prev) => [...prev, {
      id: (Date.now() + 1).toString(),
      type: "video",
      content: "",
      videoSrc: src,
      timestamp: new Date(),
    }])
  }

  const addPhotoGallery = (images: string[]) => {
    setMessages((prev) => [...prev, {
      id: (Date.now() + 2).toString(),
      type: "photo-gallery",
      content: "",
      images,
      timestamp: new Date(),
    }])
  }

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    trackCustom("NameSubmitted")
    if (!userName.trim() || isPlayingAudio) return

    addUserMessage(userName)
    setChatPhase("phone-question")

    setTimeout(() => {
      addDoctorMessage(`Muito prazer, ${userName}!`)
      setTimeout(() => {
        addDoctorMessage("Agora me conta, qual o seu melhor WhatsApp para eu te enviar os detalhes do seu plano?")
        setTimeout(() => {
          setChatPhase("phone-input")
        }, 1500)
      }, 1500)
    }, 1000)
  }

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    track("Lead", { content_name: "Natuclinic Limpeza de Pele" })
    if (userPhone.replace(/\D/g, "").length < 10 || isPlayingAudio) return

    addUserMessage(userPhone)

    setTimeout(() => {
      addDoctorMessage("Obrigada! Já salvei aqui.")

      setTimeout(() => {
        addDoctorMessage(
          "Antes de continuar, você é do Distrito Federal ou região?",
        )
        setTimeout(() => {
          setChatPhase("qualifying-location")
        }, 2000)
      }, 2000)
    }, 1000)
  }

  const handleLocationAnswer = (unit: string | null) => {
    if (isPlayingAudio) return

    if (!unit) {
      addUserMessage("Não sou da região")
      setChatPhase("disqualified")
      setTimeout(() => {
        addDoctorMessage(
          "Entendo! No momento atendemos presencialmente no Distrito Federal — Taguatinga e Planaltina.",
        )
        setTimeout(() => {
          addDoctorMessage(
            "Mas fico muito feliz com o seu interesse! Quando vier à nossa região, ficaremos felizes em te receber. Até breve! 💕",
          )
        }, 2500)
      }, 1000)
      return
    }

    setUserUnit(unit)
    addUserMessage(unit)

    setTimeout(() => {
      addDoctorMessage("Que ótimo! Você tem disponibilidade para realizar o procedimento nos próximos 15 dias?")
      setTimeout(() => {
        setChatPhase("qualifying-availability")
      }, 2000)
    }, 1000)
  }

  const handleAvailabilityAnswer = (isAvailable: boolean) => {
    if (isPlayingAudio) return

    if (!isAvailable) {
      addUserMessage("Não tenho disponibilidade agora")
      setChatPhase("disqualified")
      setTimeout(() => {
        addDoctorMessage(
          "Sem problema! Entendo que a agenda pode estar corrida. Por ora, não consigo garantir uma vaga especial para você.",
        )
        setTimeout(() => {
          addDoctorMessage(
            "Quando sentir que é o momento certo, pode retornar por aqui ou entrar em contato pelo nosso WhatsApp. Cuide-se! 🌸",
          )
        }, 2500)
      }, 1000)
      return
    }

    addUserMessage("Sim, tenho disponibilidade nos próximos 15 dias")
    setChatPhase("complaint-question")

    setTimeout(() => {
      addDoctorMessage("Perfeito! Então vamos montar o seu plano de cuidados.")
      setTimeout(() => {
        addDoctorMessage(
          "O que você sente que precisa de mais atenção na sua pele agora?",
          "/oque-mais-incomoda.mp3",
          2000,
        )
        setTimeout(() => {
          setChatPhase("complaint-selection")
        }, 3000)
      }, 2000)
    }, 1000)
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 11) {
      let masked = numbers
      if (numbers.length > 0) masked = "(" + numbers
      if (numbers.length > 2) masked = "(" + numbers.substring(0, 2) + ") " + numbers.substring(2)
      if (numbers.length > 7)
        masked = "(" + numbers.substring(0, 2) + ") " + numbers.substring(2, 7) + "-" + numbers.substring(7, 11)
      return masked
    }
    return value.substring(0, 15)
  }

  const handleComplaintSelect = (complaint: Complaint) => {
    if (isPlayingAudio) return
    trackCustom("ComplaintSelected", { complaint })

    setSelectedComplaint(complaint)
    const complaintLabel = complaints.find((c) => c.id === complaint)?.label || ""

    addUserMessage(complaintLabel)
    setChatPhase("detail-question")

    setTimeout(() => {
      addDoctorMessage("Perfeito! Estou anotando aqui...", "/perfeito-estou-anotando.mp3")

      setTimeout(() => {
        addDoctorMessage(
          "Agora preciso de alguns detalhes para te orientar melhor. Pode responder com calma.",
          "/detalhes.mp3",
        )

        setTimeout(() => {
          if (!isPlayingAudio) {
            setChatPhase("detail-form")
          }
        }, complaint === "outro" ? 2000 : 6000)
      }, 3000)
    }, 1500)
  }

  const handleDetailSubmit = () => {
    if (isPlayingAudio) return

    let detailSummary = ""

    if (selectedComplaint === "oleosa" || selectedComplaint === "acne") {
      detailSummary = `${previousProcedure === "sim" ? "Já fez limpeza profissional" : "Primeiro procedimento"}. Rotina: ${skinCareRoutine || "não informada"}`
    } else if (selectedComplaint === "manchas" || selectedComplaint === "opaca") {
      detailSummary = `Preocupação: ${skinConcern || "não descrita"}. ${previousProcedure === "sim" ? "Já fez procedimento" : "Primeiro procedimento"}`
    } else {
      detailSummary = "Detalhes compartilhados"
    }

    const complaintLabel = complaints.find((c) => c.id === selectedComplaint)?.label || ""
    const fullDetails = `${detailSummary}. Notas: ${generalDetails || "Nenhuma nota adicional"}`

    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: userName,
        phone: userPhone,
        unit: userUnit,
        complaint: complaintLabel,
        details: fullDetails,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) console.log("Lead notified")
      })
      .catch((err) => console.error("Error notifying lead:", err))

    addUserMessage(detailSummary)

    setChatPhase("analyzing")
    setTimeout(() => {
      addDoctorMessage(
        "Obrigada! Com isso consigo te orientar melhor.",
        "/obrigada-com-isso-consigo-te-orientar-melhor.mp3",
      )

      setTimeout(() => {
        addDoctorMessage("Deixa eu analisar tudo que você me contou...")

        setTimeout(() => {
          setChatPhase("service")
        }, 3000)
      }, 2500)
    }, 1500)
  }

  const formatDateDisplay = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    return `${days[date.getDay()]}, ${String(day).padStart(2, "0")}/${months[month - 1]}`
  }

  const handleServiceNext = () => {
    if (isPlayingAudio) return

    setTimeout(() => {
      addDoctorMessage("Vou verificar os horários disponíveis para você... 🗓️")
      setChatPhase("scheduling")

      fetch("/api/schedule")
        .then((r) => r.json())
        .then((data) => {
          if (data.dates?.length > 0) {
            setAvailableDates(data.dates)
            setTimeout(() => {
              addDoctorMessage("Esses são os dias disponíveis para a sua Limpeza de Pele — escolha o melhor para você:")
              setChatPhase("picking-date")
            }, 1500)
          } else {
            addDoctorMessage("Vou te encaminhar para o WhatsApp para finalizarmos o agendamento por lá.")
            setTimeout(() => setChatPhase("whatsapp"), 1500)
          }
        })
        .catch(() => {
          addDoctorMessage("Vou te encaminhar para o WhatsApp para finalizarmos o agendamento por lá.")
          setTimeout(() => setChatPhase("whatsapp"), 1500)
        })
    }, 500)
  }

  const handleDateSelect = (dateData: AvailableDate) => {
    const label = formatDateDisplay(dateData.date)
    addUserMessage(label)
    setSelectedDateData(dateData)
    setTimeout(() => {
      addDoctorMessage(`Ótimo! Para ${label}, esses são os horários disponíveis:`)
      setChatPhase("picking-time")
    }, 800)
  }

  const handleSlotSelect = (slot: AvailableSlot) => {
    addUserMessage(`${slot.start}`)
    setSelectedSlot(slot)
    track("Schedule", { content_name: "Limpeza de Pele Profunda" })
    setChatPhase("booking")

    fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: userName,
        phone: userPhone,
        unit: userUnit,
        slotId: slot.id,
        timegridId: slot.timegrid_id,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setBookedInfo({ date: selectedDateData!.date, start: slot.start })
          setTimeout(() => {
            addDoctorMessage(
              `Tudo certo, ${userName}! 🎉 Sua Limpeza de Pele está confirmada para **${formatDateDisplay(selectedDateData!.date)}** às **${slot.start}**.\n\nAguardamos você com muito carinho! 💕`,
            )
            setChatPhase("booked")
          }, 1000)
        } else {
          addDoctorMessage("Não consegui confirmar automaticamente, mas vou te encaminhar para o WhatsApp agora!")
          setTimeout(() => setChatPhase("whatsapp"), 1500)
        }
      })
      .catch(() => {
        addDoctorMessage("Não consegui confirmar automaticamente, mas vou te encaminhar para o WhatsApp agora!")
        setTimeout(() => setChatPhase("whatsapp"), 1500)
      })
  }

  const handleWhatsAppRedirect = () => {
    if (!selectedComplaint || isPlayingAudio) return
    track("Contact", { content_name: "WhatsApp Natuclinic" })
    const service = services[selectedComplaint]
    let scheduleInfo = ""
    if (selectedDateData && selectedSlot) {
      scheduleInfo = ` Escolhi o dia ${formatDateDisplay(selectedDateData.date)} às ${selectedSlot.start}.`
    }
    const unitInfo = userUnit ? ` Prefiro ser atendida na unidade de ${userUnit}.` : ""
    const message = `Olá! Meu nome é ${userName}. Completei minha avaliação na Natuclinic sobre ${service.title}.${unitInfo}${scheduleInfo} Gostaria de confirmar meu agendamento!`
    window.open(`https://wa.me/5561992551867?text=${encodeURIComponent(message)}`, "_blank")
  }


  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative w-full max-w-[430px] h-screen md:h-screen overflow-hidden flex flex-col md:shadow-2xl">
          <div className="relative z-10 flex flex-col h-full">
            <div className="bg-[#4A3328] text-white shadow-sm border-b border-[#3a271f] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/10">
                    <img src="/debora-074.jpg" alt="Dra. Débora" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[17px]">Dra. Débora - Natuclinic</h2>
                    <p className="text-xs text-white/70 mt-0.5">Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4 text-white">
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{ background: "transparent" }}
            >
              {/* Wallpaper sticky — fica fixo enquanto mensagens rolam */}
              <img
                src="/wallpaper.jpg"
                aria-hidden
                className="sticky top-0 w-full object-cover pointer-events-none select-none z-0"
                style={{ height: "100dvh", marginBottom: "-100dvh" }}
              />

              <div className="relative z-10 space-y-4 p-3 pb-8">
                {messages.map((message) => {
                  if (message.type === "list-card") {
                    return (
                      <div key={message.id} className="flex justify-start animate-fade-in">
                        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl rounded-bl-none px-5 py-4 space-y-2 max-w-[80%]">
                          {message.items?.map((item) => (
                            <div key={item} className="flex items-center gap-2 text-sm">
                              <span className="text-amber-500">✦</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }

                  if (message.type === "video") {
                    return (
                      <div key={message.id} className="flex justify-start animate-fade-in">
                        <div className="rounded-2xl overflow-hidden max-w-[85%] border border-border shadow-md">
                          <video
                            src={message.videoSrc}
                            autoPlay
                            muted
                            playsInline
                            controls
                            className="w-full max-h-[320px] object-cover"
                            onEnded={() => setChatPhase("video-ended")}
                          />
                        </div>
                      </div>
                    )
                  }

                  if (message.type === "photo-gallery") {
                    return (
                      <div key={message.id} className="flex justify-start animate-fade-in">
                        <div className="max-w-[85%]">
                          <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden">
                            {message.images?.map((src, i) => (
                              <img
                                key={i}
                                src={src}
                                alt={`Clínica ${i + 1}`}
                                className="w-full h-36 object-cover"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.type === "user"
                            ? "bg-[#4A3328] text-white rounded-br-none"
                            : "bg-card/90 backdrop-blur-sm border border-border rounded-bl-none"
                        }`}
                      >
                        <div className="flex flex-col">
                          <p className="text-sm md:text-base leading-relaxed whitespace-pre-line">{renderBold(message.content)}</p>
                          {message.type === "user" ? (
                            <div className="flex justify-end items-center gap-1 mt-1 -mb-1 opacity-70">
                              <span className="text-[10px]">{message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                              <CheckCheck className="w-4 h-4 text-blue-500" />
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60 mt-1">{message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                          )}
                        </div>

                        {message.audioUrl && (
                          <div className="flex items-center gap-3 mt-3 min-w-[220px] md:min-w-[300px]">
                            <button
                              onClick={() => {
                                if (isPlayingAudio && currentPlayingUrl === message.audioUrl) {
                                  stopAllAudio()
                                } else {
                                  playAudio(message.audioUrl!, undefined, true)
                                }
                              }}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                isPlayingAudio && currentPlayingUrl === message.audioUrl
                                  ? "bg-[#8E3A4D] text-white shadow-lg"
                                  : "bg-primary/20 text-primary hover:bg-primary/30"
                              }`}
                            >
                              {isPlayingAudio && currentPlayingUrl === message.audioUrl ? (
                                <Pause className="w-5 h-5 fill-current" />
                              ) : (
                                <Play className="w-5 h-5 fill-current" />
                              )}
                            </button>

                            <div className="flex-1 h-3 bg-muted/50 rounded-full overflow-hidden relative">
                              {(() => {
                                const isActive = isPlayingAudio && currentPlayingUrl === message.audioUrl
                                return (
                                  <div
                                    className="absolute inset-y-0 left-0 bg-[#8E3A4D] transition-all duration-300"
                                    style={{
                                      width: isActive ? `${audioProgress}%` : "0%",
                                      boxShadow: isActive ? "0 0 12px rgba(142, 58, 77, 0.4)" : "none",
                                    }}
                                  />
                                )
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {isTyping && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl rounded-bl-none px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}

                {/* PRÉ-QUALIFICAÇÃO: botão inicial */}
                {chatPhase === "intro-cta" && (
                  <div className="flex justify-end animate-fade-in pt-2">
                    <button
                      onClick={handleIntroCta}
                      className="bg-[#4A3328] text-white px-5 py-3 rounded-2xl rounded-br-none font-medium text-sm shadow-lg hover:bg-[#3a271f] transition-all active:scale-95 flex items-center gap-2"
                    >
                      Quero entender como funciona
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 -rotate-45">
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* VÍDEO: botão continuar após término */}
                {chatPhase === "video-ended" && (
                  <div className="flex justify-end animate-fade-in pt-2">
                    <button
                      onClick={handleVideoContinue}
                      className="bg-[#4A3328] text-white px-5 py-3 rounded-2xl rounded-br-none font-medium text-sm shadow-lg hover:bg-[#3a271f] transition-all active:scale-95 flex items-center gap-2"
                    >
                      Continuar
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 -rotate-45">
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* PRÉ-QUALIFICAÇÃO: botão continuar */}
                {chatPhase === "pre-qualify-cta" && (
                  <div className="flex justify-end animate-fade-in pt-2">
                    <button
                      onClick={handlePreQualifyCta}
                      className="bg-[#4A3328] text-white px-5 py-3 rounded-2xl rounded-br-none font-medium text-sm shadow-lg hover:bg-[#3a271f] transition-all active:scale-95 flex items-center gap-2"
                    >
                      Continuar
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 -rotate-45">
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* INPUT: nome */}
                {chatPhase === "name-input" && !isPlayingAudio && (
                  <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 animate-fade-in pt-4">
                    <form onSubmit={handleNameSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Seu nome</label>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="Digite seu nome..."
                          className="flex h-12 w-full rounded-md border border-input bg-background/50 px-4 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          autoFocus
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={!userName.trim() || isPlayingAudio}
                        className="w-full text-base"
                        size="lg"
                      >
                        Continuar
                      </Button>
                    </form>
                  </div>
                )}

                {/* INPUT: telefone */}
                {chatPhase === "phone-input" && !isPlayingAudio && (
                  <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 animate-fade-in pt-4">
                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Seu WhatsApp</label>
                        <input
                          type="tel"
                          value={userPhone}
                          onChange={(e) => setUserPhone(formatPhone(e.target.value))}
                          placeholder="(00) 00000-0000"
                          className="flex h-12 w-full rounded-md border border-input bg-background/50 px-4 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          autoFocus
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={userPhone.replace(/\D/g, "").length < 10 || isPlayingAudio}
                        className="w-full text-base"
                        size="lg"
                      >
                        Continuar
                      </Button>
                    </form>
                  </div>
                )}

                {/* FILTRO: localização */}
                {chatPhase === "qualifying-location" && !isPlayingAudio && (
                  <div className="space-y-3 animate-fade-in pt-2">
                    <button
                      onClick={() => handleLocationAnswer("Taguatinga-DF e região")}
                      className="w-full bg-card/90 backdrop-blur-sm border-2 border-border hover:border-primary/50 rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="text-2xl">📍</span>
                      <span className="text-left flex-1 font-medium">Taguatinga e região</span>
                    </button>
                    <button
                      onClick={() => handleLocationAnswer("Planaltina-DF e região")}
                      className="w-full bg-card/90 backdrop-blur-sm border-2 border-border hover:border-primary/50 rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="text-2xl">📍</span>
                      <span className="text-left flex-1 font-medium">Planaltina e região</span>
                    </button>
                    <button
                      onClick={() => handleLocationAnswer(null)}
                      className="w-full bg-card/90 backdrop-blur-sm border-2 border-border hover:border-destructive/50 rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="text-2xl">🚫</span>
                      <span className="text-left flex-1">Não sou do DF</span>
                    </button>
                  </div>
                )}

                {/* FILTRO: disponibilidade */}
                {chatPhase === "qualifying-availability" && !isPlayingAudio && (
                  <div className="space-y-3 animate-fade-in pt-2">
                    <button
                      onClick={() => handleAvailabilityAnswer(true)}
                      className="w-full bg-card/90 backdrop-blur-sm border-2 border-border hover:border-primary/50 rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="text-2xl">✅</span>
                      <span className="text-left flex-1 font-medium">Sim, tenho disponibilidade nos próximos 15 dias</span>
                    </button>
                    <button
                      onClick={() => handleAvailabilityAnswer(false)}
                      className="w-full bg-card/90 backdrop-blur-sm border-2 border-border hover:border-destructive/50 rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="text-2xl">🗓️</span>
                      <span className="text-left flex-1">Não tenho disponibilidade agora</span>
                    </button>
                  </div>
                )}

                {/* ENCERRAMENTO: não qualificado */}
                {chatPhase === "disqualified" && (
                  <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-8 text-center space-y-5 animate-fade-in">
                    <div className="text-5xl">🌸</div>
                    <h3 className="text-xl font-serif text-foreground">Obrigada pelo seu interesse!</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      No momento não conseguimos te encaminhar para um atendimento, mas você pode acompanhar nossas novidades pelas redes sociais.
                    </p>
                    <Button
                      onClick={() => window.open("https://wa.me/5561992551867", "_blank")}
                      variant="outline"
                      className="w-full"
                    >
                      Falar com a equipe mesmo assim
                    </Button>
                  </div>
                )}

                {/* SELEÇÃO: queixa */}
                {chatPhase === "complaint-selection" && !isPlayingAudio && (
                  <div className="space-y-3 animate-fade-in pt-4">
                    {complaints.map((complaint) => (
                      <button
                        key={complaint.id}
                        onClick={() => handleComplaintSelect(complaint.id)}
                        disabled={isPlayingAudio}
                        className="w-full bg-card/90 backdrop-blur-sm border-2 border-border hover:border-primary/50 rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <span className="text-2xl">{complaint.icon}</span>
                        <span className="text-left flex-1">{complaint.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* FORMULÁRIO: detalhes de pele */}
                {chatPhase === "detail-form" && !isPlayingAudio && selectedComplaint && (
                  <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-6 space-y-6 animate-fade-in">
                    {(selectedComplaint === "oleosa" || selectedComplaint === "acne") && (
                      <>
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Já realizou alguma limpeza de pele profissional antes?</label>
                          <RadioGroup value={previousProcedure} onValueChange={setPreviousProcedure}>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <RadioGroupItem value="sim" />
                                <span>Sim</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <RadioGroupItem value="nao" />
                                <span>Não</span>
                              </label>
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Você usa algum produto específico para cuidado da pele?</label>
                          <Textarea
                            value={skinCareRoutine}
                            onChange={(e) => setSkinCareRoutine(e.target.value)}
                            placeholder="Ex: hidratante, protetor solar, sérum..."
                            className="min-h-[80px]"
                          />
                        </div>
                      </>
                    )}

                    {(selectedComplaint === "manchas" || selectedComplaint === "opaca") && (
                      <>
                        <div className="space-y-3">
                          <label className="text-sm font-medium">O que mais te incomoda na sua pele?</label>
                          <Textarea
                            value={skinConcern}
                            onChange={(e) => setSkinConcern(e.target.value)}
                            placeholder="Descreva o que você gostaria de melhorar..."
                            className="min-h-[100px]"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Já realizou algum procedimento estético antes?</label>
                          <RadioGroup value={previousProcedure} onValueChange={setPreviousProcedure}>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <RadioGroupItem value="sim" />
                                <span>Sim</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <RadioGroupItem value="nao" />
                                <span>Não</span>
                              </label>
                            </div>
                          </RadioGroup>
                        </div>
                      </>
                    )}

                    {selectedComplaint === "outro" && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium">Conte um pouco mais sobre o que você precisa</label>
                        <Textarea
                          value={generalDetails}
                          onChange={(e) => setGeneralDetails(e.target.value)}
                          placeholder="Descreva suas necessidades..."
                          className="min-h-[150px]"
                        />
                      </div>
                    )}

                    <Button onClick={handleDetailSubmit} disabled={isPlayingAudio} className="w-full" size="lg">
                      Enviar respostas
                    </Button>
                  </div>
                )}

                {/* ANALISANDO */}
                {chatPhase === "analyzing" && (
                  <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-8 text-center space-y-6 animate-fade-in">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <h3 className="text-2xl font-serif">Analisando suas respostas...</h3>
                    <p className="text-muted-foreground">Estou preparando a melhor recomendação para o seu caso.</p>
                  </div>
                )}

                {/* SERVIÇO RECOMENDADO */}
                {chatPhase === "service" && selectedComplaint && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
                      <div className="p-8 border-b border-border">
                        <h2 className="text-3xl md:text-4xl font-serif text-primary mb-2">
                          {services[selectedComplaint].title}
                        </h2>
                        <p className="text-muted-foreground text-lg">{services[selectedComplaint].description}</p>
                      </div>
                      <div className="p-6 space-y-4">
                        <p className="text-lg leading-relaxed">{services[selectedComplaint].longDescription}</p>
                        <Button
                          onClick={handleServiceNext}
                          disabled={isPlayingAudio}
                          className="w-full py-6 text-lg"
                          size="lg"
                        >
                          Continuar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* AGENDAMENTO: carregando */}
                {chatPhase === "scheduling" && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl rounded-bl-none px-5 py-4 flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-muted-foreground">Verificando horários...</span>
                    </div>
                  </div>
                )}

                {/* AGENDAMENTO: escolha de data */}
                {chatPhase === "picking-date" && (
                  <div className="animate-fade-in pt-2">
                    <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {availableDates.slice(0, 10).map((d) => {
                        const [year, month, day] = d.date.split("-").map(Number)
                        const date = new Date(year, month - 1, day)
                        const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
                        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
                        return (
                          <button
                            key={d.date}
                            onClick={() => handleDateSelect(d)}
                            className="flex-shrink-0 bg-card/90 backdrop-blur-sm border-2 border-border hover:border-primary/60 rounded-xl p-3 text-center transition-all active:scale-95 min-w-[68px]"
                          >
                            <div className="text-[11px] text-muted-foreground uppercase">{days[date.getDay()]}</div>
                            <div className="text-xl font-bold leading-tight">{String(day).padStart(2, "0")}</div>
                            <div className="text-[11px] text-muted-foreground">{months[month - 1]}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* AGENDAMENTO: escolha de horário */}
                {chatPhase === "picking-time" && selectedDateData && (
                  <div className="space-y-2 animate-fade-in pt-2">
                    {selectedDateData.slots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => handleSlotSelect(slot)}
                        className="w-full bg-card/90 backdrop-blur-sm border-2 border-border hover:border-primary/50 rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <span className="text-2xl">🕐</span>
                        <div className="text-left">
                          <div className="font-medium">{slot.start}</div>
                          <div className="text-xs text-muted-foreground">até {slot.end}</div>
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() => setChatPhase("picking-date")}
                      className="w-full text-sm text-muted-foreground py-2 hover:text-foreground transition-colors"
                    >
                      ← Ver outro dia
                    </button>
                  </div>
                )}

                {/* AGENDAMENTO: confirmando */}
                {chatPhase === "booking" && (
                  <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-8 text-center space-y-4 animate-fade-in">
                    <div className="flex justify-center">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-muted-foreground text-sm">Confirmando seu agendamento...</p>
                  </div>
                )}

                {/* AGENDAMENTO: confirmado */}
                {chatPhase === "booked" && bookedInfo && (
                  <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-8 text-center space-y-5 animate-fade-in">
                    <div className="text-5xl">✅</div>
                    <h3 className="text-2xl font-serif">Agendamento Confirmado!</h3>
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 space-y-1 text-left">
                      <p className="font-semibold text-center">Limpeza de Pele Profunda</p>
                      <p className="text-muted-foreground text-sm text-center">{formatDateDisplay(bookedInfo.date)} às {bookedInfo.start}</p>
                      <p className="text-xs text-muted-foreground text-center">Natuclinic — Taguatinga Norte, QNE 1, nº 2</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Em caso de dúvidas ou para remarcar, entre em contato pelo WhatsApp 💕</p>
                    <Button
                      onClick={() => window.open("https://wa.me/5561992551867", "_blank")}
                      variant="outline"
                      className="w-full"
                    >
                      WhatsApp da Clínica
                    </Button>
                  </div>
                )}

                {/* WHATSAPP: lead qualificado */}
                {chatPhase === "whatsapp" && (
                  <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-8 text-center space-y-6 animate-fade-in">
                    <div className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-serif">Vamos finalizar seu agendamento!</h3>
                    <p className="text-muted-foreground">Nossa equipe já está preparada para te atender com todo carinho</p>
                    <Button
                      onClick={handleWhatsAppRedirect}
                      size="lg"
                      className="bg-[#25D366] hover:bg-[#20BA5A] text-white w-full"
                    >
                      Falar no WhatsApp
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
