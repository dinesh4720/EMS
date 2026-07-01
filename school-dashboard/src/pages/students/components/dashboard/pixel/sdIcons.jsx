import React from "react";

// Inline SVG icons ported 1:1 from the source design so stroke widths,
// view boxes and paths match the mock exactly (rather than swapping in a
// different icon library with subtly different geometry).

const stroke = (props) => ({
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  viewBox: "0 0 24 24",
  ...props,
});

export const IconPhone = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} {...stroke({ stroke: color })}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 11.5a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" />
  </svg>
);

export const IconMail = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} {...stroke({ stroke: color })}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
    <path d="m3 6 9 6 9-6" />
  </svg>
);

export const IconDownload = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} {...stroke({ stroke: color })}>
    <path d="M12 16V4M12 16l-4-4M12 16l4-4M5 20h14" />
  </svg>
);

export const IconDots = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <circle cx="12" cy="5" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="12" cy="19" r="1.7" />
  </svg>
);

export const IconEdit = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} {...stroke({ stroke: color })}>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);

export const IconCheck = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} {...stroke({ stroke: color })}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const IconUser = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} {...stroke({ stroke: color })}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
  </svg>
);

export const IconCap = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} {...stroke({ stroke: color })}>
    <path d="M22 10 12 5 2 10l10 5 10-5z" />
    <path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5" />
  </svg>
);

export const IconPin = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} {...stroke({ stroke: color })}>
    <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const IconHeart = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} {...stroke({ stroke: color })}>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

export const IconUsers = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} {...stroke({ stroke: color })}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
  </svg>
);

export const IconPlus = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} {...stroke({ stroke: color })}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconFile = ({ size = 17, color = "currentColor" }) => (
  <svg width={size} height={size} {...stroke({ stroke: color })}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);
