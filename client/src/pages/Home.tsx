/*
 * DESIGN SYSTEM: Sonic Waves - Audio-Centric Minimalism
 * 
 * - Deep charcoal background with electric cyan accents
 * - Space Grotesk for headlines, Inter for body
 * - Glassmorphism cards, glow effects, animated waveforms
 * - Sound wave visual language throughout
 */

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  FileText,
  Mic,
  Play,
  Shield,
  Zap,
  Layers,
  Map,
  RefreshCw,
  Cloud,
  Lock,
  GitBranch,
  Terminal,
  Server,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Github,
  ExternalLink,
} from "lucide-react";

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

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

// Feature data
const coreFeatures = [
  {
    icon: FileText,
    title: "Document-to-Audio",
    description: "Import PDF, DOCX, TXT, or Markdown files and convert them to high-quality spoken audio using ElevenLabs TTS.",
  },
  {
    icon: Mic,
    title: "Voice-Driven Interaction",
    description: "Control playback, edit documents, and generate content using natural voice commands—perfect for hands-free use.",
  },
  {
    icon: Smartphone,
    title: "Seamless iOS Integration",
    description: "Deep integration with iOS Files, Share Sheet, Siri Shortcuts, and iCloud Drive for native experience.",
  },
];

const advancedFeatures = [
  {
    icon: Map,
    title: "Audio Map Navigation",
    description: "Auto-generated outline from document headings with per-section progress, bookmarks, and jump-to-paragraph functionality.",
  },
  {
    icon: RefreshCw,
    title: "Selective Regeneration",
    description: "Only rebuild changed audio chunks when editing—seamless playback timeline with minimal cost and latency.",
  },
  {
    icon: Cloud,
    title: "iCloud Drive Integration",
    description: "Auto-sync to iCloud Drive/Murph folder with source files, normalized Markdown, and on-demand PDF/DOCX exports.",
  },
  {
    icon: Lock,
    title: "PII Redaction",
    description: "Redact sensitive information before any external AI call with preview, approval workflow, and per-project rules.",
  },
  {
    icon: Layers,
    title: "Provider Abstraction",
    description: "Zero lock-in architecture with hot-swappable providers for TTS, conversation AI, and LLM connectors.",
  },
  {
    icon: Zap,
    title: "Intent Router",
    description: "Voice command pipeline with intent classification, slot extraction, and intelligent action execution.",
  },
];

const deploymentSteps = [
  {
    step: 1,
    title: "Clone Repository",
    code: `git clone https://github.com/flexworx/murph-voice-mobile-app.git
cd murph-voice-mobile-app`,
  },
  {
    step: 2,
    title: "Configure Environment",
    code: `cp backend/.env.example backend/.env
# Add your API keys:
# - ELEVENLABS_API_KEY
# - OPENAI_API_KEY (optional)
# - ANTHROPIC_API_KEY (optional)`,
  },
  {
    step: 3,
    title: "Start Backend",
    code: `docker-compose up -d

# Initialize database
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed`,
  },
  {
    step: 4,
    title: "Run Mobile App",
    code: `cd mobile
npm install
npx expo start

# Scan QR code with Expo Go on your iPhone`,
  },
];

