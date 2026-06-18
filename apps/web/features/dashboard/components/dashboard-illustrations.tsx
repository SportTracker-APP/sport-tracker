export function TopographicIllustration({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 180 120"
      fill="none"
      aria-hidden="true"
    >
      <path d="M4 96C26 66 42 72 60 48C77 25 95 22 111 44C124 61 139 58 176 18" />
      <path d="M0 106C24 80 45 89 65 64C83 42 96 41 114 58C129 72 146 70 180 39" />
      <path d="M8 114C34 94 55 101 75 80C93 61 108 60 125 74C140 86 155 83 176 64" />
      <path d="M44 87C61 69 70 55 83 37C96 55 104 67 119 84" />
    </svg>
  );
}

export function ForestLineIllustration({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 180 150"
      fill="none"
      aria-hidden="true"
    >
      <path d="M8 138H172" />
      <path d="M34 136V88" />
      <path d="M34 90L16 112H26L12 128H56L42 112H52L34 90Z" />
      <path d="M86 136V56" />
      <path d="M86 58L62 88H75L55 111H70L48 134H124L102 111H117L97 88H110L86 58Z" />
      <path d="M140 136V78" />
      <path d="M140 80L121 103H132L116 122H128L115 136H165L152 122H164L148 103H159L140 80Z" />
      <path d="M18 44C51 18 83 26 107 9C130 -7 153 2 174 18" />
    </svg>
  );
}
