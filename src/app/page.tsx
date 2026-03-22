import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingProductivity } from "@/components/landing/landing-productivity";
import { LandingFooterCta } from "@/components/landing/landing-footer-cta";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <LandingProductivity />
        {/* <LandingIntegrations /> */}
        {/* <LandingDoMore /> */}
        {/* <LandingSocialProof /> */}
        {/* <LandingLogos /> */}
        <LandingFooterCta />
      </main>
      <LandingFooter />
    </div>
  );
}
