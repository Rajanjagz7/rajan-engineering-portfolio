import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Stats from './components/Stats';
import ProjectsSection from './components/ProjectsSection';
import SkillsMatrix from './components/SkillsMatrix';
import ExperienceSection from './components/ExperienceSection';
import ArchitectureSection from './components/ArchitectureSection';
import ManualTestingShowcase from './components/ManualTestingShowcase';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import ScrollEnhancements from './components/ScrollEnhancements';

export default function App() {
  return (
    <div className="portfolio-app">
      <ScrollEnhancements />
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <ProjectsSection />
        <SkillsMatrix />
        <ExperienceSection />
        <ArchitectureSection />
        <ManualTestingShowcase />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
