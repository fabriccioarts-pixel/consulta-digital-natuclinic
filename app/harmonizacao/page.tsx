"use client"

import { useState, useEffect, useRef } from "react"
import { track, trackCustom } from "@/lib/pixel"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

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

type Complaint = "rugas" | "labios" | "rosto" | "nariz" | "rejuvenescimento" | "outro"

interface ServiceInfo {
  title: string
  description: string
  longDescription: string
}

const complaints: { id: Complaint; label: string; icon: string }[] = [
  { id: "rugas", label: "Linhas de expressão e rugas", icon: "✨" },
  { id: "labios", label: "Lábios finos ou assimétricos", icon: "💋" },
  { id: "rosto", label: "Perda de volume / contorno facial", icon: "🫧" },
  { id: "nariz", label: "Formato do nariz", icon: "👃" },
  { id: "rejuvenescimento", label: "Rejuvenescimento da pele", icon: "🌟" },
  { id: "outro", label: "Outra preocupação com o rosto", icon: "💆" },
]

const services: Record<Complaint, ServiceInfo> = {
  rugas: {
    title: "Toxina Botulínica (Botox)",
    description: "Suaviza linhas de expressão com resultado natural",
    longDescription: "Aplicação precisa da toxina botulínica para suavizar rugas e linhas de expressão — resultado natural, sem aspecto artificial, com menos de 30 minutos de procedimento.",
  },
  labios: {
    title: "Preenchimento Labial",
    description: "Lábios mais volumosos, definidos e harmoniosos",
    longDescription: "Uso de ácido hialurônico para volumizar, definir o contorno e harmonizar os lábios de forma natural — respeitando suas proporções e beleza única.",
  },
  rosto: {
    title: "Preenchimento Facial",
    description: "Reposição de volume e contorno do rosto",
    longDescription: "Protocolo de preenchimento com ácido hialurônico para restaurar o volume perdido, definir maçãs do rosto e harmonizar o contorno facial com resultado suave e duradouro.",
  },
  nariz: {
    title: "Rinomodelação",
    description: "Remodelação do nariz sem cirurgia",
    longDescription: "Procedimento não cirúrgico que utiliza ácido hialurônico para corrigir imperfeições do nariz — elevação da ponta, correção de dorso e harmonização do perfil.",
  },
  rejuvenescimento: {
    title: "Rejuvenescimento Facial",
    description: "Pele mais jovem, luminosa e firme",
    longDescription: "Protocolos com Skinbooster, Bioestimuladores de Colágeno e Fios de PDO para restaurar a firmeza, luminosidade e qualidade da pele — combatendo a flacidez e devolvendo a jovialidade de forma gradual e natural.",
  },
  outro: {
    title: "Avaliação de Harmonização Personalizada",
    description: "Diagnóstico completo para encontrar o melhor protocolo",
    longDescription: "Análise individualizada do seu rosto para identificar quais procedimentos trarão maior harmonia e resultados de acordo com suas características e objetivos.",
  },
}

