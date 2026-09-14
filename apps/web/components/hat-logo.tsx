import type { SVGProps } from "react";

/** Shared fedora silhouette; inherits the surrounding brand color. */
export function HatLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="30"
      height="30"
      {...props}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 18 10.2 7.8C10.4 6.8 11.3 6.3 12.2 6.6L16 8l3.8-1.4c.9-.3 1.8.2 2 1.2L24 18c-5.2 1.3-10.8 1.3-16 0Z" />
      <path d="m7.5 20-5 2c-.8.3-.9 1.3-.1 1.7 7.7 4.4 19.5 4.4 27.2 0 .8-.4.7-1.4-.1-1.7l-5-2c-5.6 1.5-11.4 1.5-17 0Z" />
    </svg>
  );
}
