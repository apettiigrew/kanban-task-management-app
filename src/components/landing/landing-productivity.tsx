"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

interface Feature {
  id: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    id: "boards",
    title: "Boards",
    description:
      "Kanban boards give you a visual snapshot of your work so tasks are easy to navigate. Know what you need to do next and what has already been completed.",
  },
  {
    id: "lists",
    title: "Lists",
    description:
      "Lists keep your tasks organised and move between stages of a project. Track different phases of work, or sort tasks by priority to keep everything in order.",
  },
  {
    id: "cards",
    title: "Cards",
    description:
      "Cards represent tasks and ideas. Open a card to add comments, attachments, due dates, members, checklists, and more to stay on top of every detail.",
  },
];

export function LandingProductivity() {
  const [activeFeature, setActiveFeature] = useState<string>("boards");

  const handleFeatureClick = (id: string) => setActiveFeature(id);

  return (
    <section id="features" className="bg-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase text-center lg:text-left mb-2">
          Kanban 101
        </p>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          <div className="flex-1 w-full">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8 text-center lg:text-left">
              Your productivity powerhouse
            </h2>

            <div className="flex flex-col">
              {FEATURES.map((feature) => (
                <div key={feature.id} className="border-b border-slate-100 last:border-0">
                  <button
                    className="w-full flex items-center justify-between py-4 text-left cursor-pointer"
                    onClick={() => handleFeatureClick(feature.id)}
                    aria-expanded={activeFeature === feature.id}
                    aria-controls={`feature-desc-${feature.id}`}
                  >
                    <span
                      className={`text-lg font-semibold transition-colors ${
                        activeFeature === feature.id ? "text-blue-700" : "text-slate-800"
                      }`}
                    >
                      {feature.title}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${
                        activeFeature === feature.id ? "rotate-180 text-blue-600" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {activeFeature === feature.id && (
                    <p
                      id={`feature-desc-${feature.id}`}
                      className="pb-4 text-slate-600 text-sm leading-relaxed"
                    >
                      {feature.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex justify-center lg:justify-end w-full">
            <Image
              src="https://placehold.co/600x400/e2e8f0/475569?text=Board+Screenshot"
              alt="Kanban board screenshot showing boards, lists, and cards"
              width={600}
              height={400}
              unoptimized
              className="rounded-xl shadow-lg w-full max-w-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
