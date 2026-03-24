import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Experience from '@/components/Experience';
import TechStack from '@/components/TechStack';
import Projects from '@/components/Projects';
import Education from '@/components/Education';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';

export default function Index() {
  return (
    <main className="relative min-h-screen bg-transparent" style={{ cursor: 'none' }}>
      <CustomCursor />
      <Navbar />
      <Hero />
      <About />
      <Experience />
      <TechStack />
      <Projects />
      <Education />
      <Contact />
      <Footer />
    </main>
  );
}
