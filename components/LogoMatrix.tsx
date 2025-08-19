"use client";

import React from "react";

export default function LogoMatrix({
  className = "h-7 w-7",
}: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00ff88" />
          <stop offset="1" stopColor="#00aa44" />
        </linearGradient>
        <radialGradient id="v" cx="50%" cy="45%" r="75%">
          <stop offset="0" stopColor="#0b0b0b" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
      </defs>

      <rect width="64" height="64" fill="url(#v)" rx="10" />

      <g filter="url(#glow)" opacity="0.85">
        <g transform="translate(10,6)">
          <rect x="0"  y="0"  width="2" height="52" fill="url(#g)" opacity="0.25" />
          <rect x="10" y="8"  width="2" height="46" fill="url(#g)" opacity="0.35" />
          <rect x="20" y="2"  width="2" height="54" fill="url(#g)" opacity="0.30" />
          <rect x="30" y="12" width="2" height="42" fill="url(#g)" opacity="0.40" />
          <rect x="40" y="0"  width="2" height="56" fill="url(#g)" opacity="0.25" />
        </g>

        <path
          d="M14 50 L14 16 L26 34 L38 16 L50 50"
          fill="none"
          stroke="url(#g)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

