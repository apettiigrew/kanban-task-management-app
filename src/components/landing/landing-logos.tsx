interface CompanyLogo {
  id: string;
  name: string;
}

const COMPANY_LOGOS: CompanyLogo[] = [
  { id: "visa", name: "VISA" },
  { id: "coinbase", name: "Coinbase" },
  { id: "zoom", name: "Zoom" },
  { id: "fender", name: "Fender" },
  { id: "grand", name: "Grand" },
];

export function LandingLogos() {
  return (
    <section className="bg-white py-14 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-slate-500 mb-8">
          Trusted by teams at world-class companies
        </p>
        <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16">
          {COMPANY_LOGOS.map((company) => (
            <span
              key={company.id}
              className="text-xl sm:text-2xl font-bold text-slate-300 tracking-wide select-none"
              aria-label={company.name}
            >
              {company.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
