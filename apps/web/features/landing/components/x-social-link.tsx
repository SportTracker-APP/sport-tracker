const X_URL = "https://x.com/hovrenapp";

type XSocialLinkProps = {
  className?: string;
};

export function XSocialLink({ className }: XSocialLinkProps) {
  return (
    <a
      href={X_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Suivre HOVREN sur X"
      className={className}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M13.94 10.63 21.55 2h-1.8l-6.61 7.5L7.86 2H1.78l7.98 11.33L1.78 22h1.8l6.98-7.54L16.14 22h6.08l-8.28-11.37Zm-2.47 2.8-.8-1.12L4.23 3.32H7l5.2 7.26.8 1.12 6.75 9.42H17l-5.53-7.69Z" />
      </svg>
    </a>
  );
}
