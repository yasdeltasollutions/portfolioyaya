import { useState } from 'react';
import ScrollReveal from './ScrollReveal';
import SectionTitle from './SectionTitle';
import { Github, Linkedin, Send } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // placeholder
  };

  return (
    <section
      id="contact"
      className="section-soft-bg relative z-10 flex min-h-screen min-h-dvh flex-col py-32 px-6"
    >
      <div className="container max-w-2xl">
        <SectionTitle title="Contato" subtitle="Vamos construir algo incrível juntos" />

        <ScrollReveal>
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 sm:p-10 neon-border space-y-6">
            {(['name', 'email'] as const).map(field => (
              <div key={field}>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  {field === 'name' ? 'Nome' : 'Email'}
                </label>
                <input
                  type={field === 'email' ? 'email' : 'text'}
                  required
                  value={form[field]}
                  onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                  className="w-full bg-secondary/60 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-purple/50 focus:border-neon-purple/50 transition-all duration-200 focus:shadow-[0_0_15px_hsl(272_72%_46%/0.3)]"
                  placeholder={field === 'name' ? 'Seu nome' : 'seu@email.com'}
                />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Mensagem</label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                className="w-full bg-secondary/60 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-purple/50 focus:border-neon-purple/50 transition-all duration-200 resize-none focus:shadow-[0_0_15px_hsl(272_72%_46%/0.3)]"
                placeholder="Conte-me sobre seu projeto..."
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 rounded-lg bg-gradient-neon text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2 animate-glow-pulse"
            >
              <Send size={16} /> Enviar Mensagem
            </motion.button>
          </form>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="flex justify-center gap-6 mt-10">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
              className="p-3 glass rounded-full neon-border hover:glow-purple transition-shadow duration-300">
              <Github size={20} className="text-muted-foreground hover:text-foreground transition-colors" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
              className="p-3 glass rounded-full neon-border hover:glow-pink transition-shadow duration-300">
              <Linkedin size={20} className="text-muted-foreground hover:text-foreground transition-colors" />
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
