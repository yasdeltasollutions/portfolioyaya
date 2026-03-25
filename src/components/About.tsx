import { useState } from 'react';
import ScrollReveal from './ScrollReveal';
import SectionTitle from './SectionTitle';
import AboutPlanet from './AboutPlanet';
import type { PlanetFocusIndex } from '@/lib/aboutPlanetLayout';

export default function About() {
  const [planetFocus, setPlanetFocus] = useState<PlanetFocusIndex | null>(null);

  return (
    <section
      id="about"
      className={`section-soft-bg section-padding-top relative isolate z-10 flex min-h-screen min-h-dvh flex-col items-center justify-start pb-24 px-4 sm:px-6 ${
        planetFocus === 2 ? 'about--blob-eu-sou' : ''
      }`}
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="about-blob about-blob--left" />
      </div>

      <div className="relative z-[1] flex w-full flex-1 flex-col items-center justify-start">
        <div className="mx-auto w-full max-w-4xl px-1">
          <SectionTitle>
            <span className="text-white">Sobre </span>
            <span className="text-gradient-neon">Mim</span>
          </SectionTitle>
        </div>

        <ScrollReveal className="pointer-events-auto mt-10 w-full sm:mt-12 md:mt-14">
          <AboutPlanet onFocusChange={setPlanetFocus} />
        </ScrollReveal>
      </div>
    </section>
  );
}
