"use client"

import { useState, useEffect, useRef } from "react"
import { Volume2, VolumeX, Phone, Video, CheckCheck, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Complaint = "cansaco" | "vitaminas" | "rosto" | "harmonizacao-facial" | "corpo" | "estetica-intima" | "gluteos" | "melasma"

type ChatMessage = {
  id: string
  type: "doctor" | "user"
  content: string
  audioUrl?: string
  timestamp: Date
}

type Service = {
  id: string
  title: string
  description: string
  longDescription: string
  audioUrl: string
  imageUrl: string
}

const services: Record<Complaint, Service> = {
  cansaco: {
    id: "ortomolecular",
    title: "Consulta Ortomolecular",
    description: "Avaliação completa do seu equilíbrio metabólico",
    longDescription:
      "Nesse cuidado, nós avaliamos seu corpo de forma completa para entender a origem do que você está sentindo.",
    audioUrl:
      "/consulta-ortomolecular.mp3",
    imageUrl:
      "/clinic-ortomolecular.jpg",
  },
  vitaminas: {
    id: "reposicao-vitaminas",
    title: "Reposição de Vitaminas",
    description: "Tratamento personalizado para devolver vitalidade",
    longDescription: "Aqui trabalhamos com reposição personalizada para restaurar sua energia e disposição.",
    audioUrl:
      "/reposicao-vitaminas.mp3",
    imageUrl:
      "/clinic-vitaminas.jpg",
  },
  rosto: {
    id: "rejuvenescimento",
    title: "Rejuvenescimento Facial",
    description: "Protocolos avançados para restaurar luminosidade",
    longDescription:
      "Esse é um tratamento que devolve vida e luz para o seu rosto, trabalhando as camadas mais profundas da pele.",
    audioUrl:
      "/rejuvenescimento.mp3",
    imageUrl:
      "/clinic-rejuvenescimento.jpg",
  },
  "harmonizacao-facial": {
    id: "harmonizacao-facial",
    title: "Harmonização Facial",
    description: "Técnicas refinadas para realçar sua beleza natural",
    longDescription: "Aqui trabalhamos com técnicas de harmonização que respeitam e realçam sua beleza única.",
    audioUrl:
      "/harmonizacao-facial.mp3",
    imageUrl:
      "/clinic-harmonizacao.jpg",
  },
  corpo: {
    id: "harmonizacao-corporal",
    title: "Harmonização Corporal",
    description: "Cuidado integral para esculpir suas curvas naturais",
    longDescription: "Esse cuidado trabalha o corpo de forma completa, respeitando sua forma natural.",
    audioUrl:
      "/harmonizacao-corporal.mp3",
    imageUrl: "/clinic-corpo.jpg",
  },
  "estetica-intima": {
    id: "estetica-intima",
    title: "Estética Íntima",
    description: "Tratamentos delicados para seu bem-estar",
    longDescription: "Um cuidado delicado e privativo, pensado especialmente para seu conforto e autoconfiança.",
    audioUrl:
      "/estetica-intima.mp3",
    imageUrl: "/clinic-intima.jpg",
  },
  gluteos: {
    id: "harmonizacao-gluteos",
    title: "Harmonização de Glúteos",
    description: "Procedimentos avançados para remodelamento e aumento",
    longDescription: "Um tratamento exclusivo focado em realçar e harmonizar os glúteos de forma segura e elegante.",
    audioUrl: "/harmonizacao-gluteos.mp3",
    imageUrl: "/clinic-gluteos.jpg",
  },
  melasma: {
    id: "tratamento-melasma",
    title: "Tratamento para Melasma",
    description: "Protocolos despigmentantes para uniformizar a pele e tratar manchas",
    longDescription: "Abordagem especializada e progressiva para controle do melasma e clareamento da pele, devolvendo o brilho natural.",
    audioUrl: "/tratamento-melasma.mp3",
    imageUrl: "/clinic-melasma.jpg",
  },
}

const complaints = [
  {
    id: "cansaco" as Complaint,
    label: "Cansaço / baixa energia",
    icon: "⚡",
    image: "/queixa-cansaco.jpg",
  },
  {
    id: "vitaminas" as Complaint,
    label: "Falta de vitaminas",
    icon: "💊",
    image: "/queixa-vitaminas.jpg",
  },
  {
    id: "rosto" as Complaint,
    label: "Rosto cansado / envelhecimento",
    icon: "✨",
    image: "/queixa-rosto.jpg",
  },
  {
    id: "harmonizacao-facial" as Complaint,
    label: "Desejo de harmonização facial",
    icon: "💎",
    image:
      "/queixa-harmonizacao.jpg",
  },
  {
    id: "corpo" as Complaint,
    label: "Insatisfação corporal",
    icon: "🌸",
    image: "/queixa-corpo.jpg",
  },
  {
    id: "estetica-intima" as Complaint,
    label: "Estética íntima",
    icon: "🌺",
    image: "/queixa-intima.jpg",
  },
  {
    id: "gluteos" as Complaint,
    label: "Harmonização de Glúteos",
    icon: "🍑",
    image: "/queixa-gluteos.jpg",
  },
  {
    id: "melasma" as Complaint,
    label: "Tratamento para Melasma",
    icon: "☀️",
    image: "/queixa-melasma.jpg",
  },
]

export default function NatuclinicFunnel() {
  const [step, setStep] = useState<"video" | "chat">("video")
  const [chatPhase, setChatPhase] = useState<
    | "welcome"
    | "name-question"
    | "name-input"
    | "phone-question"
    | "phone-input"
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
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [videoEnded, setVideoEnded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [currentServicePage, setCurrentServicePage] = useState(0)
  const [userName, setUserName] = useState("")
  const [userPhone, setUserPhone] = useState("")
  const [videoProgress, setVideoProgress] = useState(0)
  const [showVideoControls, setShowVideoControls] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const pencilSoundRef = useRef<HTMLAudioElement | null>(null)
  const audioQueueRef = useRef<{ url: string; onEnd?: () => void }[]>([])

  useEffect(() => {
    if (step === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }, [step])

  const startAudio = (url: string, onEnd?: () => void) => {
    const audio = new Audio(url)
    audioRef.current = audio
    setIsPlayingAudio(true)

    if (backgroundMusicRef.current && !backgroundMusicRef.current.paused) {
      backgroundMusicRef.current.pause()
    }

    const handleEnd = () => {
      if (onEnd) onEnd()
      
      // Process next in queue
      if (audioQueueRef.current.length > 0) {
        const next = audioQueueRef.current.shift()!
        startAudio(next.url, next.onEnd)
      } else {
        setIsPlayingAudio(false)
        if (backgroundMusicRef.current && backgroundMusicRef.current.paused) {
          backgroundMusicRef.current.play().catch(() => {})
        }
      }
    }

    audio.addEventListener("ended", handleEnd)
    
    audio.addEventListener("error", (err) => {
      console.warn("[Natuclinic] Audio error:", url, err)
      handleEnd()
    })

    audio.play().catch((err) => {
      console.warn("[Natuclinic] Play failed:", url, err)
      handleEnd()
    })
  }


  const [duration, setDuration] = useState("")
  const [interference, setInterference] = useState("")
  const [recentExams, setRecentExams] = useState("")
  const [faceIssue, setFaceIssue] = useState("")
  const [previousProcedure, setPreviousProcedure] = useState("")
  const [generalDetails, setGeneralDetails] = useState("")

  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
      audioRef.current = null
    }
    if (pencilSoundRef.current) {
      pencilSoundRef.current.pause()
      pencilSoundRef.current.src = ""
      pencilSoundRef.current = null
    }
    audioQueueRef.current = [] // Clear the queue
    setIsPlayingAudio(false)
  }

  const playAudio = (url: string, onEnd?: () => void) => {
    if (isPlayingAudio) {
      audioQueueRef.current.push({ url, onEnd })
    } else {
      startAudio(url, onEnd)
    }
  }

  const playBackgroundMusic = () => {
    if (!backgroundMusicRef.current) {
      const bgMusic = new Audio(
        "/background-music.mp3",
      )
      bgMusic.loop = true
      bgMusic.volume = 0.2
      backgroundMusicRef.current = bgMusic
    }

    backgroundMusicRef.current.play().catch(() => {})
  }

  const playPencilSound = () => {
    if (pencilSoundRef.current) {
      pencilSoundRef.current.pause()
      pencilSoundRef.current.currentTime = 0
    }
    const pencil = new Audio("/pencil-writing.mp3")
    pencil.volume = 0.5
    pencilSoundRef.current = pencil
    pencil.play().catch(() => {
      console.warn("[Natuclinic] Pencil sound missing")
    })
  }

  const playNotificationSound = () => {
    const notification = new Audio("/notification.mp3")
    notification.volume = 0.4
    notification.play().catch(() => {
      console.warn("[Natuclinic] Notification sound missing")
    })
  }

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted
      videoRef.current.muted = newMutedState
      setIsMuted(newMutedState)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(err => console.error("Error playing video:", err))
      } else {
        videoRef.current.pause()
      }
    }
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
        playNotificationSound()
        setIsTyping(false)

        if (audioUrl) {
          setTimeout(() => {
            playAudio(audioUrl)
          }, 500)
        }
      }, delay)
    }, 300)
  }

  const addUserMessage = (content: string) => {
    playPencilSound()

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleVideoEnded = () => {
    setVideoEnded(true)
    setShowVideoControls(true)
    playAudio(
      "/avaliacao-corpo.mp3",
      () => {
        playBackgroundMusic()
      },
    )
  }

  const handleVideoError = () => {
    setVideoError(true)
    setVideoEnded(true)
  }

  const handleSkipVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
    setVideoEnded(true)
    setShowVideoControls(true)
  }

  const startChat = () => {
    if (isPlayingAudio) return
    setStep("chat")

    setTimeout(() => {
      setChatPhase("name-question")
      addDoctorMessage(
        "Olá! Eu sou a Dra. Débora. Antes de começarmos, como você gostaria de ser chamado(a)?",
        undefined,
        500,
      )

      setTimeout(() => {
        setChatPhase("name-input")
      }, 2000)
    }, 500)
  }

  const handleNameSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!userName.trim() || isPlayingAudio) return

    addUserMessage(userName.trim())
    setChatPhase("phone-question")

    setTimeout(() => {
      addDoctorMessage(
        `Prazer em te conhecer, ${userName.trim()}! Para que eu possa salvar seu contato, qual o seu melhor número de WhatsApp?`,
        undefined,
        1500,
      )

      setTimeout(() => {
        setChatPhase("phone-input")
      }, 2000)
    }, 1000)
  }

  const handlePhoneSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const cleanPhone = userPhone.replace(/\D/g, "")
    if (cleanPhone.length < 10 || isPlayingAudio) return

    addUserMessage(userPhone)
    setChatPhase("complaint-question")

    setTimeout(() => {
      addDoctorMessage(
        "Ótimo! Agora vamos falar sobre o que te trouxe aqui.",
        undefined,
        1500,
      )

      setTimeout(() => {
        addDoctorMessage(
          "O que você sente que precisa de cuidado neste momento?",
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
      if (numbers.length > 7) masked = "(" + numbers.substring(0, 2) + ") " + numbers.substring(2, 7) + "-" + numbers.substring(7, 11)
      return masked
    }
    return value.substring(0, 15)
  }

  const handleComplaintSelect = (complaint: Complaint) => {
    if (isPlayingAudio) return

    setSelectedComplaint(complaint)
    const complaintLabel = complaints.find((c) => c.id === complaint)?.label || ""

    addUserMessage(complaintLabel)

    setChatPhase("detail-question")

    setTimeout(() => {
      addDoctorMessage(
        "Perfeito! Estou anotando aqui...",
        "/perfeito-estou-anotando.mp3",
      )

      setTimeout(() => {
        addDoctorMessage(
          "Agora preciso de alguns detalhes para te orientar melhor. Pode responder com calma.",
          "/detalhes.mp3",
        )

        setTimeout(() => {
          if (!isPlayingAudio) {
            setChatPhase("detail-form")
          }
        }, 6000)
      }, 3000)
    }, 1500)
  }

  const handleDetailSubmit = () => {
    if (isPlayingAudio) return

    let detailSummary = ""

    if (selectedComplaint === "cansaco" || selectedComplaint === "vitaminas") {
      detailSummary = `Sintomas há ${duration}, ${interference === "sim" ? "interfere na rotina" : "não interfere na rotina"}`
    } else if (selectedComplaint === "rosto" || selectedComplaint === "harmonizacao-facial") {
      detailSummary = `${previousProcedure === "sim" ? "Já fez procedimento" : "Primeiro procedimento"}`
    } else {
      detailSummary = "Detalhes compartilhados"
    }

    const complaintLabel = complaints.find((c) => c.id === selectedComplaint)?.label || ""
    const fullDetails = `${detailSummary}. Notas: ${recentExams || faceIssue || generalDetails || "Nenhuma nota adicional"}`

    fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: userName,
        phone: userPhone,
        complaint: complaintLabel,
        details: fullDetails,
      }),
    }).catch((err) => console.error("Error sending lead:", err))

    addUserMessage(detailSummary)

    setChatPhase("analyzing")
    setTimeout(() => {
      addDoctorMessage(
        "Obrigada! Com isso consigo te orientar melhor.",
        "/obrigada-com-isso-consigo-te-orientar-melhor.mp3",
      )

      setTimeout(() => {
        addDoctorMessage(
          "Deixa eu analisar tudo que você me contou...",
          undefined,
        )

        setTimeout(() => {
          if (!isPlayingAudio) {
            setChatPhase("service")
          }
        }, 5000)
      }, 3000)
    }, 1000)
  }

  const handleServiceNext = () => {
    if (isPlayingAudio) return

    addDoctorMessage(
      "Agora vou te encaminhar para nossa equipe finalizar seu agendamento!",
      "/certo-agora-vou-te-encaminhar.mp3",
    )

    setTimeout(() => {
      if (!isPlayingAudio) {
        setChatPhase("whatsapp")
      }
    }, 5000)
  }

  const handleWhatsAppRedirect = () => {
    if (!selectedComplaint || isPlayingAudio) return

    const service = services[selectedComplaint]
    const message = `Olá! Passei pela consulta digital da Dra. Débora na Natuclinic e fui orientado(a) sobre ${service.title}. Gostaria de agendar minha consulta!`

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/5561992551867?text=${encodedMessage}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-background">
      {step === "video" && (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black font-sans">
          <div className="relative w-full max-w-[450px] h-full md:h-[90vh] md:rounded-3xl overflow-hidden shadow-2xl bg-black aspect-[9/16]">
            {!videoError && (
              <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMuted}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${videoEnded ? 'blur-md brightness-50' : ''}`}
              onEnded={handleVideoEnded}
              onError={handleVideoError}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  const current = videoRef.current.currentTime
                  const total = videoRef.current.duration
                  setVideoProgress((current / total) * 100)
                  
                  if (total - current <= 2) {
                    setShowVideoControls(true)
                  }
                }
              }}
            >
              <source
                src="/IMG_3624.mov"
                type="video/mp4"
              />
            </video>
          )}

          {/* Stories Progress Bar */}
          <div className="absolute top-6 left-6 right-6 z-30 flex gap-1">
            <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear" 
                style={{ width: `${videoProgress}%` }}
              />
            </div>
          </div>

          {/* Top Control Buttons */}
          <div className="absolute top-10 left-6 right-6 z-30 flex justify-between items-center">
            <button 
              onClick={toggleMute} 
              className="text-white/80 hover:text-white bg-black/20 backdrop-blur-sm p-3 rounded-full transition-all"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {!videoEnded && !videoError && (
              <button 
                onClick={handleSkipVideo} 
                className="text-white/80 hover:text-white text-sm font-medium bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full transition-all"
              >
                Pular
              </button>
            )}
          </div>

          {/* Central Play Button (for iOS/Autoplay blocked) */}
          {!isPlaying && !videoEnded && !videoError && (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <button 
                onClick={togglePlay}
                className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all border border-white/30"
              >
                <Play className="w-10 h-10 fill-current" />
              </button>
            </div>
          )}

          {/* Always show overlay and content */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

          <div className={`relative z-10 text-center px-6 max-w-lg mx-auto flex flex-col h-full justify-center space-y-6 transition-all duration-500 ${
            showVideoControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
          }`}>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-serif text-white drop-shadow-lg">Bem-vindo(a) à Natuclinic</h1>
              <p className="text-lg md:text-xl font-light text-white/90">Instituto de Estética Integrativa</p>
            </div>

            <Button 
              size="lg" 
              onClick={startChat} 
              className="w-full py-7 text-lg font-medium bg-white text-[#4A3328] hover:bg-white/90 border-none shadow-xl"
              disabled={isPlayingAudio}
            >
              Começar minha avaliação
            </Button>
          </div>
          </div>
        </div>
      )}

      {step === "chat" && (
        <div className="min-h-screen bg-background relative">
          <div className="relative z-10 min-h-screen flex flex-col">
            <div className="bg-[#4A3328] text-white shadow-sm border-b border-[#3a271f] p-4">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
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

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 pb-32">
              <div className="max-w-4xl mx-auto space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.type === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-card/90 backdrop-blur-sm border border-border rounded-bl-none"
                      }`}
                    >
                      <div className="flex flex-col">
                        <p className="text-sm md:text-base leading-relaxed">{message.content}</p>
                        {message.type === "user" && (
                          <div className="flex justify-end items-center gap-1 mt-1 -mb-1 opacity-70">
                            <span className="text-[10px]">agora</span>
                            <CheckCheck className="w-4 h-4 text-blue-500" />
                          </div>
                        )}
                      </div>

                      {message.audioUrl && (
                        <div className="flex items-center gap-1">
                          <Volume2 className={`w-4 h-4 ${isPlayingAudio && audioRef.current?.src === message.audioUrl ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                          <div className="flex gap-0.5 items-center">
                            {[...Array(15)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-0.5 bg-primary rounded-full ${isPlayingAudio && audioRef.current?.src === message.audioUrl ? "animate-soundwave" : ""}`}
                                style={{
                                  height: `${Math.random() * 12 + 8}px`,
                                  animationDelay: `${i * 0.1}s`,
                                  opacity: (isPlayingAudio && audioRef.current?.src === message.audioUrl) ? 1 : 0.4
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

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
                      <Button type="submit" disabled={!userName.trim() || isPlayingAudio} className="w-full text-base" size="lg">
                        Continuar
                      </Button>
                    </form>
                  </div>
                )}

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
                        <p className="text-[10px] text-muted-foreground">Insira o DDD e o número completo</p>
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

                {chatPhase === "complaint-selection" && !isPlayingAudio && (
                  <div className="space-y-3 animate-fade-in pt-4">
                    {complaints.map((complaint) => (
                      <button
                        key={complaint.id}
                        onClick={() => handleComplaintSelect(complaint.id)}
                        disabled={isPlayingAudio}
                        className="w-full bg-card/90 backdrop-blur-sm border-2 border-border hover:border-primary/50 rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >

                        <span className="text-2xl flex-shrink-0">{complaint.icon}</span>
                        <span className="text-left flex-1">{complaint.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {chatPhase === "detail-form" && !isPlayingAudio && selectedComplaint && (
                  <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-6 space-y-6 animate-fade-in">
                    {(selectedComplaint === "cansaco" || selectedComplaint === "vitaminas") && (
                      <>
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Há quanto tempo você se sente assim?</label>
                          <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="semanas">Algumas semanas</SelectItem>
                              <SelectItem value="meses">Alguns meses</SelectItem>
                              <SelectItem value="anos">Mais de um ano</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-medium">Isso interfere na sua rotina?</label>
                          <RadioGroup value={interference} onValueChange={setInterference}>
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
                          <label className="text-sm font-medium">Já fez exames recentemente?</label>
                          <Textarea
                            value={recentExams}
                            onChange={(e) => setRecentExams(e.target.value)}
                            placeholder="Conte um pouco sobre..."
                            className="min-h-[100px]"
                          />
                        </div>
                      </>
                    )}

                    {(selectedComplaint === "rosto" || selectedComplaint === "harmonizacao-facial") && (
                      <>
                        <div className="space-y-3">
                          <label className="text-sm font-medium">O que mais te incomoda?</label>
                          <Textarea
                            value={faceIssue}
                            onChange={(e) => setFaceIssue(e.target.value)}
                            placeholder="Descreva o que você gostaria de melhorar..."
                            className="min-h-[100px]"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-medium">Já realizou algum procedimento antes?</label>
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

                    {!["cansaco", "vitaminas", "rosto", "harmonizacao-facial"].includes(selectedComplaint) && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium">
                          Conte um pouco mais sobre o que você está buscando
                        </label>
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

                        {!isPlayingAudio && (
                          <Button onClick={handleServiceNext} className="w-full py-6 text-lg" size="lg">
                            Continuar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {chatPhase === "whatsapp" && (
                  <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-8 text-center space-y-6 animate-fade-in">
                    <div className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    </div>

                    <h3 className="text-2xl font-serif">Vamos finalizar seu agendamento!</h3>
                    <p className="text-muted-foreground">
                      Nossa equipe já está preparada para te atender com todo carinho
                    </p>

                    {!isPlayingAudio && (
                      <Button
                        onClick={handleWhatsAppRedirect}
                        size="lg"
                        className="bg-[#25D366] hover:bg-[#20BA5A] text-white"
                      >
                        Falar no WhatsApp
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
