import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    url: "/images/hero-main.jpg",
    title: "Premium Tools & Hardware",
    subtitle: "Everything you need for your next project",
  },
  {
    url: "/images/construction-service.jpg",
    title: "Professional Construction Equipment",
    subtitle: "High-quality machinery for serious builders",
  },
  {
    url: "/images/plumbing-service.jpg",
    title: "Complete Plumbing Solutions",
    subtitle: "Reliable parts for every installation",
  },
  {
    url: "/images/electrical-service.jpg",
    title: "Advanced Electrical Supplies",
    subtitle: "Power up with the best components in the market",
  },
  {
    url: "/images/carpentry-service.jpeg",
    title: "Expert Carpentry Tools",
    subtitle: "Precision tools for master woodworkers",
  },
  {
    url: "/images/professional-team.jpg",
    title: "Expert Consultancy",
    subtitle: "Talk to our professionals for project advice",
  },
  {
    url: "/images/tools-background.jpg",
    title: "Industrial Grade Supplies",
    subtitle: "Built to last, designed for the toughest jobs",
  },
  {
    url: "/images/hero-bg-pattern.jpg",
    title: "Modern Design Solutions",
    subtitle: "Aesthetics meets functionality in every piece",
  },
];

const ShopSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? slides.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === slides.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  };

  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 5000);
    return () => clearInterval(slideInterval);
  }, [currentIndex]);

  return (
    <div className="w-full h-[250px] md:h-[350px] relative group px-4 mt-6">
      {/* Main Image Container */}
      <div
        style={{ backgroundImage: `url(${slides[currentIndex].url})` }}
        className="w-full h-full rounded-2xl bg-center bg-cover duration-500 shadow-xl border border-white/10 overflow-hidden relative"
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30 flex flex-col justify-center px-8 md:px-16">
          <h2 className="text-white text-3xl md:text-5xl font-bold mb-4 animate-in fade-in slide-in-from-left duration-700">
            {slides[currentIndex].title}
          </h2>
          <p className="text-white/90 text-lg md:text-xl max-w-lg mb-8 animate-in fade-in slide-in-from-left duration-1000">
            {slides[currentIndex].subtitle}
          </p>
        </div>

        {/* Left Arrow */}
        <div className="hidden group-hover:block absolute top-[50%] -translate-x-0 translate-y-[-50%] left-5 text-2xl rounded-full p-3 bg-black/40 text-white cursor-pointer hover:bg-black/60 transition-all">
          <ChevronLeft onClick={prevSlide} size={30} />
        </div>

        {/* Right Arrow */}
        <div className="hidden group-hover:block absolute top-[50%] -translate-x-0 translate-y-[-50%] right-5 text-2xl rounded-full p-3 bg-black/40 text-white cursor-pointer hover:bg-black/60 transition-all">
          <ChevronRight onClick={nextSlide} size={30} />
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-4 gap-2">
        {slides.map((slide, slideIndex) => (
          <div
            key={slideIndex}
            onClick={() => goToSlide(slideIndex)}
            className={cn(
              "cursor-pointer transition-all duration-300 rounded-full",
              currentIndex === slideIndex
                ? "w-8 h-2.5 bg-blue-600"
                : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default ShopSlider;
