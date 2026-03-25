import ScrollReveal from './ScrollReveal';
import SectionTitle from './SectionTitle';
import { motion } from 'framer-motion';

const techs = [
  'HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Next.js',
  'React Native', 'Tailwind CSS', 'FastAPI', 'Firebase', 'Supabase',
  'SQL', 'Vercel', 'Git',
];

export default function TechStack() {
  return (
    <section
      id="tech"
      className="section-soft-bg section-padding-top relative z-10 flex min-h-screen min-h-dvh flex-col pb-32 px-6"
    >
      <div className="container max-w-4xl">
        <SectionTitle title="Tecnologias" subtitle="Ferramentas do dia a dia" />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {techs.map((tech, i) => (
            <ScrollReveal key={tech} delay={i * 0.05}>
              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.97 }}
                className="glass rounded-xl p-5 text-center cursor-default neon-border group transition-shadow duration-300 hover:glow-purple"
              >
                <span className="text-sm font-semibold text-foreground group-hover:text-gradient-neon transition-colors duration-200">
                  {tech}
                </span>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