const techStack = [
  { name: "React Native", description: "Cross-platform mobile" },
  { name: "TypeScript", description: "Type-safe codebase" },
  { name: "Node.js", description: "Backend runtime" },
  { name: "PostgreSQL", description: "Database" },
  { name: "ElevenLabs", description: "Premium TTS" },
  { name: "Docker", description: "Containerization" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-cyan">
              <Play className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-xl">Murph</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#deployment" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Deployment</a>
            <a href="#architecture" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Architecture</a>
          </div>
          <Button asChild className="glow-cyan">
            <a href="https://github.com/flexworx/murph-voice-mobile-app" target="_blank" rel="noopener noreferrer">
              <Github className="w-4 h-4 mr-2" />
              View on GitHub
            </a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="/images/hero-waves.png" 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>
        
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  Production-Grade Voice App
                </span>
              </motion.div>
              
              <motion.h1 
                variants={fadeInUp}
                className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
              >
                Transform Documents Into{" "}
                <span className="gradient-text text-glow-cyan">Spoken Audio</span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-xl text-muted-foreground max-w-xl"
              >
                A voice-driven iOS app that converts any document to high-quality audio 
                with hands-free interaction, intelligent voice commands, and seamless 
                iOS integration.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                <Button size="lg" className="glow-cyan text-lg px-8" asChild>
                  <a href="#deployment">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                  <a href="#features">
                    Explore Features
                  </a>
                </Button>
              </motion.div>
              
              <motion.div variants={fadeInUp} className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Self-Hosted
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Zero Vendor Lock-in
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  iOS + Android
                </div>
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <img 
                  src="/images/voice-orb.png" 
                  alt="Voice Interface" 
                  className="w-full max-w-md mx-auto animate-float"
                />
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full -z-10" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-24 relative">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="font-display text-4xl md:text-5xl font-bold mb-4">
              Core Capabilities
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three pillars that power the Murph experience
            </motion.p>
          </motion.div>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {coreFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={scaleIn}
                className="glass-card p-8 hover:bg-white/10 transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:glow-cyan transition-shadow">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Document to Audio Visual */}
      <section className="py-24 relative overflow-hidden">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 variants={fadeInUp} className="font-display text-4xl md:text-5xl font-bold mb-6">
                From Text to Voice in Seconds
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-xl text-muted-foreground mb-8">
                Import any document and let Murph transform it into natural, 
                high-quality spoken audio using ElevenLabs' premium voices.
              </motion.p>
              <motion.ul variants={staggerContainer} className="space-y-4">
                {[
                  "Support for PDF, DOCX, TXT, and Markdown",
                  "Multiple premium voice options",
                  "Adjustable speed and tone",
                  "Background playback with lock screen controls",
                ].map((item) => (
                  <motion.li key={item} variants={fadeInUp} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-lg">{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <img 
                src="/images/feature-document.png" 
                alt="Document to Audio" 
                className="w-full rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Advanced Features Grid */}
      <section className="py-24 bg-white/[0.02]">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="font-display text-4xl md:text-5xl font-bold mb-4">
              Advanced Features
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Production-grade capabilities for power users
            </motion.p>
          </motion.div>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {advancedFeatures.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="glass-card p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Voice Commands */}
      <section className="py-24 relative">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              <img 
                src="/images/feature-voice.png" 
                alt="Voice Commands" 
                className="w-full max-w-md mx-auto"
              />
            </motion.div>
            
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="order-1 lg:order-2"
            >
              <motion.h2 variants={fadeInUp} className="font-display text-4xl md:text-5xl font-bold mb-6">
                Voice-First Experience
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-xl text-muted-foreground mb-8">
                The Intent Router converts your voice commands into actions—
                control playback, navigate documents, edit content, and more.
              </motion.p>
              <motion.div variants={staggerContainer} className="space-y-4">
                {[
                  { cmd: '"Play"', action: "Start audio playback" },
                  { cmd: '"Jump to chapter 3"', action: "Navigate to specific section" },
                  { cmd: '"Summarize this"', action: "Generate AI summary" },
                  { cmd: '"Send to Claude"', action: "Dispatch to AI provider" },
                ].map((item) => (
                  <motion.div 
                    key={item.cmd} 
                    variants={fadeInUp}
                    className="flex items-center gap-4 p-4 glass-card"
                  >
                    <code className="text-primary font-mono text-sm">{item.cmd}</code>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{item.action}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Deployment Section */}
      <section id="deployment" className="py-24 bg-white/[0.02]">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Terminal className="w-4 h-4" />
              Self-Hosted Deployment
            </motion.div>
            <motion.h2 variants={fadeInUp} className="font-display text-4xl md:text-5xl font-bold mb-4">
              Deploy in Minutes
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Run Murph on your own server with Docker. No vendor lock-in, full control.
            </motion.p>
          </motion.div>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto space-y-6"
          >
            {deploymentSteps.map((step) => (
              <motion.div
                key={step.step}
                variants={fadeInUp}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-primary">
                    {step.step}
                  </div>
                  <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                </div>
                <pre className="code-block text-sm overflow-x-auto">
                  <code className="text-primary/80">{step.code}</code>
                </pre>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <Button size="lg" className="glow-cyan" asChild>
              <a href="https://github.com/flexworx/murph-voice-mobile-app" target="_blank" rel="noopener noreferrer">
                <Github className="w-5 h-5 mr-2" />
                View Full Documentation
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="py-24">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="font-display text-4xl md:text-5xl font-bold mb-4">
              Modern Architecture
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built with production-grade technologies for reliability and scale
            </motion.p>
          </motion.div>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {techStack.map((tech) => (
              <motion.div
                key={tech.name}
                variants={scaleIn}
                className="glass-card p-6 text-center hover:bg-white/10 transition-colors"
              >
                <h4 className="font-display font-semibold mb-1">{tech.name}</h4>
                <p className="text-xs text-muted-foreground">{tech.description}</p>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mt-16 grid md:grid-cols-3 gap-8"
          >
            <motion.div variants={fadeInUp} className="glass-card p-8">
              <Server className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-display text-xl font-semibold mb-3">Backend</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Node.js + Express server with TypeScript. Provider abstraction layer, 
                intent router, document parsing, and TTS orchestration.
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="glass-card p-8">
              <Smartphone className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-display text-xl font-semibold mb-3">Mobile App</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                React Native + Expo for iOS and Android. Voice recognition, 
                audio playback, and native Share Extension integration.
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="glass-card p-8">
              <GitBranch className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-display text-xl font-semibold mb-3">CI/CD</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                GitHub Actions for automated iOS and Android builds. 
                Docker deployment for backend. Zero manual intervention.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.h2 variants={fadeInUp} className="font-display text-4xl md:text-5xl font-bold mb-6">
              Ready to Build?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-muted-foreground mb-8">
              Clone the repository, configure your API keys, and start transforming 
              documents into audio in minutes.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="glow-cyan text-lg px-8" asChild>
                <a href="https://github.com/flexworx/murph-voice-mobile-app" target="_blank" rel="noopener noreferrer">
                  <Github className="w-5 h-5 mr-2" />
                  Get Started on GitHub
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Play className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-bold text-xl">Murph</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Open source voice-driven document-to-audio application
            </p>
            <div className="flex items-center gap-6">
              <a 
                href="https://github.com/flexworx/murph-voice-mobile-app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
