'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, X, Loader2 } from 'lucide-react';

interface MobileVoiceAssistantProps {
  onClose?: () => void;
  autoStart?: boolean;
}

export function MobileVoiceAssistant({ 
  onClose,
  autoStart = false 
}: MobileVoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript) {
          processCommand(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    if (autoStart) {
      startListening();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [autoStart]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setResponse('');
      recognitionRef.current.start();
      setIsListening(true);
      
      // Haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processCommand = async (command: string) => {
    setIsProcessing(true);
    
    try {
      // Send to AI for processing
      const res = await fetch('/api/ai/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });

      const data = await res.json();
      setResponse(data.response);
      
      // Speak the response
      if (data.response) {
        speakResponse(data.response);
      }
    } catch (error) {
      console.error('Error processing command:', error);
      setResponse("Sorry, I couldn't process that command.");
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <h2 className="text-xl font-bold text-white">Hey Fantasy</h2>
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={onClose}
          className="text-gray-400"
        >
          <X className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Animated Voice Wave */}
        <motion.div
          className="relative mb-8"
          animate={isListening ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 absolute inset-0 blur-xl" />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleListening}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
              isListening 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                : 'bg-gray-800 border-2 border-gray-700'
            }`}
          >
            {isListening ? (
              <MicOff className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </motion.button>
        </motion.div>

        {/* Status Text */}
        <AnimatePresence mode="wait">
          {isListening && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-gray-400 mb-4"
            >
              Listening...
            </motion.p>
          )}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-gray-400 mb-4"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </motion.div>
          )}
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-gray-400 mb-4"
            >
              <Volume2 className="w-4 h-4" />
              <span>Speaking...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcript */}
        {transcript && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 rounded-2xl p-4 mb-4 max-w-full"
          >
            <p className="text-sm text-gray-400 mb-1">You said:</p>
            <p className="text-white">{transcript}</p>
          </motion.div>
        )}

        {/* Response */}
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-900/30 border border-blue-800 rounded-2xl p-4 max-w-full"
          >
            <p className="text-sm text-blue-400 mb-1">Fantasy.AI says:</p>
            <p className="text-white">{response}</p>
          </motion.div>
        )}
      </div>

      {/* Sample Commands */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <p className="text-xs text-gray-500 mb-2">Try saying:</p>
        <div className="flex flex-wrap gap-2">
          {[
            "Who should I start?",
            "Check injuries",
            "Optimize my lineup",
            "Trade suggestions"
          ].map((command) => (
            <motion.button
              key={command}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setTranscript(command);
                processCommand(command);
              }}
              className="bg-gray-800 text-xs text-gray-300 px-3 py-1 rounded-full"
            >
              {command}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}