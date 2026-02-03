/*
 * MURPH - Document to Audio Voice App
 * Functional web app that reads documents aloud using ElevenLabs TTS
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  FileText,
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Upload,
  Volume2,
  Loader2,
  X,
  FileUp,
  Headphones,
  Gauge,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

interface DocumentState {
  name: string;
  content: string;
  type: string;
}

interface Voice {
  id: string;
  name: string;
  category: string;
}

type AppState = "idle" | "uploading" | "processing" | "ready" | "playing" | "paused" | "error";

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [document, setDocument] = useState<DocumentState | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<string>("21m00Tcm4TlvDq8ikWAM"); // Default: Rachel
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [voices, setVoices] = useState<Voice[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Fetch available voices
  const voicesQuery = trpc.tts.voices.useQuery(undefined, {
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Update voices when query succeeds
  useEffect(() => {
    if (voicesQuery.data) {
      setVoices(voicesQuery.data);
    }
  }, [voicesQuery.data]);

  // TTS mutation using backend proxy
  const ttsMutation = trpc.tts.convert.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob URL
      const byteCharacters = atob(data.audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.contentType });
      const url = URL.createObjectURL(blob);
      
      setAudioUrl(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play();
        setAppState("playing");
        setStatusMessage("Playing...");
      }
    },
    onError: (error) => {
      console.error("TTS Error:", error);
      setAppState("error");
      setStatusMessage("Failed to generate audio");
      toast.error("Failed to generate audio. Please try again.");
    },
  });

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.toLowerCase().trim();
        
        console.log("Voice command detected:", command);
        
        // Process voice commands
        if (command.includes('play') || command.includes('start')) {
          handlePlay();
          toast.success("Voice command: Play");
        } else if (command.includes('pause') || command.includes('stop')) {
          if (appState === 'playing') {
            handlePause();
            toast.success("Voice command: Pause");
          }
        } else if (command.includes('resume') || command.includes('continue')) {
          if (appState === 'paused') {
            handlePlay();
            toast.success("Voice command: Resume");
          }
        } else if (command.includes('faster') || command.includes('speed up')) {
          const newSpeed = Math.min(playbackSpeed + 0.25, 2);
          setPlaybackSpeed(newSpeed);
          if (audioRef.current) {
            audioRef.current.playbackRate = newSpeed;
          }
          toast.success(`Speed: ${newSpeed}x`);
        } else if (command.includes('slower') || command.includes('slow down')) {
          const newSpeed = Math.max(playbackSpeed - 0.25, 0.5);
          setPlaybackSpeed(newSpeed);
          if (audioRef.current) {
            audioRef.current.playbackRate = newSpeed;
          }
          toast.success(`Speed: ${newSpeed}x`);
        }
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        // Restart if still supposed to be listening
        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // Already started
          }
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [appState, playbackSpeed, isListening]);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAppState("uploading");
    setStatusMessage("Reading document...");
    // Clear previous audio when uploading new document
    setAudioUrl(null);

    try {
      const text = await readFileContent(file);
      setDocument({
        name: file.name,
        content: text,
        type: file.type,
      });
      setAppState("ready");
      setStatusMessage("Document ready. Click Play to listen.");
      toast.success(`Loaded: ${file.name}`);
    } catch (error) {
      setAppState("error");
      setStatusMessage("Failed to read document");
      toast.error("Failed to read document");
    }
  }, []);

  // Read file content based on type
  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  // Play audio
  const handlePlay = async () => {
    if (!document) {
      toast.error("Please upload a document first");
      return;
    }

    try {
      if (!audioUrl) {
        setAppState("processing");
        setStatusMessage("Converting to audio...");
        
        // Use the backend TTS proxy with selected voice
        ttsMutation.mutate({ text: document.content, voiceId: selectedVoice });
      } else {
        if (audioRef.current) {
          audioRef.current.playbackRate = playbackSpeed;
          await audioRef.current.play();
          setAppState("playing");
          setStatusMessage("Playing...");
        }
      }
    } catch (error) {
      setAppState("error");
      setStatusMessage("Failed to generate audio");
      toast.error("Failed to generate audio. Please try again.");
    }
  };

  // Pause audio
  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setAppState("paused");
      setStatusMessage("Paused");
    }
  };

  // Stop audio
  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAppState("ready");
      setProgress(0);
      setStatusMessage("Stopped");
    }
  };

  // Handle audio time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration > 0) {
        setProgress((current / duration) * 100);
      }
    }
  };

  // Handle audio ended
  const handleAudioEnded = () => {
    setAppState("ready");
    setProgress(0);
    setStatusMessage("Playback complete");
  };

  // Toggle voice commands
  const toggleVoiceCommands = () => {
    if (!recognitionRef.current) {
      toast.error("Voice commands not supported in this browser");
      return;
    }
    
    if (!isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success("Voice commands activated. Say 'play', 'pause', 'faster', or 'slower'.");
      } catch (e) {
        toast.error("Failed to start voice recognition");
      }
    } else {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.info("Voice commands deactivated");
    }
  };

  // Handle playback speed change
  const handleSpeedChange = (value: number[]) => {
    const speed = value[0];
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Handle voice change - regenerate audio with new voice
  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    // Clear audio so it regenerates with new voice
    if (audioUrl) {
      setAudioUrl(null);
      toast.info("Voice changed. Click Play to hear the new voice.");
    }
  };

  // Clear document
  const clearDocument = () => {
    setDocument(null);
    setAudioUrl(null);
    setAppState("idle");
    setProgress(0);
    setStatusMessage("");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.pdf,.docx"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-cyan">
              <Headphones className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold text-2xl">Murph</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleVoiceCommands}
            className={isListening ? "border-primary text-primary animate-pulse" : ""}
          >
            {isListening ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
            Voice Commands
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 min-h-screen">
        <div className="container max-w-4xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-8"
          >
            {/* Hero Text */}
            <motion.div variants={fadeInUp} className="text-center space-y-4">
              <h1 className="font-display text-4xl md:text-5xl font-bold">
                Listen to Your <span className="gradient-text text-glow-cyan">Documents</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Upload any document and let Murph read it aloud with natural-sounding voice. 
                Perfect for driving, exercising, or multitasking.
              </p>
            </motion.div>

            {/* Upload Area */}
            <motion.div variants={fadeInUp}>
              <AnimatePresence mode="wait">
                {!document ? (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card p-12 text-center cursor-pointer hover:bg-white/10 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6 glow-cyan">
                      <Upload className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="font-display text-2xl font-semibold mb-2">
                      Upload Document
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Drag and drop or click to select
                    </p>
                    <p className="text-sm text-muted-foreground/60">
                      Supports TXT, MD, PDF, DOCX
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="document"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card p-8"
                  >
                    {/* Document Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                          <FileText className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-display text-xl font-semibold">{document.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {document.content.length.toLocaleString()} characters
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={clearDocument}>
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Voice & Speed Controls */}
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      {/* Voice Selection */}
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Voice
                        </label>
                        <Select value={selectedVoice} onValueChange={handleVoiceChange}>
                          <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue placeholder="Select voice" />
                          </SelectTrigger>
                          <SelectContent>
                            {voicesQuery.isLoading ? (
                              <SelectItem value="loading" disabled>Loading voices...</SelectItem>
                            ) : voices.length > 0 ? (
                              voices.map((voice) => (
                                <SelectItem key={voice.id} value={voice.id}>
                                  {voice.name} ({voice.category})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="21m00Tcm4TlvDq8ikWAM">Rachel (Default)</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Playback Speed */}
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground flex items-center gap-2">
                          <Gauge className="w-4 h-4" />
                          Speed: {playbackSpeed}x
                        </label>
                        <Slider
                          value={[playbackSpeed]}
                          onValueChange={handleSpeedChange}
                          min={0.5}
                          max={2}
                          step={0.25}
                          className="py-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground/60">
                          <span>0.5x</span>
                          <span>1x</span>
                          <span>1.5x</span>
                          <span>2x</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span>{Math.round(progress)}%</span>
                        <span>{statusMessage}</span>
                      </div>
                    </div>

                    {/* Playback Controls */}
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-12 h-12"
                        onClick={handleStop}
                        disabled={appState === "idle" || appState === "processing"}
                      >
                        <Square className="w-5 h-5" />
                      </Button>

                      <Button
                        size="icon"
                        className="w-16 h-16 rounded-full glow-cyan"
                        onClick={appState === "playing" ? handlePause : handlePlay}
                        disabled={appState === "processing" || appState === "uploading"}
                      >
                        {appState === "processing" || ttsMutation.isPending ? (
                          <Loader2 className="w-8 h-8 animate-spin" />
                        ) : appState === "playing" ? (
                          <Pause className="w-8 h-8" />
                        ) : (
                          <Play className="w-8 h-8 ml-1" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        className="w-12 h-12"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileUp className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Status */}
                    {(appState === "processing" || ttsMutation.isPending) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6 text-center"
                      >
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating audio with ElevenLabs...
                        </p>
                      </motion.div>
                    )}

                    {/* Voice Commands Hint */}
                    {isListening && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20"
                      >
                        <p className="text-sm text-center text-primary">
                          🎤 Listening for commands: "play", "pause", "faster", "slower"
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Features */}
            <motion.div variants={fadeInUp} className="grid md:grid-cols-3 gap-4 pt-8">
              <div className="glass-card p-6 text-center">
                <Volume2 className="w-8 h-8 text-primary mx-auto mb-3" />
                <h4 className="font-semibold mb-1">Natural Voice</h4>
                <p className="text-sm text-muted-foreground">
                  Multiple voices powered by ElevenLabs AI
                </p>
              </div>
              <div className="glass-card p-6 text-center">
                <Mic className="w-8 h-8 text-primary mx-auto mb-3" />
                <h4 className="font-semibold mb-1">Voice Commands</h4>
                <p className="text-sm text-muted-foreground">
                  Hands-free control with speech
                </p>
              </div>
              <div className="glass-card p-6 text-center">
                <Gauge className="w-8 h-8 text-primary mx-auto mb-3" />
                <h4 className="font-semibold mb-1">Speed Control</h4>
                <p className="text-sm text-muted-foreground">
                  Adjust playback from 0.5x to 2x
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            Murph — Transform documents into spoken audio
          </p>
        </div>
      </footer>
    </div>
  );
}
