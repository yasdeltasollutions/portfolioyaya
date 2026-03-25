import { motion } from 'framer-motion';
import { useSectionNav } from '@/lib/SectionNavContext';

export default function Hero() {
  const { go } = useSectionNav();
  return (
    <section id="hero" className="relative z-10 flex min-h-screen items-center justify-start overflow-hidden">
      <div className="relative z-10 grid min-h-0 w-full grid-cols-1 items-center gap-10 pb-16 pl-8 pr-6 pt-24 md:min-h-screen md:grid-cols-[minmax(0,1fr)_auto] md:gap-6 md:pb-0 md:pl-12 md:pr-0 md:pt-0 lg:pl-24 xl:pl-28">
        <div className="min-w-0 max-w-3xl text-left md:pr-4 lg:pr-8">
          <motion.p
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-foreground/82"
          >
            Desenvolvedora Front-End
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ duration: 0.9, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl font-bold leading-[0.95] tracking-tight glow-text sm:text-6xl md:text-7xl"
          >
            Yasmin{' '}
            <span className="text-gradient-neon">Beviláqua</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ duration: 0.7, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            Criando experiências digitais imersivas e inesquecíveis.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="hero-cta-group mt-10 flex flex-wrap justify-start gap-4"
          >
            <button
              onClick={() => go('projects')}
              className="btn-glow-neon btn-glow-neon--projects bg-gradient-neon px-8 py-3 text-sm font-semibold text-primary-foreground hover:scale-[1.03]"
            >
              <span className="relative z-10">Ver Projetos</span>
            </button>
            <button
              onClick={() => go('contact')}
              className="btn-glow-neon-ghost px-8 py-3 text-sm font-semibold hover:scale-[1.03]"
            >
              <span className="relative z-10">Contato</span>
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none flex w-full justify-center md:w-auto md:max-w-none md:justify-end md:justify-self-end"
        >
          <img
            src="/svg.png"
            alt="Ilustração"
            className="h-auto w-full max-w-md origin-right scale-[0.95] object-contain object-right drop-shadow-[0_0_64px_hsl(var(--neon-purple)/0.3)] sm:max-w-xl md:max-h-[min(78vh,720px)] md:w-[min(58vw,44rem)] md:max-w-none lg:w-[min(52vw,52rem)] xl:w-[min(48vw,60rem)]"
            decoding="async"
          />
        </motion.div>
      </div>
    </section>
  );
}
