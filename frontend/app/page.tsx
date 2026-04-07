import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import Features from '@/components/Features';
import CallToAction from '@/components/CallToAction';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b1324] text-white">
      <Navbar variant="dark" />
      <main>
        <HeroSection />
        <Features />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
