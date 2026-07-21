type VerifiedBadgeProps = {
  size?: number;
  className?: string;
};

export default function VerifiedBadge({
  size = 16,
  className = "",
}: VerifiedBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      title="Verified account"
      aria-label="Verified account"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 2.5L14.25 4.2L17.05 3.95L18.15 6.55L20.55 8L19.9 10.75L21.1 13.3L19 15.2L18.75 18L16.05 18.75L14.35 21L12 19.65L9.65 21L7.95 18.75L5.25 18L5 15.2L2.9 13.3L4.1 10.75L3.45 8L5.85 6.55L6.95 3.95L9.75 4.2L12 2.5Z"
          fill="#1D9BF0"
        />

        <path
          d="M8 12.1L10.55 14.65L16.2 9"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}