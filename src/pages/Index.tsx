import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
const About = lazy(() => import('@/components/About'));
import Projects from '@/components/Projects';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import { SectionNavProvider, useSectionNav, type SectionId } from '@/lib/SectionNavContext';

type NonAboutSectionId = Exclude<SectionId, 'about'>;

const sectionMap: Record<NonAboutSectionId, ComponentType> = {
  hero: Hero,
  projects: Projects,
  contact: Contact,
};

function ActiveSection() {
  const { active } = useSectionNav();
  const [aboutMounted, setAboutMounted] = useState(active === 'about');
  const nonAboutActive = active !== 'about' ? (active as NonAboutSectionId) : null;
  const NonAboutComponent = nonAboutActive ? sectionMap[nonAboutActive] : null;

  useEffect(() => {
    if (active === 'about') setAboutMounted(true);
  }, [active]);

  return (
    <div className="relative flex-1">
      {aboutMounted && (
        <motion.div
          initial={false}
          animate={{ opacity: active === 'about' ? 1 : 0, y: active === 'about' ? 0 : 6 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={active === 'about' ? 'relative' : 'pointer-events-none absolute inset-0 overflow-hidden'}
          aria-hidden={active !== 'about'}
        >
          <Suspense fallback={<div className="min-h-[min(100dvh,900px)] w-full" aria-hidden />}>
            <About />
          </Suspense>
          {active === 'about' && <Footer />}
        </motion.div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {nonAboutActive && NonAboutComponent && (
          <motion.div
            key={nonAboutActive}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <NonAboutComponent />
            {nonAboutActive !== 'hero' && <Footer />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Index() {
  return (
    <SectionNavProvider>
      <main
        className="relative flex min-h-screen flex-col bg-transparent overflow-x-hidden"
        style={{ cursor: 'none' }}
      >
        <CustomCursor />
        <Navbar />
        <ActiveSection />
      </main>
    </SectionNavProvider>
  );
}
