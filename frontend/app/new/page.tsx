"use client";

import { useState, useEffect } from "react";
import { SplashLoading } from "@/components/splash-loading";
import { SplashHero } from "@/components/splash-hero";
import { SplashCTA } from "@/components/splash-cta";
import MetallicPaint, { parseLogoImage } from "@/components/MetallicPaint";

export default function SplashPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [imageData, setImageData] = useState<ImageData | null>(null);

  useEffect(() => {
    async function loadDefaultImage() {
      try {
        const response = await fetch("/logo1.svg");
        const blob = await response.blob();
        const file = new File([blob], "default.png", { type: blob.type });

        const parsedData = await parseLogoImage(file);
        setImageData(parsedData?.imageData ?? null);
        console.log(parsedData?.imageData);
      } catch (err) {
        console.error("Error loading default image:", err);
      }
    }

    loadDefaultImage();
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);
  if (isLoading) {
    return <SplashLoading />;
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center gap-8 px-6">
      <MetallicPaint
        imageData={imageData ?? new ImageData(1, 1)}
        params={{
          edge: 0,
          patternBlur: 0.005,
          patternScale: 3.5,
          refraction: 0.015,
          speed: 0.3,
          liquid: 0.07,
        }}
      />
      <SplashHero />
      <SplashCTA />
    </div>
  );
}
