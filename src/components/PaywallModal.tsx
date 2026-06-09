import { motion, AnimatePresence } from "framer-motion";
import { Key, CreditCard, X } from "lucide-react";
import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: () => void;
}

export default function PaywallModal({ isOpen, onClose, onKeySaved }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveKey = async () => {
    if (!apiKey) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile/key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey })
      });
      if (res.ok) {
        onKeySaved();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                <CreditCard className="text-stone-900" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Se acabó tu prueba gratis</h2>
              <p className="text-zinc-400">Elige cómo quieres continuar escribiendo tu obra maestra.</p>
            </div>

            <div className="space-y-4 text-left">
              <div className="bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-5">
                <h3 className="font-bold text-amber-400 mb-1 flex items-center gap-2">
                  Opción A (Recomendada)
                </h3>
                <p className="text-sm text-zinc-300 mb-4">
                  Desbloquea la app con un pago único de 29€ y obtén 10 horas de dictado. Sin suscripciones.
                </p>
                <button className="w-full py-3 rounded-full bg-white text-black hover:bg-zinc-200 font-bold transition-all shadow-lg">
                  Comprar por 29€
                </button>
              </div>

              <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-5">
                <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                  <Key size={16} /> Opción B (Para Pros)
                </h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Introduce tu propia API Key de Google AI Studio para seguir usando la app gratis sin límites.
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline ml-1 block mt-1">
                    Puedes conseguir una gratis (250 usos diarios).
                  </a>
                </p>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 mb-3 text-white placeholder-zinc-500 outline-none focus:border-amber-500"
                />
                <button 
                  onClick={handleSaveKey}
                  disabled={saving || !apiKey}
                  className="w-full py-2 rounded-xl border border-zinc-600 hover:bg-zinc-700 disabled:opacity-50 text-white font-medium transition-all"
                >
                  {saving ? "Guardando..." : "Guardar API Key"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
