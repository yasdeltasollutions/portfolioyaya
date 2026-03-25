import ScrollReveal from './ScrollReveal';
import SectionTitle from './SectionTitle';
import { motion } from 'framer-motion';
import { ExternalLink, Github } from 'lucide-react';

const projects = [
  {
    title: 'Plataforma SEDUC',
    description: 'Sistema educacional para a Secretaria de Educação do Amazonas com painéis interativos e gestão de dados.',
    stack: ['React', 'Next.js', 'FastAPI', 'TypeScript'],
  },
  {
    title: 'App Delta Mobile',
    description: 'Aplicação mobile com integração de hardware serial e recursos de IA para automação industrial.',
    stack: ['React Native', 'Expo', 'TypeScript', 'REST APIs'],
  },
  {
    title: 'Dashboard Analytics',
    description: 'Painel de visualização de dados com gráficos interativos e atualizações em tempo real.',
    stack: ['React', 'Tailwind CSS', 'Recharts', 'Supabase'],
  },
];

export default function Projects() {
  return (
    <section
      id="projects"
      className="section-soft-bg section-padding-top relative z-10 flex min-h-screen min-h-dvh flex-col pb-32 px-6"
    >
      <div className="container max-w-5xl">
        <SectionTitle title="Projetos" subtitle="Trabalhos em destaque" />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -6 }}
                className="glass rounded-2xl overflow-hidden neon-border group h-full flex flex-col"
              >
                {/* Gradient placeholder top */}
                <div className="h-40 bg-gradient-to-br from-neon-purple/20 via-neon-pink/10 to-neon-orange/20 flex items-center justify-center">
                  <span className="text-3xl font-bold text-foreground/10 group-hover:text-foreground/20 transition-colors">
                    {p.title[0]}
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{p.description}</p>

                  <div className="flex flex-wrap gap-2 mb-5">
                    {p.stack.map(s => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">{s}</span>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink size={14} /> Ver Projeto
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Github size={14} /> GitHub
                    </button>
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
