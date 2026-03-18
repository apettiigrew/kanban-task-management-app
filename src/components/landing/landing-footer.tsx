import Link from "next/link";
import { LayoutDashboard, Twitter, Linkedin, Github, Youtube } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  id: string;
  heading: string;
  links: FooterLink[];
}

interface SocialLink {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
}

const FOOTER_COLUMNS: FooterColumn[] = [
  // {
  //   id: "product",
  //   heading: "Product",
  //   links: [
  //     { label: "Features", href: "#features" },
  //     // { label: "Pricing", href: "#plans" },
  //     // { label: "What's new", href: "#" },
  //     // { label: "Changelog", href: "#" },
  //   ],
  // }
];

const SOCIAL_LINKS: SocialLink[] = [
  { id: "twitter", icon: Twitter, label: "Twitter", href: "#" },
  { id: "linkedin", icon: Linkedin, label: "LinkedIn", href: "#" },
  { id: "github", icon: Github, label: "GitHub", href: "#" },
  { id: "youtube", icon: Youtube, label: "YouTube", href: "#" },
];

export function LandingFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-white font-bold text-lg mb-4"
              aria-label="Kanban home"
            >
              <LayoutDashboard className="w-5 h-5 text-blue-400" aria-hidden="true" />
              <span>Kanban</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              Capture, organise, and tackle your to-dos from anywhere.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.id}>
              <h4 className="text-xs font-semibold text-slate-200 mb-4 uppercase tracking-wider">
                {col.heading}
              </h4>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-slate-200 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Kanban. All rights reserved.
          </p>
          {/* <div className="flex items-center gap-4">
            SOCIAL_LINKS.map(({ id, icon: Icon, label, href }) => (
              <Link
                key={id}
                href={href}
                aria-label={label}
                className="text-slate-500 hover:text-slate-200 transition-colors"
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </Link>
            ))}
          </div> */}
        </div>
      </div>
    </footer>
  );
}
