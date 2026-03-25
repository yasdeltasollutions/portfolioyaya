import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Experience from '@/components/Experience';
import TechStack from '@/components/TechStack';
import Projects from '@/components/Projects';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import { SectionNavProvider, useSectionNav, type SectionId } from '@/lib/SectionNavContext';

const sectionMap: Record<SectionId, () => JSX.Element> = {
  hero: Hero,
  about: About,
  experience: Experience,
  tech: TechStack,
  projects: Projects,
  contact: Contact,
};

function ActiveSection() {
  const { active } = useSectionNav();
  const Component = sectionMap[active];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1"
      >
        <Component />
        {active !== 'hero' && <Footer />}
      </motion.div>
    </AnimatePresence>
  );
}

export default function Index() {
  return (
    <SectionNavProvider>
      <main
        className="relative flex min-h-screen flex-col bg-transparent overflow-hidden"
        style={{ cursor: 'none' }}
      >
        <CustomCursor />
        <Navbar />
        <ActiveSection />
      </main>
    </SectionNavProvider>
  );
}
