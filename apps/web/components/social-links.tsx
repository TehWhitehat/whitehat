export const socialLinks = [
  ["X", "https://x.com/whitehatrh"],
  ["GitHub", "https://github.com/TehWhitehat/whitehat"],
] as const;

export function SocialLinks() {
  return <span className="inline-flex items-center gap-4 text-sm text-muted">
    {socialLinks.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="nav-link" aria-label={`WHITEHAT on ${name} (opens in a new tab)`}>{name}<span className="ml-1 text-mint" aria-hidden="true">↗</span></a>)}
  </span>;
}
