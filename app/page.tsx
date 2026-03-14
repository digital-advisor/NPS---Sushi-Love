'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MoreVertical, Phone, Video, ArrowLeft, Check, CheckCheck } from 'lucide-react';

// --- Flow Data ---
type Step = {
  uid: number;
  type: 'question' | 'delay' | 'text' | 'sendDataWH';
  text?: string;
  question_type?: 'select' | 'number' | 'input' | 'phone';
  buttons?: { action?: number; text: string; link_url?: string }[];
  conditions?: { condition: string; from: string; to: string; action: number }[];
  connect_step_id?: number;
};

const flowData: { start_step_id: number; steps: Step[] } = {
  start_step_id: 1,
  steps: [
    {
      uid: 1,
      type: 'question',
      text: 'Olá! Obrigado por escolher o Sushi Love - Maracanaú. \n\nEsperamos que sua experiência tenha sido incrível. 🍜',
      question_type: 'select',
      buttons: [{ action: 2, text: 'Olá!' }],
    },
    { uid: 2, type: 'delay', text: '1.5', connect_step_id: 3 },
    { uid: 3, type: 'text', text: 'Para nos ajudar a melhorar, responda rapidinho:', connect_step_id: 4 },
    { uid: 4, type: 'delay', text: '2', connect_step_id: 5 },
    {
      uid: 5,
      type: 'question',
      text: 'Em uma escala de 0 a 10, o quanto você recomendaria nosso restaurante para um amigo ou familiar?',
      question_type: 'number',
      conditions: [
        { condition: 'eq', from: '9', to: '10', action: 6 },
        { condition: 'eq', from: '7', to: '8', action: 12 },
        { condition: 'eq', from: '0', to: '6', action: 18 },
      ],
    },
    { uid: 6, type: 'delay', text: '1', connect_step_id: 29 },
    { uid: 29, type: 'sendDataWH', connect_step_id: 7 },
    { uid: 7, type: 'text', text: 'Que notícia maravilhosa! 😍 Ficamos muito felizes que você tenha gostado.', connect_step_id: 8 },
    { uid: 8, type: 'delay', text: '2', connect_step_id: 9 },
    { uid: 9, type: 'text', text: 'Como sua opinião é muito importante, você poderia gastar 30 segundos para postar esse elogio no Google?\n \nIsso nos ajuda muito!', connect_step_id: 10 },
    { uid: 10, type: 'delay', text: '1.5', connect_step_id: 11 },
    {
      uid: 11,
      type: 'question',
      text: 'É só clicar no botão abaixo. 👇',
      question_type: 'select',
      buttons: [{ link_url: 'https://g.page/r/CZzfFZiEOU_lEBM/review', text: 'Avaliar no Google ⭐' }],
    },
    { uid: 12, type: 'delay', text: '1', connect_step_id: 13 },
    { uid: 13, type: 'text', text: 'Agradecemos sua sinceridade! \n\nQueremos ser nota 10 para você na próxima vez. 🙂', connect_step_id: 14 },
    { uid: 14, type: 'delay', text: '1.5', connect_step_id: 15 },
    { uid: 15, type: 'question', text: 'O que poderíamos ter feito diferente para melhorar sua experiência hoje?', question_type: 'input', connect_step_id: 24 },
    { uid: 24, type: 'sendDataWH', connect_step_id: 16 },
    { uid: 16, type: 'delay', text: '1.5', connect_step_id: 17 },
    { uid: 17, type: 'text', text: 'Entendido. \nJá encaminhei sua sugestão para nossa gerência. \n\nObrigado por nos ajudar a evoluir!', connect_step_id: 0 },
    { uid: 18, type: 'delay', text: '1', connect_step_id: 19 },
    { uid: 19, type: 'text', text: 'Poxa, sinto muito que sua experiência não tenha sido a ideal. 😔 \n\nLevamos isso muito a sério.', connect_step_id: 20 },
    { uid: 20, type: 'delay', text: '1.5', connect_step_id: 21 },
    { uid: 21, type: 'question', text: 'Poderia nos contar o que aconteceu de errado?', question_type: 'input', connect_step_id: 22 },
    { uid: 22, type: 'delay', text: '1.5', connect_step_id: 23 },
    { uid: 23, type: 'question', text: 'Recebemos sua resposta e como pedido de desculpas, gostaríamos de oferecer um cupom de 10% no seu próximo pedido para tentarmos desfazer essa má impressão. \n\nInforme seu whatsapp e receba esse cupom especial.', question_type: 'phone', connect_step_id: 28 },
    { uid: 28, type: 'sendDataWH', connect_step_id: 26 },
    { uid: 26, type: 'delay', text: '1.5', connect_step_id: 27 },
    { uid: 27, type: 'text', text: 'Muito obrigado pelo feedback. \n\nNossa equipe vai analisar o ocorrido imediatamente para que não se repita e em breve lhe enviará seu cupom pelo whatsapp.', connect_step_id: 0 },
  ],
};