export default function HarmonizacaoFunnel() {
  const [chatPhase, setChatPhase] = useState<
    | "welcome"
    | "intro"
    | "intro-cta"
    | "pre-qualify"
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
    | "whatsapp"
  >("welcome")

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [selectedComplaints, setSelectedComplaints] = useState<Set<Complaint>>(new Set())
  const [userName, setUserName] = useState("")
  const [userPhone, setUserPhone] = useState("")
  const [userUnit, setUserUnit] = useState("")
  const [generalDetails, setGeneralDetails] = useState("")
  const [currentPlayingUrl, setCurrentPlayingUrl] = useState<string | null>(null)
  const [audioProgress, setAudioProgress] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const pencilSoundRef = useRef<HTMLAudioElement | null>(null)
  const receivesfxRef = useRef<HTMLAudioElement | null>(null)
  const sendSfxRef = useRef<HTMLAudioElement | null>(null)
  const audioQueueRef = useRef<{ url: string; onEnd?: () => void }[]>([])
  const audioUnlockedRef = useRef(false)
  const userHasInteracted = useRef(false)
  const nextMsgAtRef = useRef(0) // epoch ms when next message slot is free

  useEffect(() => {
    if (userHasInteracted.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, isTyping, chatPhase])

  useEffect(() => {
    playBackgroundMusic()
    setChatPhase("intro")
    nextMsgAtRef.current = 0

    addDoctorMessage("✨ Bem-vinda à Natuclinic", undefined, 400)

    setTimeout(() => {
      addDoctorMessage(
        "Na Natuclinic, realizamos procedimentos de **harmonização facial** com foco em resultados naturais, seguros e personalizados.",
        undefined, 1800,
      )
      addDoctorMessage("Não trabalhamos com resultados exagerados.", undefined, 1500)
      addDoctorMessage("Nossa proposta é **realçar sua beleza natural** — com técnica, cuidado e experiência.", undefined, 1600)
      scheduleAction(() => setChatPhase("intro-cta"))
    }, 1500)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    audio.play().catch(() => handleEnd())
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
    if (immediate) { stopAllAudio(); startAudio(url, onEnd); return }
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

    const primeAudio = (url: string, ref: React.MutableRefObject<HTMLAudioElement | null>) => {
      const audio = new Audio(encodeURI(url))
      audio.volume = 0
      audio.play().then(() => { audio.pause(); audio.currentTime = 0; audio.volume = 0.4; ref.current = audio }).catch(() => {})
    }
    primeAudio("/receive notification.mp3", receivesfxRef)
    primeAudio("/send notification.mp3", sendSfxRef)
  }

  const playReceiveSound = () => {
    if (!audioUnlockedRef.current) return
    const base = receivesfxRef.current
    const sfx = base ? (base.cloneNode() as HTMLAudioElement) : new Audio(encodeURI("/receive notification.mp3"))
    sfx.volume = 0.4
    sfx.play().catch(() => {})
  }

  const playSendSound = () => {
    if (!audioUnlockedRef.current) return
    const base = sendSfxRef.current
    const sfx = base ? (base.cloneNode() as HTMLAudioElement) : new Audio(encodeURI("/send notification.mp3"))
    sfx.volume = 0.4
    sfx.play().catch(() => {})
  }

  // Schedule a doctor message sequentially — waits for the previous message to finish before typing
  const addDoctorMessage = (content: string, audioUrl?: string, delay = 1800) => {
    const now = Date.now()
    const startAt = Math.max(now, nextMsgAtRef.current)
    nextMsgAtRef.current = startAt + delay + 500
    const waitMs = Math.max(0, startAt - now)

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
        if (audioUrl) playAudio(audioUrl)
      }, delay)
    }, waitMs)
  }

  // Fire a callback after the current message queue finishes
  const scheduleAction = (fn: () => void, extraMs = 500) => {
    const now = Date.now()
    const at = Math.max(now, nextMsgAtRef.current) + extraMs
    setTimeout(fn, Math.max(0, at - now))
  }

  const addUserMessage = (content: string) => {
    userHasInteracted.current = true
    playPencilSound()
    playSendSound()
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    }])
  }

  const addListCard = (items: string[]) => {
    const now = Date.now()
    const startAt = Math.max(now, nextMsgAtRef.current)
    nextMsgAtRef.current = startAt + 500
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        type: "list-card",
        content: "",
        items,
        timestamp: new Date(),
      }])
    }, Math.max(0, startAt - now))
  }

  const addVideoMessage = (src: string) => {
    const now = Date.now()
    const startAt = Math.max(now, nextMsgAtRef.current)
    nextMsgAtRef.current = startAt + 600
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        type: "video",
        content: "",
        videoSrc: src,
        timestamp: new Date(),
      }])
    }, Math.max(0, startAt - now))
  }

  const addPhotoGallery = (images: string[]) => {
    const now = Date.now()
    const startAt = Math.max(now, nextMsgAtRef.current)
    nextMsgAtRef.current = startAt + 600
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 2).toString(),
        type: "photo-gallery",
        content: "",
        images,
        timestamp: new Date(),
      }])
    }, Math.max(0, startAt - now))
  }

  const handleIntroCta = () => {
    unlockAudio()
    trackCustom("HarmonizacaoFunnelStart")
    addUserMessage("Quero saber mais")
    setChatPhase("pre-qualify")
    nextMsgAtRef.current = 0

    setTimeout(() => {
      addDoctorMessage(
        "Antes de te mostrar os detalhes, preciso entender se a **Natuclinic é realmente o que você procura**.",
        undefined, 2500,
      )
      addDoctorMessage("Nossos atendimentos costumam atrair mulheres que valorizam:", undefined, 1500)
      addListCard(["resultado natural", "técnica avançada", "ambiente premium", "atendimento personalizado"])
      addVideoMessage("/ambiente.mp4")
      // 4s after video appears, continue automatically
      scheduleAction(() => {
        addDoctorMessage(
          "Nosso espaço foi pensado para você se sentir segura, confortável e bem cuidada durante todo o procedimento.",
          undefined, 2500,
        )
        scheduleAction(() => setChatPhase("video-ended"))
      }, 4000)
    }, 1000)
  }

  const handleVideoEnded = () => {}

  const handleVideoContinue = () => {
    addUserMessage("Continuar")
    setChatPhase("pre-qualify")
    nextMsgAtRef.current = 0

    setTimeout(() => {
      addDoctorMessage("☕ cappuccino gourmet\n🌿 ambiente relaxante\n✨ protocolo avançado de harmonização", undefined, 1800)
      addDoctorMessage("Tudo pensado para que você saia se sentindo **mais bonita e confiante**.", undefined, 1800)
      addPhotoGallery([
        "/fotos-clinica/unnamed.webp",
        "/fotos-clinica/unnamed 1.webp",
        "/fotos-clinica/unnamed (1).webp",
        "/fotos-clinica/unnamed (2).webp",
        "/fotos-clinica/unnamed (3).webp",
        "/fotos-clinica/unnamed (4).webp",
        "/fotos-clinica/unnamed (5).webp",
      ])
      addDoctorMessage(
        "✨ Nossos procedimentos de Harmonização Facial ✨\n\n✔️ Toxina Botulínica (Botox)\n✔️ Preenchimento Labial\n✔️ Preenchimento Facial\n✔️ Rinomodelação\n✔️ Bioestimuladores de Colágeno\n✔️ Fios de PDO\n✔️ Skinbooster\n\nTodos realizados com produtos de alta qualidade e técnica personalizada para o seu rosto.",
        undefined, 2800,
      )
      addDoctorMessage("Se esse é o seu perfil, **vamos continuar**.", undefined, 1800)
      scheduleAction(() => setChatPhase("pre-qualify-cta"))
    }, 800)
  }

  const handlePreQualifyCta = () => {
    unlockAudio()
    addUserMessage("Continuar")
    setChatPhase("name-question")
    nextMsgAtRef.current = 0

    setTimeout(() => {
      addDoctorMessage("Ótimo! Vamos começar sua avaliação personalizada.")
      addDoctorMessage("Antes de tudo, como você gostaria de ser chamada?")
      scheduleAction(() => setChatPhase("name-input"))
    }, 800)
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

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    trackCustom("HarmonizacaoNameSubmitted")
    if (!userName.trim() || isPlayingAudio) return
    addUserMessage(userName)
    setChatPhase("phone-question")
    nextMsgAtRef.current = 0
    setTimeout(() => {
      addDoctorMessage(`Muito prazer, ${userName}!`)
      addDoctorMessage("Qual o seu melhor WhatsApp para eu te enviar os detalhes?")
      scheduleAction(() => setChatPhase("phone-input"))
    }, 1000)
  }

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    track("Lead", { content_name: "Natuclinic Harmonização Facial" })
    if (userPhone.replace(/\D/g, "").length < 10 || isPlayingAudio) return
    addUserMessage(userPhone)
    nextMsgAtRef.current = 0
    setTimeout(() => {
      addDoctorMessage("Obrigada! Já salvei aqui.")
      addDoctorMessage("Antes de continuar, você é do Distrito Federal ou região?")
      scheduleAction(() => setChatPhase("qualifying-location"))
    }, 1000)
  }

  const handleLocationAnswer = (unit: string | null) => {
    if (isPlayingAudio) return
    if (!unit) {
      addUserMessage("Não sou da região")
      setChatPhase("disqualified")
      nextMsgAtRef.current = 0
      setTimeout(() => {
        addDoctorMessage("Entendo! No momento atendemos presencialmente no Distrito Federal — Taguatinga e Planaltina.")
        addDoctorMessage("Quando vier à nossa região, ficaremos felizes em te receber. Até breve! 💕")
      }, 1000)
      return
    }
    setUserUnit(unit)
    addUserMessage(unit)
    nextMsgAtRef.current = 0
    setTimeout(() => {
      addDoctorMessage("Que ótimo! Você tem disponibilidade para realizar o procedimento nos próximos 15 dias?")
      scheduleAction(() => setChatPhase("qualifying-availability"))
    }, 1000)
  }

  const handleAvailabilityAnswer = (isAvailable: boolean) => {
    if (isPlayingAudio) return
    if (!isAvailable) {
      addUserMessage("Não tenho disponibilidade agora")
      setChatPhase("disqualified")
      nextMsgAtRef.current = 0
      setTimeout(() => {
        addDoctorMessage("Sem problema! Quando sentir que é o momento certo, pode retornar por aqui. Cuide-se! 🌸")
      }, 1000)
      return
    }
    addUserMessage("Sim, tenho disponibilidade nos próximos 15 dias")
    setChatPhase("complaint-question")
    nextMsgAtRef.current = 0
    setTimeout(() => {
      addDoctorMessage("Perfeito! Então vamos montar o seu plano de harmonização.")
      addDoctorMessage("O que você mais gostaria de melhorar no seu rosto?", undefined, 2000)
      scheduleAction(() => setChatPhase("complaint-selection"))
    }, 1000)
  }

  const toggleComplaint = (complaint: Complaint) => {
    setSelectedComplaints((prev) => {
      const next = new Set(prev)
      if (next.has(complaint)) next.delete(complaint)
      else next.add(complaint)
      return next
    })
  }

  const handleComplaintsConfirm = () => {
    if (selectedComplaints.size === 0 || isPlayingAudio) return
    trackCustom("HarmonizacaoComplaintSelected", { complaints: [...selectedComplaints] })
    const labels = [...selectedComplaints]
      .map((id) => complaints.find((c) => c.id === id)?.label || "")
      .join(", ")
    addUserMessage(labels)
    setChatPhase("detail-question")
    nextMsgAtRef.current = 0
    setTimeout(() => {
      addDoctorMessage("Perfeito! Estou anotando aqui...")
      addDoctorMessage("Me conta um pouco mais sobre o que você busca. Pode descrever com suas palavras.")
      scheduleAction(() => setChatPhase("detail-form"))
    }, 1500)
  }

  const getRecommendedService = (): ServiceInfo => {
    const selected = [...selectedComplaints]
    if (selected.length === 1) return services[selected[0]]
    const labelList = selected
      .map((id) => complaints.find((c) => c.id === id)?.label || "")
      .filter(Boolean)
      .join(", ")
    return {
      title: "Avaliação de Harmonização Personalizada",
      description: "Protocolo completo para as suas preocupações",
      longDescription: `Com base nas suas preocupações (${labelList}), nossa especialista vai avaliar o melhor conjunto de procedimentos para o seu rosto — resultado harmonioso e natural, respeitando suas características únicas.`,
    }
  }

  const handleDetailSubmit = () => {
    if (isPlayingAudio) return
    const complaintLabels = [...selectedComplaints]
      .map((id) => complaints.find((c) => c.id === id)?.label || "")
      .join(", ")
    const details = generalDetails || "Sem detalhes adicionais"

    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: userName,
        phone: userPhone,
        unit: userUnit,
        complaint: `[Harmonização] ${complaintLabels}`,
        details,
      }),
    }).catch(() => {})

    addUserMessage(details.substring(0, 60) + (details.length > 60 ? "..." : ""))
    setChatPhase("analyzing")
    nextMsgAtRef.current = 0

    setTimeout(() => {
      addDoctorMessage("Obrigada! Com isso consigo te orientar muito melhor.")
      addDoctorMessage("Deixa eu analisar tudo que você me contou...")
      scheduleAction(() => setChatPhase("service"))
    }, 1500)
  }

  const handleWhatsAppRedirect = () => {
    track("Contact", { content_name: "WhatsApp Harmonização" })
    const service = getRecommendedService()
    const unitInfo = userUnit ? ` Prefiro ser atendida na unidade de ${userUnit}.` : ""
    const complaintLabels = [...selectedComplaints]
      .map((id) => complaints.find((c) => c.id === id)?.label || "")
      .filter(Boolean)
    const complaintText = complaintLabels.length > 0
      ? ` Minhas principais preocupações são: ${complaintLabels.join(", ")}.`
      : ""
    const message = `Olá! Meu nome é ${userName}. Tenho interesse em ${service.title} na Natuclinic.${complaintText}${unitInfo} Gostaria de agendar uma avaliação!`
    window.open(`https://wa.me/5561992551867?text=${encodeURIComponent(message)}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative w-full max-w-[430px] h-dvh overflow-hidden flex flex-col md:shadow-2xl">
        <div className="relative z-10 flex flex-col h-full">

          {/* Header */}
          <div className="bg-[#4A3328] text-white shadow-sm border-b border-[#3a271f] p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/10">
                <img src="/debora-074.jpg" alt="Dra. Débora" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="font-semibold text-[17px]">Dra. Débora - Natuclinic</h2>
                <p className="text-xs text-white/70 mt-0.5">Online</p>
              </div>
            </div>
          </div>

          {/* Chat area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ background: "transparent", touchAction: "pan-y", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            {/* Wallpaper */}
            <img
              src="/wallpaper.jpg"
              aria-hidden
              className="sticky top-0 w-full object-cover pointer-events-none select-none z-0"
              style={{ height: "100dvh", marginBottom: "-100dvh" }}
            />

            <div className="relative z-10 space-y-4 p-3 pb-8">

              {/* Messages */}
              {messages.map((message) => (
                <div key={message.id} className="animate-fade-in">
                  {message.type === "doctor" && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-card/90 backdrop-blur-sm border border-border rounded-bl-none">
                        <p className="text-sm md:text-base leading-relaxed whitespace-pre-line">{renderBold(message.content)}</p>
                        <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                          {message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  )}

                  {message.type === "user" && (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-[#4A3328] text-white rounded-br-none">
                        <p className="text-sm md:text-base leading-relaxed">{message.content}</p>
                        <div className="flex justify-end items-center gap-1 mt-1 -mb-1 opacity-70">
                          <span className="text-[10px]">{message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {message.type === "list-card" && (
                    <div className="flex justify-start">
                      <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl rounded-bl-none px-5 py-4 space-y-2 max-w-[80%]">
                        {message.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-amber-500">✦</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {message.type === "video" && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl overflow-hidden max-w-[85%] border border-border shadow-md">
                        <video
                          src={message.videoSrc}
                          autoPlay
                          muted
                          playsInline
                          controls
                          className="w-full max-h-[320px] object-cover"
                          onEnded={handleVideoEnded}
                        />
                      </div>
                    </div>
                  )}

                  {message.type === "photo-gallery" && (
                    <div className="flex justify-start">
                      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] max-w-[85%]">
                        <div className="flex gap-2 pb-1">
                          {message.images?.map((src, i) => (
                            <img
                              key={i}
                              src={src}
                              alt=""
                              className="w-32 h-32 object-cover rounded-2xl flex-shrink-0 shadow-lg"
                              style={{ border: "2px solid rgba(74,51,40,0.12)" }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
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

              {/* Intro CTA */}
              {chatPhase === "intro-cta" && (
                <div className="flex justify-end animate-fade-in pt-2">
                  <button
                    onClick={handleIntroCta}
                    className="bg-[#4A3328] text-white px-5 py-3 rounded-2xl rounded-br-none font-medium text-sm shadow-lg hover:bg-[#3a271f] transition-all active:scale-95 flex items-center gap-2"
                  >
                    Quero saber mais
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 -rotate-45">
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Video CTA */}
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

              {/* Pre-qualify CTA */}
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

              {/* Name input */}
              {chatPhase === "name-input" && (
                <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 animate-fade-in">
                  <form onSubmit={handleNameSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Seu nome..."
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#4A3328]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!userName.trim()}
                      className="bg-[#4A3328] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#3a271f] transition-all"
                    >
                      Enviar
                    </button>
                  </form>
                </div>
              )}

              {/* Phone input */}
              {chatPhase === "phone-input" && (
                <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 animate-fade-in">
                  <form onSubmit={handlePhoneSubmit} className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="(61) 99999-9999"
                      value={userPhone}
                      onChange={(e) => setUserPhone(formatPhone(e.target.value))}
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#4A3328]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={userPhone.replace(/\D/g, "").length < 10}
                      className="bg-[#4A3328] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#3a271f] transition-all"
                    >
                      Enviar
                    </button>
                  </form>
                </div>
              )}

              {/* Location */}
              {chatPhase === "qualifying-location" && (
                <div className="space-y-2 animate-fade-in pt-2">
                  {[
                    { label: "Taguatinga e região", value: "Taguatinga-DF e região" },
                    { label: "Planaltina e região", value: "Planaltina-DF e região" },
                    { label: "Não sou do DF", value: null },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleLocationAnswer(opt.value)}
                      className={`w-full bg-card/90 backdrop-blur-sm border-2 rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${opt.value ? "border-border hover:border-primary/50" : "border-border hover:border-destructive/50"}`}
                    >
                      <span className="text-2xl">{opt.value ? "📍" : "🚫"}</span>
                      <span className="text-left flex-1 font-medium text-sm">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Availability */}
              {chatPhase === "qualifying-availability" && (
                <div className="space-y-2 animate-fade-in pt-2">
                  {[
                    { label: "Sim, tenho disponibilidade", value: true, icon: "✅" },
                    { label: "Não no momento", value: false, icon: "⏰" },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleAvailabilityAnswer(opt.value)}
                      className="w-full bg-card/90 backdrop-blur-sm border-2 border-border hover:border-primary/50 rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <span className="text-left flex-1 font-medium text-sm">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Complaint selection */}
              {chatPhase === "complaint-selection" && (
                <div className="space-y-2 animate-fade-in pt-2">
                  <p className="text-xs text-muted-foreground text-center pb-1">Pode selecionar mais de uma</p>
                  {complaints.map((c) => {
                    const active = selectedComplaints.has(c.id)
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleComplaint(c.id)}
                        disabled={isPlayingAudio}
                        className={`w-full backdrop-blur-sm border-2 rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${
                          active
                            ? "bg-[#4A3328]/10 border-[#4A3328]"
                            : "bg-card/90 border-border hover:border-[#4A3328]/40"
                        }`}
                      >
                        <span className="text-2xl">{c.icon}</span>
                        <span className="text-left flex-1 font-medium text-sm">{c.label}</span>
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          active ? "bg-[#4A3328] border-[#4A3328]" : "border-border"
                        }`}>
                          {active && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                      </button>
                    )
                  })}
                  {selectedComplaints.size > 0 && (
                    <button
                      onClick={handleComplaintsConfirm}
                      className="w-full bg-[#4A3328] text-white rounded-xl p-4 font-medium text-sm transition-all hover:bg-[#3a271f] active:scale-[0.98] flex items-center justify-center gap-2 mt-1"
                    >
                      Confirmar seleção
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 -rotate-45">
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {/* Detail form */}
              {chatPhase === "detail-form" && (
                <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 space-y-3 animate-fade-in">
                  <Textarea
                    placeholder="Descreva o que te incomoda, há quanto tempo, se já fez algum procedimento antes..."
                    value={generalDetails}
                    onChange={(e) => setGeneralDetails(e.target.value)}
                    className="min-h-[100px] text-sm resize-none"
                    autoFocus
                  />
                  <Button
                    onClick={handleDetailSubmit}
                    disabled={isPlayingAudio}
                    className="w-full bg-[#4A3328] hover:bg-[#3a271f] text-white"
                  >
                    Enviar
                  </Button>
                </div>
              )}

              {/* Analyzing */}
              {chatPhase === "analyzing" && (
                <div className="flex justify-center py-4">
                  <div className="flex gap-2 items-center text-muted-foreground text-sm">
                    <div className="w-2 h-2 bg-[#4A3328] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#4A3328] rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-[#4A3328] rounded-full animate-bounce delay-200" />
                    <span className="ml-1">Analisando seu perfil...</span>
                  </div>
                </div>
              )}

              {/* Service card */}
              {chatPhase === "service" && selectedComplaints.size > 0 && (() => {
                const svc = getRecommendedService()
                return (
                  <div className="space-y-3 animate-fade-in">
                    <div className="bg-card/90 backdrop-blur-sm border-2 border-[#4A3328]/30 rounded-xl p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">✨</span>
                        <div>
                          <h3 className="font-semibold text-base">{svc.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{svc.description}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{svc.longDescription}</p>
                      <Button
                        onClick={handleWhatsAppRedirect}
                        className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white"
                      >
                        Agendar minha avaliação 💬
                      </Button>
                    </div>
                  </div>
                )
              })()}

              {/* WhatsApp card */}
              {chatPhase === "whatsapp" && (
                <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-8 text-center space-y-6 animate-fade-in">
                  <div className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M11.999 0C5.373 0 0 5.373 0 12c0 2.117.554 4.1 1.522 5.828L.057 23.885a.75.75 0 00.906.974l6.218-1.635A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 11.999 0zm.001 22c-1.87 0-3.618-.504-5.122-1.383l-.369-.218-3.814 1.003 1.019-3.72-.24-.383A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-serif">Vamos agendar sua avaliação!</h3>
                  <p className="text-muted-foreground text-sm">Nossa equipe está pronta para te atender com todo carinho</p>
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
