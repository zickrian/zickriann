export function VerifiedIcon({
  className = "",
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 22 22"
      className={className}
      aria-label="Verified account"
      role="img"
      {...props}
    >
      <defs>
        <linearGradient
          id="x_gold_paint0"
          x1="4"
          y1="1.5"
          x2="19.5"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F4E72A" />
          <stop offset="0.539" stopColor="#CD8105" />
          <stop offset="0.68" stopColor="#CB7B00" />
          <stop offset="1" stopColor="#F4EC26" />
        </linearGradient>
        <linearGradient
          id="x_gold_paint1"
          x1="5"
          y1="2.5"
          x2="17.5"
          y2="19.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F9E87F" />
          <stop offset="0.406" stopColor="#E2B719" />
          <stop offset="0.989" stopColor="#E2B719" />
        </linearGradient>
      </defs>
      <g>
        {/* Layer 1: Bevel Gold Outer Base */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13.596 3.011L11 .5 8.404 3.011l-3.576-.506-.624 3.558-3.19 1.692L2.6 11l-1.586 3.245 3.19 1.692.624 3.558 3.576-.506L11 21.5l2.596-2.511 3.576.506.624-3.558 3.19-1.692L19.4 11l1.586-3.245-3.19-1.692-.624-3.558-3.576.506z"
          fill="url(#x_gold_paint0)"
        />
        {/* Layer 2: Main Rich Gold Gradient Body */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13.348 3.772L11 1.5 8.651 3.772l-3.235-.458-.565 3.219-2.886 1.531L3.4 11l-1.435 2.936 2.886 1.531.565 3.219 3.235-.458L11 20.5l2.348-2.272 3.236.458.564-3.219 2.887-1.531L18.6 11l1.435-2.936-2.887-1.531-.564-3.219-3.236.458z"
          fill="url(#x_gold_paint1)"
        />
        {/* Layer 3: Drop Shadow on Checkmark Edge */}
        <path
          d="M9.662 15.65 6.233 12.22l1.414-1.414 2.015 2.015 4.336-4.73 1.47 1.348-5.806 6.21z"
          fill="#D18800"
        />
        {/* Layer 4: Bold Black Checkmark */}
        <path
          d="M9.662 14.85 6.233 11.42l1.414-1.414 2.015 2.015 4.336-4.73 1.47 1.348-5.806 6.21z"
          fill="#000000"
        />
      </g>
    </svg>
  )
}