// --- Components ---

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
};

const formatTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export default function WhatsAppSimulator() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStepId, setCurrentStepId] = useState<number | null>(flowData.start_step_id);
  const [isTyping, setIsTyping] = useState(false);
  const [awaitingInput, setAwaitingInput] = useState<Step | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const collectedDataRef = useRef<{
    nota?: string;
    motivo?: string;
    whatsapp?: string;
  }>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, awaitingInput]);

  useEffect(() => {
    if (currentStepId === null || currentStepId === 0) return;

    const step = flowData.steps.find((s) => s.uid === currentStepId);
    if (!step) return;

    let isCancelled = false;

    const processStep = async () => {
      if (step.type === 'delay') {
        setIsTyping(true);
        const delayMs = parseFloat(step.text || '1') * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        if (!isCancelled) {
          setIsTyping(false);
          setCurrentStepId(step.connect_step_id || 0);
        }
      } else if (step.type === 'text') {
        setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'bot', text: step.text || '', time: formatTime() }]);
        setCurrentStepId(step.connect_step_id || 0);
      } else if (step.type === 'sendDataWH') {
        const now = new Date();
        const dataToSend = {
          nota: collectedDataRef.current.nota || '',
          motivo: collectedDataRef.current.motivo || '',
          whatsapp: collectedDataRef.current.whatsapp || '',
          data: now.toLocaleDateString('pt-BR'),
          hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        
        try {
          await fetch('https://n8n-n8n.nk6i21.easypanel.host/webhook-test/sushilovemaracanau', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });
        } catch (error) {
          console.error('Erro ao enviar webhook:', error);
        }
        
        if (!isCancelled) {
          setCurrentStepId(step.connect_step_id || 0);
        }
      } else if (step.type === 'question') {
        setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'bot', text: step.text || '', time: formatTime() }]);
        setAwaitingInput(step);
        setCurrentStepId(null); // Wait for user input
      }
    };

    processStep();

    return () => {
      isCancelled = true;
    };
  }, [currentStepId]);

  const handleUserInput = (value: string, action?: number, link_url?: string) => {
    if (link_url) {
      window.open(link_url, '_blank');
      setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'user', text: value, time: formatTime() }]);
      setAwaitingInput(null);
      setCurrentStepId(0);
      return;
    }

    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'user', text: value, time: formatTime() }]);
    setAwaitingInput(null);
    setInputValue('');

    if (awaitingInput) {
      if (awaitingInput.uid === 5) collectedDataRef.current.nota = value;
      if (awaitingInput.uid === 15 || awaitingInput.uid === 21) collectedDataRef.current.motivo = value;
      if (awaitingInput.uid === 23) collectedDataRef.current.whatsapp = value;

      if (awaitingInput.question_type === 'select') {
        setCurrentStepId(action || awaitingInput.connect_step_id || 0);
      } else if (awaitingInput.question_type === 'number') {
        const num = parseInt(value, 10);
        let nextStep = awaitingInput.connect_step_id || 0;
        if (awaitingInput.conditions) {
          for (const cond of awaitingInput.conditions) {
            if (cond.condition === 'eq') {
              const from = parseInt(cond.from, 10);
              const to = parseInt(cond.to, 10);
              if (num >= from && num <= to) {
                nextStep = cond.action;
                break;
              }
            }
          }
        }
        setCurrentStepId(nextStep);
      } else {
        // input or phone
        setCurrentStepId(awaitingInput.connect_step_id || 0);
      }
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    handleUserInput(inputValue.trim());
  };

  return (
    <div className="flex items-center justify-center h-[100dvh] bg-[#e5ddd5] sm:p-4 font-sans">
      <div className="w-full max-w-md bg-[#efeae2] h-full sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative border border-gray-300">
        
        {/* WhatsApp Header */}
        <div className="bg-[#008069] text-white p-3 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
              <img 
                src="/logo.jpg" 
                alt="Sushi Love - Maracanaú Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[16px] leading-tight">Sushi Love - Maracanaú</span>
              <span className="text-[13px] text-white/80 leading-tight">
                {isTyping ? 'digitando...' : 'online'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Video size={20} className="cursor-pointer" />
            <Phone size={20} className="cursor-pointer" />
            <MoreVertical size={20} className="cursor-pointer" />
          </div>
        </div>

        {/* Chat Background Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.06] pointer-events-none z-0"
          style={{
            backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 z-10 scroll-smooth">
          {/* Date Badge */}
          <div className="flex justify-center mb-4">
            <span className="bg-[#e1f3fb] text-[#54656f] text-xs px-3 py-1 rounded-lg shadow-sm uppercase tracking-wide">
              Hoje
            </span>
          </div>

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}
              >
                <div
                  className={`relative max-w-[85%] px-3 py-2 rounded-lg shadow-sm text-[15px] leading-snug whitespace-pre-wrap ${
                    msg.sender === 'user' 
                      ? 'bg-[#dcf8c6] text-[#111b21] rounded-tr-none' 
                      : 'bg-white text-[#111b21] rounded-tl-none'
                  }`}
                >
                  {/* Tail SVG */}
                  {msg.sender === 'bot' ? (
                    <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -left-[8px] text-white fill-current">
                      <path d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.099 1.533 3.568z"></path>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -right-[8px] text-[#dcf8c6] fill-current">
                      <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.099 6.958 1 5.188 1z"></path>
                    </svg>
                  )}
                  
                  <span className="block pr-12">{msg.text}</span>
                  
                  <div className="absolute bottom-1 right-2 flex items-center gap-1">
                    <span className="text-[11px] text-[#667781]">{msg.time}</span>
                    {msg.sender === 'user' && <CheckCheck size={14} className="text-[#53bdeb]" />}
                  </div>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex justify-start w-full"
              >
                <div className="bg-white px-4 py-3 rounded-lg rounded-tl-none shadow-sm flex items-center gap-1 relative">
                  <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -left-[8px] text-white fill-current">
                    <path d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.099 1.533 3.568z"></path>
                  </svg>
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 bg-[#8696a0] rounded-full" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-[#8696a0] rounded-full" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-[#8696a0] rounded-full" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-[#f0f2f5] p-3 z-10">
          <AnimatePresence mode="wait">
            {awaitingInput ? (
              <motion.div
                key="input-controls"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full"
              >
                {awaitingInput.question_type === 'select' && awaitingInput.buttons && (
                  <div className="flex flex-col gap-2">
                    {awaitingInput.buttons.map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleUserInput(btn.text, btn.action, btn.link_url)}
                        className="w-full bg-white text-[#00a884] font-medium py-3 px-4 rounded-xl shadow-sm border border-gray-200 active:bg-gray-50 transition-colors text-[15px]"
                      >
                        {btn.text}
                      </button>
                    ))}
                  </div>
                )}

                {awaitingInput.question_type === 'number' && (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-5 gap-1.5">
                      {[10, 9, 8, 7, 6].map((num) => {
                        let colorClass = "bg-red-100 text-red-800 border-red-200 active:bg-red-200";
                        if (num >= 9) colorClass = "bg-green-100 text-green-800 border-green-200 active:bg-green-200";
                        else if (num >= 7) colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200 active:bg-yellow-200";
                        
                        return (
                          <button
                            key={num}
                            onClick={() => handleUserInput(num.toString())}
                            className={`${colorClass} font-medium py-2 rounded-lg shadow-sm border transition-colors text-sm`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {[5, 4, 3, 2, 1, 0].map((num) => {
                        let colorClass = "bg-red-100 text-red-800 border-red-200 active:bg-red-200";
                        if (num >= 9) colorClass = "bg-green-100 text-green-800 border-green-200 active:bg-green-200";
                        else if (num >= 7) colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200 active:bg-yellow-200";
                        
                        return (
                          <button
                            key={num}
                            onClick={() => handleUserInput(num.toString())}
                            className={`${colorClass} font-medium py-2 rounded-lg shadow-sm border transition-colors text-sm`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(awaitingInput.question_type === 'input' || awaitingInput.question_type === 'phone') && (
                  <form onSubmit={handleSendText} className="flex items-end gap-2">
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                      <input
                        type={awaitingInput.question_type === 'phone' ? 'tel' : 'text'}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Mensagem"
                        className="w-full py-3 px-4 outline-none text-[15px] text-[#111b21] bg-transparent"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!inputValue.trim()}
                      className={`p-3 rounded-full flex-shrink-0 transition-colors ${
                        inputValue.trim() ? 'bg-[#00a884] text-white' : 'bg-gray-300 text-gray-500'
                      }`}
                    >
                      <Send size={20} className="ml-0.5" />
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="disabled-input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 opacity-50 pointer-events-none"
              >
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 py-3 px-4">
                  <span className="text-gray-400 text-[15px]">Mensagem</span>
                </div>
                <div className="p-3 rounded-full bg-gray-300 text-gray-500">
                  <Send size={20} className="ml-0.5" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
