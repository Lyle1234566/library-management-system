import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturedBooks from '@/components/FeaturedBooks';
import Features from '@/components/Features';
import CallToAction from '@/components/CallToAction';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="public-shell min-h-screen text-ink">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturedBooks />
        <Features />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
