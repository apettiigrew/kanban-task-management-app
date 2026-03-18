import Image from "next/image";
import Link from "next/link";

interface IntegrationCard {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  learnMoreHref: string;
}

const INTEGRATION_CARDS: IntegrationCard[] = [
  {
    id: "slack",
    title: "Slack",
    description:
      "Connect your favourite Slack channels and get instant Kanban notifications. Easily convert messages into actionable Kanban cards without leaving your conversation.",
    imageSrc: "https://placehold.co/480x280/f1f5f9/475569?text=Slack+Integration",
    imageAlt: "Kanban and Slack integration preview",
    learnMoreHref: "#",
  },
  {
    id: "teams",
    title: "Microsoft Teams",
    description:
      "Embed Kanban boards directly inside Microsoft Teams. Track project progress, assign tasks, and collaborate without ever switching between apps.",
    imageSrc: "https://placehold.co/480x280/f1f5f9/475569?text=Teams+Integration",
    imageAlt: "Kanban and Microsoft Teams integration preview",
    learnMoreHref: "#",
  },
];

export function LandingIntegrations() {
  return (
    <section id="solutions" className="bg-slate-50 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            From message to action
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Keep your team&apos;s work connected. Kanban integrates with the tools your team
            already uses every day so nothing slips through the cracks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {INTEGRATION_CARDS.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <Image
                src={card.imageSrc}
                alt={card.imageAlt}
                width={480}
                height={280}
                unoptimized
                className="w-full object-cover"
              />
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{card.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{card.description}</p>
                <Link
                  href={card.learnMoreHref}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  aria-label={`Learn more about ${card.title} integration`}
                >
                  Learn more →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
