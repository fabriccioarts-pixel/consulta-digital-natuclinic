"use client"

import { useState, useEffect, useRef } from "react"
import { Volume2, VolumeX, Phone, Video, CheckCheck, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ChatMessage {
  id: string
  type: "doctor" | "user"
  content: string
  audioUrl?: string
  timestamp: Date
}

type Complaint = "cansaco" | "vitaminas" | "rosto" | "harmonizacao-facial" | "outro"

interface ServiceInfo {
  title: string
  description: string
  longDescription: string
}

const complaints: { id: Complaint; label: string; icon: string }[] = [
  { id: "cansaco", label: "Cansaço e falta de energia", icon: "😴" },
  { id: "vitaminas", label: "Reposição de Vitaminas", icon: "💊" },
  { id: "rosto", label: "Estética Facial (Botox/Preenchimento)", icon: "✨" },
  { id: "harmonizacao-facial", label: "Harmonização Facial", icon: "📐" },
  { id: "outro", label: "Outros Assuntos", icon: "🔍" },
]

const services: Record<Complaint, ServiceInfo> = {
  cansaco: {
    title: "Protocolo de Energia e Vitalidade",
    description: "Recupere seu vigor e disposição diária",
    longDescription: "Nosso protocolo foca na otimização mitocondrial e reposição de nutrientes essenciais para combater a fadiga crônica e desânimo."
  },
  vitaminas: {
    title: "Soroterapia Personalizada",
    description: "Nutrientes diretamente na veia para 100% de absorção",
    longDescription: "Doses otimizadas de vitaminas, minerais e aminoácidos para imunidade, performance e saúde celular."
  },
  rosto: {
    title: "Estética Avançada",
    description: "Realce sua beleza natural com sutileza",
    longDescription: "Tratamentos injetáveis focados em rejuvenescimento, suavização de linhas e melhora da qualidade da pele."
  },
  "harmonizacao-facial": {
    title: "Harmonização Facial Integrativa",
    description: "Equilíbrio e proporção com foco na saúde",
    longDescription: "Planejamento estrutural do rosto buscando harmonia entre os traços e preservação da identidade."
  },
  outro: {
    title: "Consulta de Avaliação Global",
    description: "Uma análise completa da sua saúde e estética",
    longDescription: "Análise 360º para entender suas necessidades específicas e traçar o melhor plano de tratamento."
  }
}

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
  const [userName, setUserName] = useState("")
  const [userPhone, setUserPhone] = useState("")
  const [videoProgress, setVideoProgress] = useState(0)
  const [showVideoControls, setShowVideoControls] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [currentPlayingUrl, setCurrentPlayingUrl] = useState<string | null>(null)

  const [duration, setDuration] = useState("")
  const [interference, setInterference] = useState("")
  const [recentExams, setRecentExams] = useState("")
  const [faceIssue, setFaceIssue] = useState("")
  const [previousProcedure, setPreviousProcedure] = useState("")
  const [generalDetails, setGeneralDetails] = useState("")

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const pencilSoundRef = useRef<HTMLAudioElement | null>(null)
  const sfxRef = useRef<HTMLAudioElement | null>(null)
  const audioQueueRef = useRef<{ url: string; onEnd?: () => void }[]>([])

  useEffect(() => {
    if (step === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }, [step])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, isTyping])

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

  const playReceiveSound = () => {
    if (!sfxRef.current) sfxRef.current = new Audio()
    sfxRef.current.src = encodeURI("/receive notification.mp3")
    sfxRef.current.volume = 0.4
    sfxRef.current.play().catch(() => {
      console.warn("[Natuclinic] Receive notification sound missing")
    })
  }

  const playSendSound = () => {
    if (!sfxRef.current) sfxRef.current = new Audio()
    sfxRef.current.src = encodeURI("/send notification.mp3")
    sfxRef.current.volume = 0.4
    sfxRef.current.play().catch(() => {
      console.warn("[Natuclinic] Send notification sound missing")
    })
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

  const startChat = () => {
    if (isPlayingAudio) return
    setStep("chat")
    
    if (audioRef.current) {
      audioRef.current.play().catch(() => {})
      audioRef.current.pause()
    }
    if (sfxRef.current) {
      sfxRef.current.play().catch(() => {})
      sfxRef.current.pause()
    }
    
    playBackgroundMusic()

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
    }, 1000)
  }

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
    if (userPhone.replace(/\D/g, "").length < 10 || isPlayingAudio) return

    addUserMessage(userPhone)
    setChatPhase("complaint-question")

    setTimeout(() => {
      addDoctorMessage("Obrigada! Já salvei aqui.")
      
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
        }, (complaint === "outro") ? 2000 : 6000)
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

    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: userName,
        phone: userPhone,
        complaint: complaintLabel,
        details: fullDetails,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          console.log("Lead notified")
        }
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
        addDoctorMessage(
          "Deixa eu analisar tudo que você me contou...",
          undefined,
        )

        setTimeout(() => {
          setChatPhase("service")
        }, 3000)
      }, 2500)
    }, 1500)
  }

  const handleServiceNext = () => {
    if (isPlayingAudio) return
    setChatPhase("whatsapp")
    
    setTimeout(() => {
       addDoctorMessage(
         "Certo! Agora vou te encaminhar para o agendamento no meu WhatsApp para finalizarmos tudo por lá.",
         "/certo-agora-vou-te-encaminhar.mp3",
       )
    }, 1000)
  }

  const handleWhatsAppRedirect = () => {
    if (!selectedComplaint || isPlayingAudio) return

    const service = services[selectedComplaint]
    const message = `Olá! Meu nome é ${userName}. Completei minha avaliação na Natuclinic sobre ${service.title}. Meus dados: ${userPhone}. Gostaria de agendar agora!`

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/5561992551867?text=${encodedMessage}`, "_blank")
  }

  const handleDirectWhatsApp = () => {
    const message = "Olá Natuclinic! Vim pelo site e gostaria de falar com vocês diretamente."
    window.open(`https://wa.me/5561992551867?text=${encodeURIComponent(message)}`, "_blank")
  }

  const handleSkipVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = videoRef.current.duration - 0.1
    }
  }

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
    setShowVideoControls(true)
    setVideoEnded(true)
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }

  const addUserMessage = (content: string) => {
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
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${videoEnded ? "blur-md brightness-50" : ""}`}
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
                <source src="/IMG_3624.mov" type="video/mp4" />
              </video>
            )}

            <div className="absolute top-6 left-6 right-6 z-30 flex gap-1">
              <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            </div>

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

            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

            <div
              className={`relative z-10 text-center px-6 max-w-lg mx-auto flex flex-col h-full justify-center space-y-6 transition-all duration-500 ${
                showVideoControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
              }`}
            >
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
                              const barWidth = isActive ? `${audioProgress}%` : "0%"
                              return (
                                <div
                                  className="absolute inset-y-0 left-0 bg-[#8E3A4D] transition-all duration-300"
                                  style={{
                                    width: barWidth,
                                    boxShadow: isActive ? "0 0 12px rgba(142, 58, 77, 0.4)" : "none"
                                  }}
                                />
                              )
                            })()}
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
                        <label className="text-sm font-medium">O que mais te incomoda?</label>
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

                {chatPhase === "analyzing" && (
                  <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-8 text-center space-y-6 animate-fade-in">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <h3 className="text-2xl font-serif">Analisando suas respostas...</h3>
                    <p className="text-muted-foreground">Estou preparando a melhor recomendação para o seu caso.</p>
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
                        <Button onClick={handleServiceNext} disabled={isPlayingAudio} className="w-full py-6 text-lg" size="lg">
                          Continuar
                        </Button>
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
                    <p className="text-muted-foreground">Nossa equipe já está preparada para te atender com todo carinho</p>
                    <Button onClick={handleWhatsAppRedirect} size="lg" className="bg-[#25D366] hover:bg-[#20BA5A] text-white">
                      Falar no WhatsApp
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botão Flutuante do WhatsApp */}
      <button
        onClick={handleDirectWhatsApp}
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 animate-pulse group"
        aria-label="Falar no WhatsApp"
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
        <span className="absolute right-full mr-3 bg-white text-[#25D366] px-3 py-1.5 rounded-lg text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Fale conosco aqui!
        </span>
      </button>
      {/* Botão Flutuante do WhatsApp */}
      <button
        onClick={handleDirectWhatsApp}
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 animate-pulse group"
        aria-label="Falar no WhatsApp"
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
        <span className="absolute right-full mr-3 bg-white text-[#25D366] px-3 py-1.5 rounded-lg text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Fale conosco aqui!
        </span>
      </button>
    </div>
  )
}
