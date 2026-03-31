"use client"

import { useState, useEffect, useRef } from "react"
import { Volume2 } from "lucide-react"
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

const testimonials = [
  {
    id: 1,
    name: "Ana Paula",
    text: "Mudou completamente minha autoestima. A Dra. Débora é sensacional!",
    treatment: "Harmonização Facial",
  },
  {
    id: 2,
    name: "Juliana",
    text: "Finalmente entendi o que estava causando meu cansaço. Tratamento transformador.",
    treatment: "Ortomolecular",
  },
  {
    id: 3,
    name: "Mariana",
    text: "Ambiente acolhedor e resultados incríveis. Super recomendo!",
    treatment: "Rejuvenescimento Facial",
  },
]

export default function NatuclinicFunnel() {
  const [step, setStep] = useState<"video" | "chat">("video")
  const [chatPhase, setChatPhase] = useState<
    | "welcome"
    | "complaint-question"
    | "complaint-selection"
    | "detail-question"
    | "detail-form"
    | "analyzing"
    | "service"
    | "testimonials"
    | "whatsapp"
  >("welcome")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [videoEnded, setVideoEnded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [currentServicePage, setCurrentServicePage] = useState(0)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const pencilSoundRef = useRef<HTMLAudioElement | null>(null)

  const [duration, setDuration] = useState("")
  const [interference, setInterference] = useState("")
  const [recentExams, setRecentExams] = useState("")
  const [faceIssue, setFaceIssue] = useState("")
  const [previousProcedure, setPreviousProcedure] = useState("")
  const [generalDetails, setGeneralDetails] = useState("")

  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause()
    }
    setIsPlayingAudio(false)
  }

  const playAudio = (url: string, onEnd?: () => void) => {
    stopAllAudio()

    const audio = new Audio(url)
    audioRef.current = audio
    setIsPlayingAudio(true)

    audio.addEventListener("ended", () => {
      setIsPlayingAudio(false)
      if (backgroundMusicRef.current && backgroundMusicRef.current.paused) {
        backgroundMusicRef.current.play().catch(() => {})
      }
      if (onEnd) onEnd()
    })

    if (backgroundMusicRef.current && !backgroundMusicRef.current.paused) {
      backgroundMusicRef.current.pause()
    }

    audio.play().catch((err) => {
      console.error("[v0] Audio playback failed:", err)
      setIsPlayingAudio(false)
      if (onEnd) onEnd()
    })
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
    const pencil = new Audio(
      "/pencil-writing.mp3",
    )
    pencil.volume = 0.5
    pencil.play().catch(() => {})
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
  }

  const startChat = () => {
    if (isPlayingAudio) return
    setStep("chat")

    setTimeout(() => {
      addDoctorMessage(
        "Olá! Eu sou a Dra. Débora. Vou te fazer algumas perguntas para entender melhor como posso te ajudar.",
        undefined,
        500,
      )

      setTimeout(() => {
        setChatPhase("complaint-question")
        addDoctorMessage(
          "O que você sente que precisa de cuidado neste momento?",
          "/oque-mais-incomoda.mp3",
          2000,
        )

        setTimeout(() => {
          setChatPhase("complaint-selection")
        }, 3000)
      }, 2000)
    }, 500)
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
          "/avaliando.mp3",
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
    setChatPhase("testimonials")
  }

  const handleTestimonialsNext = () => {
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
    const message = `Olá! Passei pela consulta digital da Dra. Débora na Natuclinic e fui orientada sobre ${service.title}. Gostaria de agendar minha consulta!`

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/5561992551867?text=${encodedMessage}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-background">
      {step === "video" && (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-pink-50 to-orange-50">
          {!videoError && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              onEnded={handleVideoEnded}
              onError={handleVideoError}
            >
              <source
                src="/IMG_3624.mov"
                type="video/mp4"
              />
            </video>
          )}

          {/* Always show overlay and content */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/60" />

          <div className="relative z-10 text-center px-6 max-w-3xl space-y-8">
            <h1 className="text-5xl md:text-7xl font-serif text-balance leading-tight text-foreground">Bem-vinda à Natuclinic</h1>
            <p className="text-2xl md:text-3xl font-light text-primary">Instituto de Estética Integrativa</p>

            <div className="flex flex-col items-center gap-4 mt-12">
              {!videoEnded && !videoError && (
                <Button 
                  variant="ghost" 
                  onClick={handleSkipVideo} 
                  className="text-muted-foreground hover:text-foreground"
                >
                  Pular video
                </Button>
              )}
              
              <Button 
                size="lg" 
                onClick={startChat} 
                className="px-12 py-7 text-lg font-medium"
                disabled={isPlayingAudio}
              >
                Comecar minha avaliacao
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === "chat" && (
        <div className="min-h-screen bg-background relative">
          <div className="relative z-10 min-h-screen flex flex-col">
            <div className="bg-card/80 backdrop-blur-md border-b border-border/50 p-4">
              <div className="max-w-4xl mx-auto flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  <img src="/debora-074.jpg" alt="Dra. Débora" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="font-semibold">Dra. Débora - Natuclinic</h2>
                  <p className="text-xs text-muted-foreground">online</p>
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
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-card/90 backdrop-blur-sm border border-border rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm md:text-base leading-relaxed">{message.content}</p>

                      {message.audioUrl && isPlayingAudio && audioRef.current?.src === message.audioUrl && (
                        <div className="flex items-center gap-1 mt-2">
                          <Volume2 className="w-4 h-4 text-primary" />
                          <div className="flex gap-0.5 items-center">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className="w-0.5 bg-primary rounded-full animate-soundwave"
                                style={{
                                  height: `${Math.random() * 12 + 4}px`,
                                  animationDelay: `${i * 0.1}s`,
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
                    <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
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
                      <div className="relative h-64 md:h-80">
                        <img
                          src={services[selectedComplaint].imageUrl || "/placeholder.svg"}
                          alt={services[selectedComplaint].title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                          <h2 className="text-3xl md:text-4xl font-serif text-white mb-2">
                            {services[selectedComplaint].title}
                          </h2>
                          <p className="text-white/90">{services[selectedComplaint].description}</p>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        <p className="text-lg leading-relaxed">{services[selectedComplaint].longDescription}</p>

                        {!isPlayingAudio && (
                          <Button onClick={handleServiceNext} className="w-full" size="lg">
                            Continuar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {chatPhase === "testimonials" && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-6">
                      <h3 className="text-2xl font-serif mb-6 text-center">Veja o que nossas pacientes dizem</h3>

                      <div className="space-y-4">
                        {testimonials.map((testimonial) => (
                          <div key={testimonial.id} className="bg-muted/30 rounded-lg p-4 border border-border/50">
                            <p className="italic mb-2">"{testimonial.text}"</p>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                              <span className="font-medium">{testimonial.name}</span>
                              <span>{testimonial.treatment}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {!isPlayingAudio && (
                        <Button onClick={handleTestimonialsNext} className="w-full mt-6" size="lg">
                          Agendar minha consulta
                        </Button>
                      )}
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
