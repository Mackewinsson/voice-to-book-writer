"use client";

import { motion } from "framer-motion";
import { Mic, BookOpen, Wand2, Sparkles, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-zinc-100 font-sans selection:bg-amber-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(120,90,50,0.15),_transparent_60%)] pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md border-b border-zinc-800/80 bg-[#0c0c0e]/80 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Mic size={18} className="text-stone-900" />
            </div>
            <span className="text-xl font-bold tracking-tight">Whisperbud</span>
          </div>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <Link href="/dashboard" className="text-sm font-medium hover:text-amber-400 transition-colors">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link href="/sign-up" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto space-y-32">
        
        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto space-y-8 mt-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-medium"
          >
            <Sparkles size={14} />
            <span>The future of writing is spoken.</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500"
          >
            Speak your next <br className="hidden sm:block" />
            <span className="text-amber-400">bestseller.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            Whisperbud translates your raw thoughts into beautifully structured book chapters, effortlessly categorizing your ideas as you speak.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link href={isSignedIn ? "/dashboard" : "/sign-up"} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-900 px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5">
              Start Writing Free
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Mic,
              title: "Frictionless Dictation",
              desc: "Tap the mic and pour your thoughts out. Our AI accurately transcribes and structures your paragraphs instantly."
            },
            {
              icon: Wand2,
              title: "Smart Categorization",
              desc: "Tag blocks as plot points, character ideas, or notes to investigate later. Keep your manuscript perfectly organized."
            },
            {
              icon: BookOpen,
              title: "One-Click Publishing",
              desc: "Export your entire project directly to a professionally formatted Word (.docx) manuscript, ready for your editor."
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm hover:bg-zinc-800/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-6">
                <feature.icon className="text-amber-400" size={24} />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-3">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* Pricing Section */}
        <section className="max-w-5xl mx-auto pt-10" id="pricing">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Empieza a dictar sin compromiso.</h2>
            <p className="text-zinc-400">Prueba la magia gratis, y paga solo lo que necesitas después.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 flex flex-col"
            >
              <h3 className="text-xl font-medium text-zinc-300">Empieza a dictar</h3>
              <div className="mt-4 mb-8 flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight">$0</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1 text-zinc-300">
                <li className="flex items-start gap-3">
                  <Check size={18} className="text-amber-500 mt-1 shrink-0" />
                  <span>Tienes 15 minutos de grabación 100% gratis nada más registrarte para que pruebes la magia.</span>
                </li>
              </ul>
              <Link href={isSignedIn ? "/dashboard" : "/sign-up"} className="w-full py-3 rounded-full border border-zinc-700 hover:bg-zinc-800 text-center font-medium transition-colors mt-auto">
                Empezar gratis
              </Link>
            </motion.div>

            {/* Pro Tier */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-8 rounded-3xl bg-gradient-to-b from-amber-500/10 to-zinc-900/80 border border-amber-500/30 flex flex-col"
            >
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-amber-500 text-stone-900 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                Sin suscripciones trampa
              </div>
              <h3 className="text-xl font-medium text-amber-400">Cuando se acabe la prueba, tú decides.</h3>
              
              <ul className="space-y-4 mb-8 mt-6 flex-1 text-zinc-100">
                <li className="flex items-start gap-3">
                  <Check size={18} className="text-amber-400 mt-1 shrink-0" />
                  <span>Puedes hacer un pago único para recargar horas.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={18} className="text-amber-400 mt-1 shrink-0" />
                  <span>O si eres un usuario avanzado, poner tu propia API Key de Google Gemini y pagarle directamente a ellos solo los céntimos que consumas.</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </section>

      </main>
      
      <footer className="border-t border-zinc-800/80 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] mt-20">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} Whisperbud. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-zinc-300 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
