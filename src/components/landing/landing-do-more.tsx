import Link from "next/link";
import { Puzzle, Zap, Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DoMoreFeature {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  learnMoreHref: string;
}

const DO_MORE_FEATURES: DoMoreFeature[] = [
  {
    id: "integrations",
    icon: Puzzle,
    title: "Integrations",
    description:
      "Connect the apps your team already uses into your Kanban workflow. Power up your boards with integrations like Jira, Confluence, Dropbox, Google Drive, and more.",
    learnMoreHref: "#",
  },
  {
    id: "automation",
    icon: Zap,
    title: "Automation",
    description:
      "Let automation do the work. Kanban's built-in automation supercharges your team's productivity. Set up rules, buttons, and scheduled commands to handle the repetitive stuff.",
    learnMoreHref: "#",
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Get notified",
    description:
      "Never miss a deadline or update. Set up real-time notifications so you and your team always know exactly what is happening across all cards and boards.",
    learnMoreHref: "#",
  },
];

export function LandingDoMore() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-3">
            Do more with Kanban
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Supercharge your workflow
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Simplify processes and get more done. No matter the size of your team or business,
            Kanban has a solution for you.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {DO_MORE_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.id} className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-blue-600" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed flex-1">
                  {feature.description}
                </p>
                <Link
                  href={feature.learnMoreHref}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors self-start"
                  aria-label={`Learn more about ${feature.title}`}
                >
                  Learn more →
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
