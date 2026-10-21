import { LinkedInIcon, TwitterIcon } from "@/components/home/icons";
import { cx } from "@/components/ui";
import { links } from "@/lib/links";

const profiles = [
  { href: links.creator.linkedin, label: "Dylan Jones on LinkedIn", Icon: LinkedInIcon },
  { href: links.creator.twitter, label: "Dylan Jones on Twitter", Icon: TwitterIcon },
];

/** Who made Loro, in one line: a photo, a link to their site and their profiles. */
export function Creator({ className }: { className?: string }) {
  return (
    <div className={cx("flex items-center gap-2.5 text-[15px] text-slate", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export; images are pre-sized */}
      <img
        src="/dylan.png"
        alt=""
        width={28}
        height={28}
        className="size-7 shrink-0 rounded-full object-cover ring-1 ring-hairline"
      />
      <p>
        Made by{" "}
        <a
          href={links.creator.site}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-ink underline decoration-hairline underline-offset-4 transition-colors hover:decoration-stone"
        >
          Dylan Jones
        </a>
      </p>
      <ul className="ml-1 flex items-center gap-1">
        {profiles.map(({ href, label, Icon }) => (
          <li key={href}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="flex size-7 items-center justify-center rounded-full text-quiet transition-colors hover:bg-cream hover:text-ink"
            >
              <Icon className="size-[15px]" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
