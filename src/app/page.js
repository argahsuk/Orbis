"use client";

import { HeroWithMockup } from "@/components/ui/hero-with-mockup"; // Ensure correct import

export default function HeroPage() {
  return (
    <HeroWithMockup
      title="Open-Source Project Finder for Global Collaboration"
      description="A platform designed to connect developers worldwide, fostering collaboration on impactful open-source projects that aim to improve communities and create positive change."
      primaryCta={{
        text: "Start Building",
        href: "/login",
      }}
      
      mockupImage={{
        alt: "AI Platform Dashboard",
        width: 1248,
        height: 765,
        src: "https://www.launchuicomponents.com/app-light.png",
      }}
    />
  );
}
