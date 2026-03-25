import ScrollReveal from './ScrollReveal';
import SectionTitle from './SectionTitle';
import AboutPlanet from './AboutPlanet';

export default function About() {
  return (
    <section
      id="about"
      className="section-soft-bg relative isolate z-10 flex min-h-screen min-h-dvh flex-col items-center justify-center py-24 px-4 sm:px-6"
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="about-blob about-blob--left" />
      </div>

      <div className="relative z-[1] flex w-full flex-1 flex-col items-center justify-center">
        <div className="mx-auto w-full max-w-4xl px-1">
          <SectionTitle>
            <span className="text-white">Sobre </span>
            <span className="text-gradient-neon">Mim</span>
          </SectionTitle>
        </div>

        <ScrollReveal className="pointer-events-auto mt-10 w-full sm:mt-12 md:mt-14">
          <AboutPlanet />
        </ScrollReveal>
      </div>
    </section>
  );
}
