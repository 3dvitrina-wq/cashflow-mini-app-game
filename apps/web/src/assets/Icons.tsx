import React from 'react';

type IconProps = {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

const wrap = (children: React.ReactNode, size: number, className?: string, style?: React.CSSProperties) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    style={{ flexShrink: 0, ...style }}
    aria-hidden="true"
  >
    {children}
  </svg>
);

// ─────── TOP BAR ───────

export const IconMenu: React.FC<IconProps> = ({ size = 18, className, style }) =>
  wrap(
    <g fill="currentColor">
      <rect x="3" y="5" width="18" height="2.2" rx="1.1" />
      <rect x="3" y="11" width="18" height="2.2" rx="1.1" />
      <rect x="3" y="17" width="18" height="2.2" rx="1.1" />
    </g>,
    size,
    className,
    style
  );

export const IconDots: React.FC<IconProps> = ({ size = 18, className, style }) =>
  wrap(
    <g fill="currentColor">
      <circle cx="12" cy="5.5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="18.5" r="1.6" />
    </g>,
    size,
    className,
    style
  );

export const IconTimer: React.FC<IconProps> = ({ size = 14, className, style }) =>
  wrap(
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <path d="M7 3h10M7 21h10" />
      <path d="M8 3v3.5c0 2 1 3 4 5.5 3 2.5 4 3.5 4 5.5V21" />
      <path d="M16 3v3.5c0 2-1 3-4 5.5-3 2.5-4 3.5-4 5.5V21" />
      <path d="M9.2 17.2c1.2-1.4 4.4-1.4 5.6 0" />
    </g>,
    size,
    className,
    style
  );

export const IconUsers: React.FC<IconProps> = ({ size = 14, className, style }) =>
  wrap(
    <g fill="currentColor">
      <circle cx="8.5" cy="8" r="3.2" />
      <path d="M2.5 19c0-3.5 2.7-5.5 6-5.5s6 2 6 5.5v.8H2.5z" />
      <circle cx="16.5" cy="9" r="2.6" />
      <path d="M15 13.6c2.5 0 6 1.4 6 4.4v1.4h-5.2v-1c0-2-.7-3.5-2-4.5l1.2-.3z" />
    </g>,
    size,
    className,
    style
  );

// ─────── STATS ───────

export const IconCoin: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <g>
      <circle cx="12" cy="12" r="9" fill="#F5C524" />
      <circle cx="12" cy="12" r="9" fill="none" stroke="#A77810" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="#A77810" strokeWidth="0.8" />
      <path d="M12 7v10M9.5 9c0-1 1-1.5 2.5-1.5s2.5.7 2.5 1.8c0 2.5-5 1.5-5 3.7s1.2 2 2.5 2 2.5-.5 2.5-1.5" fill="none" stroke="#A77810" strokeWidth="1.4" strokeLinecap="round" />
    </g>,
    size,
    className,
    style
  );

export const IconChart: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <g>
      <rect x="3.5" y="13" width="3.5" height="7.5" rx="0.7" fill="#28C76F" />
      <rect x="10.2" y="9.5" width="3.5" height="11" rx="0.7" fill="#34D399" />
      <rect x="16.9" y="5" width="3.5" height="15.5" rx="0.7" fill="#5BE795" />
      <path d="M3 8.5l4.5-3 4.2 2.2L18 3l3 1.5" fill="none" stroke="#F5F4ED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>,
    size,
    className,
    style
  );

export const IconSprout: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <g>
      <path d="M12 21v-9" stroke="#5DAE63" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M12 12c-3-1-5-4-4-7 3 0 5.5 2.5 4 7z" fill="#34D399" />
      <path d="M12 13c2.5-1.5 5-1 6-3-1.5-2-4.5-1.5-6 3z" fill="#28C76F" />
      <ellipse cx="12" cy="21.2" rx="5" ry="1.2" fill="#7B5230" />
    </g>,
    size,
    className,
    style
  );

export const IconStress: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <g>
      <circle cx="12" cy="12" r="9" fill="#E84B2A" />
      <path d="M8 9l3 1.5M16 9l-3 1.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 16c1-1.2 4.5-1.2 6 0" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M8 4c.5 1 1 1.5 1.5 2M16 4c-.5 1-1 1.5-1.5 2" stroke="#E84B2A" strokeWidth="1.6" strokeLinecap="round" />
    </g>,
    size,
    className,
    style
  );

export const IconTrust: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <g>
      <path d="M3 11l4 3 5-1 3-3 3 1 3-2v6l-3 2-3-1-3 3-5-1-4-3z" fill="#F5C524" stroke="#A77810" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M9 11l3-1 2 1" stroke="#A77810" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </g>,
    size,
    className,
    style
  );

export const IconDebt: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <g>
      <path d="M12 4v16" stroke="#D7445B" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 8h14" stroke="#D7445B" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 8l-2 5h6l-2-5M19 8l-2 5h6l-2-5" fill="#E84B2A" stroke="#A52A1A" strokeWidth="1" strokeLinejoin="round" />
      <rect x="9" y="19" width="6" height="2" rx="0.4" fill="#D7445B" />
    </g>,
    size,
    className,
    style
  );

// ─────── BUSINESS / PROTECTIONS / LEVEL ───────

export const IconStar: React.FC<IconProps> = ({ size = 14, className, style }) =>
  wrap(
    <path
      d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6L3.2 9.5l6.1-.9z"
      fill="#F5C524"
      stroke="#A77810"
      strokeWidth="1"
      strokeLinejoin="round"
    />,
    size,
    className,
    style
  );

export const IconShop: React.FC<IconProps> = ({ size = 18, className, style }) =>
  wrap(
    <g>
      <path d="M3 9l1.5-4h15L21 9z" fill="#D77F4B" stroke="#6F3F1F" strokeWidth="1" strokeLinejoin="round" />
      <path d="M5 9c0 1.5-1 2.5-2 2.5 0 1 1.5 2 3 1 .5-.5 1-1.5 1-2.5M9 9c0 1.5-1 2.5-2 2.5s-1-1-1-2.5M13 9c0 1.5-1 2.5-2 2.5s-1-1-1-2.5M17 9c0 1.5-1 2.5-2 2.5s-1-1-1-2.5M21 9c0 1.5-.5 2.5-2 2.5-1.5 1-3 0-3-1-.5-.5-1-1.5-1-2.5" fill="none" stroke="#6F3F1F" strokeWidth="1" />
      <rect x="4" y="11" width="16" height="9" fill="#E8C290" stroke="#6F3F1F" strokeWidth="1" />
      <rect x="9.5" y="13" width="5" height="7" fill="#6F3F1F" />
      <rect x="9.5" y="13" width="5" height="7" fill="none" stroke="#3F1F0F" strokeWidth="0.8" />
    </g>,
    size,
    className,
    style
  );

export const IconShield: React.FC<IconProps> = ({ size = 18, className, style }) =>
  wrap(
    <g>
      <path d="M12 3l8 2v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z" fill="#3D8A4A" stroke="#1F4B22" strokeWidth="1" strokeLinejoin="round" />
      <path d="M8 12l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>,
    size,
    className,
    style
  );

export const IconUmbrella: React.FC<IconProps> = ({ size = 18, className, style }) =>
  wrap(
    <g>
      <path d="M3 12c0-5 4-8 9-8s9 3 9 8z" fill="#5BA0D7" stroke="#1F4F76" strokeWidth="1" strokeLinejoin="round" />
      <path d="M7 12c1-3 3-5 5-5M17 12c-1-3-3-5-5-5M12 4v8" stroke="#1F4F76" strokeWidth="1" fill="none" />
      <path d="M12 12v6c0 1.5-1 2.5-2.5 2.5S7 19.5 7 18" stroke="#3F2017" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </g>,
    size,
    className,
    style
  );

export const IconDoc: React.FC<IconProps> = ({ size = 18, className, style }) =>
  wrap(
    <g>
      <path d="M5 3h9l5 5v13H5z" fill="#F5E9D0" stroke="#A77810" strokeWidth="1" strokeLinejoin="round" />
      <path d="M14 3v5h5" fill="none" stroke="#A77810" strokeWidth="1" />
      <path d="M8 12h8M8 15h8M8 18h5" stroke="#A77810" strokeWidth="1.2" strokeLinecap="round" />
    </g>,
    size,
    className,
    style
  );

// ─────── CRISIS / CARD ───────

export const IconAlert: React.FC<IconProps> = ({ size = 14, className, style }) =>
  wrap(
    <g>
      <path d="M12 3l10 17H2z" fill="#fff" />
      <path d="M12 9v6M12 17.5v0.5" stroke="#E84B2A" strokeWidth="2" strokeLinecap="round" />
    </g>,
    size,
    className,
    style
  );

export const IconNoWifi: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <g fill="none" stroke="#3F2017" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10c5-5 13-5 18 0" />
      <path d="M6 13.5c4-3.5 8-3.5 12 0" />
      <path d="M9 17c2-1.5 4-1.5 6 0" />
      <circle cx="12" cy="20" r="0.8" fill="#3F2017" />
      <path d="M3 3l18 18" stroke="#E84B2A" strokeWidth="2" />
    </g>,
    size,
    className,
    style
  );

// ─────── SURVIVAL CHOICES ───────

export const IconGlobe: React.FC<IconProps> = ({ size = 20, className, style }) =>
  wrap(
    <g>
      <circle cx="12" cy="12" r="9" fill="#5BA0D7" stroke="#1F4F76" strokeWidth="1.2" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" fill="none" stroke="#1F4F76" strokeWidth="1" />
      <path d="M5 7c2 1 4 1.5 7 1.5s5-.5 7-1.5M5 17c2-1 4-1.5 7-1.5s5 .5 7 1.5" fill="none" stroke="#1F4F76" strokeWidth="1" />
    </g>,
    size,
    className,
    style
  );

export const IconMask: React.FC<IconProps> = ({ size = 20, className, style }) =>
  wrap(
    <g>
      <path d="M4 8c0-2 2-3 4-3 1.5 0 3 .5 4 1.5C13 5.5 14.5 5 16 5c2 0 4 1 4 3 0 4-2 8-4 9-1.5.5-3 0-4-1-1 1-2.5 1.5-4 1-2-1-4-5-4-9z" fill="#E8B5C0" stroke="#A52A4F" strokeWidth="1" />
      <ellipse cx="9" cy="11" rx="1.4" ry="1.8" fill="#fff" />
      <ellipse cx="15" cy="11" rx="1.4" ry="1.8" fill="#fff" />
      <circle cx="9" cy="11.3" r="0.7" fill="#1A1207" />
      <circle cx="15" cy="11.3" r="0.7" fill="#1A1207" />
      <path d="M9 16c1 1 5 1 6 0" stroke="#A52A4F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </g>,
    size,
    className,
    style
  );

export const IconBox: React.FC<IconProps> = ({ size = 20, className, style }) =>
  wrap(
    <g>
      <path d="M3 8l9-4 9 4-9 4z" fill="#C9956A" stroke="#6F3F1F" strokeWidth="1" strokeLinejoin="round" />
      <path d="M3 8v10l9 4v-10z" fill="#A77848" stroke="#6F3F1F" strokeWidth="1" strokeLinejoin="round" />
      <path d="M21 8v10l-9 4v-10z" fill="#D7A66F" stroke="#6F3F1F" strokeWidth="1" strokeLinejoin="round" />
      <path d="M7 6l9 4" stroke="#6F3F1F" strokeWidth="1" />
    </g>,
    size,
    className,
    style
  );

// ─────── ACTION BUTTONS ───────

export const IconHandshake: React.FC<IconProps> = ({ size = 24, className, style }) =>
  wrap(
    <g>
      <path d="M2 11l4-3 3 1 3 3-2 2c-1 1-3 1-4 0z" fill="#F2C29B" stroke="#7F3F1F" strokeWidth="1" strokeLinejoin="round" />
      <path d="M22 11l-4-3-3 1-3 3 2 2c1 1 3 1 4 0z" fill="#F2C29B" stroke="#7F3F1F" strokeWidth="1" strokeLinejoin="round" />
      <path d="M9 12l3 3 3-3" stroke="#7F3F1F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>,
    size,
    className,
    style
  );

export const IconHand: React.FC<IconProps> = ({ size = 24, className, style }) =>
  wrap(
    <g>
      <path d="M9 4v6M11.5 3v7M14 3v7M16.5 5v6" stroke="#7F3F1F" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M7 9c0-1 1.5-1 1.5 0v3l-1.5-1c-1-.5-2.5 0-2.5 1.5 0 3 3 7 6 8h4c2 0 4-2 4-4V8c0-1-1.5-1-1.5 0" fill="#F2C29B" stroke="#7F3F1F" strokeWidth="1.2" strokeLinejoin="round" />
    </g>,
    size,
    className,
    style
  );

export const IconMegaphone: React.FC<IconProps> = ({ size = 24, className, style }) =>
  wrap(
    <g>
      <path d="M3 9v6l13 5V4z" fill="#F5C524" stroke="#7F3F1F" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="3" y="9" width="3" height="6" fill="#A77810" />
      <path d="M16 8c2 1 2 7 0 8" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M19 6c4 2 4 10 0 12" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </g>,
    size,
    className,
    style
  );

export const IconChaosMask: React.FC<IconProps> = ({ size = 24, className, style }) =>
  wrap(
    <g>
      <path d="M5 8c0-2 2-3 4-3 1.5 0 3 .5 4 1.5C13 5.5 14.5 5 16 5c2 0 4 1 4 3 0 5-3 10-7 10h-1c-4 0-7-5-7-10z" fill="#fff" stroke="#1A1207" strokeWidth="1.2" />
      <path d="M7 11l3 2-3 2zM17 11l-3 2 3 2z" fill="#1A1207" />
      <path d="M11 15c0 1 1 1.5 2 0" stroke="#1A1207" strokeWidth="1" strokeLinecap="round" fill="none" />
    </g>,
    size,
    className,
    style
  );

// ─────── EPOCH ───────

export const IconSnowflake: React.FC<IconProps> = ({ size = 14, className, style }) =>
  wrap(
    <g fill="none" stroke="#9DEBF1" strokeWidth="1.4" strokeLinecap="round">
      <path d="M12 3v18M3 12h18M5 5l14 14M19 5L5 19" />
      <path d="M9 4l3-2 3 2M9 20l3 2 3-2M4 9l-2 3 2 3M20 9l2 3-2 3" />
    </g>,
    size,
    className,
    style
  );

// ─────── PLAYER MOOD BADGES ───────

export const IconCheck: React.FC<IconProps> = ({ size = 10, className, style }) =>
  wrap(
    <path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />,
    size,
    className,
    style
  );

export const IconExclaim: React.FC<IconProps> = ({ size = 10, className, style }) =>
  wrap(
    <g fill="currentColor">
      <rect x="10.5" y="4" width="3" height="10" rx="1.5" />
      <circle cx="12" cy="18" r="1.8" />
    </g>,
    size,
    className,
    style
  );

// ─────── HOST ───────

export const IconMic: React.FC<IconProps> = ({ size = 11, className, style }) =>
  wrap(
    <g>
      <rect x="9" y="3" width="6" height="11" rx="3" fill="#C7B7FF" />
      <path d="M6 11c0 3.5 2.5 6 6 6s6-2.5 6-6M12 17v3M9 21h6" stroke="#C7B7FF" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </g>,
    size,
    className,
    style
  );

// ─────── DEAL MODAL ───────

export const IconClose: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
    size,
    className,
    style
  );

export const IconHelp: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9c0-2 1.5-3 3-3s3 1 3 2.5c0 2-3 2-3 4M12 17v1" />
    </g>,
    size,
    className,
    style
  );

export const IconInfo: React.FC<IconProps> = ({ size = 14, className, style }) =>
  wrap(
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <circle cx="12" cy="8" r="0.6" fill="currentColor" />
    </g>,
    size,
    className,
    style
  );

export const IconChevronDown: React.FC<IconProps> = ({ size = 14, className, style }) =>
  wrap(
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    size,
    className,
    style
  );

export const IconChevronRight: React.FC<IconProps> = ({ size = 14, className, style }) =>
  wrap(
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    size,
    className,
    style
  );

export const IconBuilding: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <g>
      <rect x="4" y="6" width="16" height="15" rx="0.5" fill="#5BA0D7" stroke="#1F4F76" strokeWidth="0.8" />
      <rect x="6" y="9" width="2" height="2" fill="#1F4F76" />
      <rect x="11" y="9" width="2" height="2" fill="#1F4F76" />
      <rect x="16" y="9" width="2" height="2" fill="#1F4F76" />
      <rect x="6" y="13" width="2" height="2" fill="#1F4F76" />
      <rect x="11" y="13" width="2" height="2" fill="#1F4F76" />
      <rect x="16" y="13" width="2" height="2" fill="#1F4F76" />
      <rect x="10" y="17" width="4" height="4" fill="#1F4F76" />
      <path d="M4 6l8-3 8 3" fill="#3D7AB6" stroke="#1F4F76" strokeWidth="0.8" strokeLinejoin="round" />
    </g>,
    size,
    className,
    style
  );

export const IconWarning: React.FC<IconProps> = ({ size = 18, className, style }) =>
  wrap(
    <g>
      <path d="M12 3l10 17H2z" fill="#F5C524" stroke="#A77810" strokeWidth="1" strokeLinejoin="round" />
      <path d="M12 10v5M12 17.5v0.5" stroke="#1A1207" strokeWidth="2" strokeLinecap="round" />
    </g>,
    size,
    className,
    style
  );

export const IconRadio: React.FC<IconProps & { checked?: boolean }> = ({ size = 16, checked, className, style }) =>
  wrap(
    <g>
      <circle cx="12" cy="12" r="8" fill="none" stroke={checked ? '#F5C524' : 'rgba(255,255,255,.3)'} strokeWidth="1.6" />
      {checked && <circle cx="12" cy="12" r="4" fill="#F5C524" />}
    </g>,
    size,
    className,
    style
  );

export const IconCheckCircle: React.FC<IconProps> = ({ size = 14, className, style }) =>
  wrap(
    <g>
      <circle cx="12" cy="12" r="9" fill="#F5C524" />
      <path d="M8 12l3 3 5-6" stroke="#1A1207" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>,
    size,
    className,
    style
  );

export const IconScalesEqual: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <g>
      <path d="M12 4v17" stroke="#F5C524" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 8h16" stroke="#F5C524" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 8l-2 5h6l-2-5M20 8l-2 5h6l-2-5" fill="#F5C524" stroke="#A77810" strokeWidth="1" strokeLinejoin="round" />
      <rect x="9" y="20" width="6" height="2" rx="0.4" fill="#F5C524" />
    </g>,
    size,
    className,
    style
  );

export const IconChatBubble: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <g>
      <path d="M3 6c0-1.5 1-2.5 2.5-2.5h13c1.5 0 2.5 1 2.5 2.5v8c0 1.5-1 2.5-2.5 2.5H10l-4 4v-4H5.5C4 16.5 3 15.5 3 14z" fill="#9DA5B5" />
      <circle cx="9" cy="10" r="0.9" fill="#1A1C22" />
      <circle cx="12" cy="10" r="0.9" fill="#1A1C22" />
      <circle cx="15" cy="10" r="0.9" fill="#1A1C22" />
    </g>,
    size,
    className,
    style
  );

export const IconIOU: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <g>
      <path d="M5 4l1.5-1 1.5 1 1.5-1 1.5 1 1.5-1 1.5 1 1.5-1 1.5 1 1.5-1 1.5 1v15l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1z" fill="#F5E9D0" stroke="#A77810" strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M8 9h8M8 12h6M8 15h4" stroke="#A77810" strokeWidth="1.2" strokeLinecap="round" />
    </g>,
    size,
    className,
    style
  );

export const IconBriefcase: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <g>
      <path d="M8 7V5.5C8 4.5 8.5 4 9.5 4h5C15.5 4 16 4.5 16 5.5V7" stroke="#7F3F1F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <rect x="3" y="7" width="18" height="12" rx="1.5" fill="#A05530" stroke="#5A2D14" strokeWidth="0.8" />
      <path d="M3 12h18" stroke="#5A2D14" strokeWidth="0.8" />
      <rect x="10" y="11" width="4" height="2.5" rx="0.4" fill="#F5C524" stroke="#A77810" strokeWidth="0.6" />
    </g>,
    size,
    className,
    style
  );

export const IconCounterChat: React.FC<IconProps> = ({ size = 18, className, style }) =>
  wrap(
    <g>
      <path d="M3 6c0-1.5 1-2.5 2.5-2.5h13c1.5 0 2.5 1 2.5 2.5v8c0 1.5-1 2.5-2.5 2.5H10l-4 4v-4H5.5C4 16.5 3 15.5 3 14z" fill="#7B5BD7" />
      <circle cx="9" cy="10" r="0.9" fill="#fff" />
      <circle cx="12" cy="10" r="0.9" fill="#fff" />
      <circle cx="15" cy="10" r="0.9" fill="#fff" />
    </g>,
    size,
    className,
    style
  );

export const IconDeclineX: React.FC<IconProps> = ({ size = 18, className, style }) =>
  wrap(
    <g>
      <circle cx="12" cy="12" r="9" fill="none" stroke="#E84B5B" strokeWidth="1.8" />
      <path d="M8 8l8 8M16 8l-8 8" stroke="#E84B5B" strokeWidth="2" strokeLinecap="round" />
    </g>,
    size,
    className,
    style
  );

export const IconAcceptShake: React.FC<IconProps> = ({ size = 20, className, style }) =>
  wrap(
    <g>
      <path d="M2 11l4-3 3 1 3 3-2 2c-1 1-3 1-4 0z" fill="#fff" stroke="#0E3B22" strokeWidth="1" strokeLinejoin="round" />
      <path d="M22 11l-4-3-3 1-3 3 2 2c1 1 3 1 4 0z" fill="#fff" stroke="#0E3B22" strokeWidth="1" strokeLinejoin="round" />
      <path d="M9 12l3 3 3-3" stroke="#0E3B22" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>,
    size,
    className,
    style
  );

// ─────── HERO ILLUSTRATIONS (deal kinds) ───────
// Compact, SVG-only, no external assets. Stylized to match cartoon vibe.

export const HeroWarehouse: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg viewBox="0 0 80 64" width={size} height={(size * 64) / 80} aria-hidden="true">
    <rect x="4" y="20" width="56" height="40" fill="#3B66A0" stroke="#1A2E4A" strokeWidth="1.2" rx="2" />
    <path d="M4 20l28-14 28 14" fill="#5780BA" stroke="#1A2E4A" strokeWidth="1.2" strokeLinejoin="round" />
    <rect x="14" y="38" width="36" height="22" fill="#1A2E4A" />
    <path d="M14 38h36M14 44h36M14 50h36M14 56h36" stroke="#3B66A0" strokeWidth="0.6" />
    <rect x="40" y="14" width="14" height="6" fill="#E84B2A" stroke="#7F1F12" strokeWidth="0.8" />
    <text x="47" y="18.5" textAnchor="middle" fill="#fff" fontSize="4.5" fontWeight="900">HUB</text>
    <rect x="62" y="44" width="14" height="12" rx="1.5" fill="#3B66A0" stroke="#1A2E4A" strokeWidth="1" />
    <rect x="64" y="46" width="6" height="5" fill="#9DBBDB" />
    <circle cx="65" cy="58" r="2.2" fill="#1A1207" stroke="#3F2E20" strokeWidth="0.6" />
    <circle cx="74" cy="58" r="2.2" fill="#1A1207" stroke="#3F2E20" strokeWidth="0.6" />
    <rect x="16" y="42" width="6" height="6" fill="#D77F4B" stroke="#6F3F1F" strokeWidth="0.6" />
    <rect x="24" y="42" width="6" height="6" fill="#D77F4B" stroke="#6F3F1F" strokeWidth="0.6" />
    <rect x="20" y="50" width="6" height="6" fill="#D77F4B" stroke="#6F3F1F" strokeWidth="0.6" />
    <rect x="32" y="48" width="8" height="8" fill="#D77F4B" stroke="#6F3F1F" strokeWidth="0.6" />
  </svg>
);

export const HeroStorefront: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg viewBox="0 0 80 64" width={size} height={(size * 64) / 80} aria-hidden="true">
    <rect x="6" y="22" width="68" height="38" fill="#7B5BD7" stroke="#352069" strokeWidth="1.2" />
    <path d="M6 22l4-10h60l4 10z" fill="#9F7AEA" stroke="#352069" strokeWidth="1.2" strokeLinejoin="round" />
    <rect x="12" y="28" width="20" height="22" fill="#E8D8FF" stroke="#352069" strokeWidth="0.8" />
    <rect x="48" y="28" width="20" height="22" fill="#E8D8FF" stroke="#352069" strokeWidth="0.8" />
    <rect x="32" y="32" width="16" height="28" fill="#352069" stroke="#1A0E33" strokeWidth="0.8" />
    <text x="40" y="48" textAnchor="middle" fill="#F5C524" fontSize="9" fontWeight="900">AI</text>
  </svg>
);

export const HeroCoffee: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg viewBox="0 0 80 64" width={size} height={(size * 64) / 80} aria-hidden="true">
    <ellipse cx="40" cy="58" rx="34" ry="4" fill="rgba(0,0,0,.25)" />
    <path d="M14 28h44v18c0 6-6 12-22 12s-22-6-22-12z" fill="#7B5230" stroke="#3A2418" strokeWidth="1.2" />
    <path d="M58 30c8 0 10 16 0 18" fill="none" stroke="#3A2418" strokeWidth="1.4" />
    <rect x="14" y="22" width="44" height="6" rx="1.5" fill="#A97444" stroke="#3A2418" strokeWidth="1" />
    <path d="M22 20c0-4 4-6 4-10M30 20c0-3 3-5 3-9M38 20c0-4 4-6 4-10" stroke="#F5E9D0" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7" />
  </svg>
);

export const HeroPod: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg viewBox="0 0 80 64" width={size} height={(size * 64) / 80} aria-hidden="true">
    {[0, 1, 2, 3].map((i) => (
      <g key={i}>
        <rect x={6 + i * 18} y="22" width="16" height="34" fill="#D77F4B" stroke="#6F3F1F" strokeWidth="1" />
        <rect x={8 + i * 18} y="28" width="12" height="22" fill="#A05530" stroke="#3F1F0F" strokeWidth="0.8" />
        <rect x={9 + i * 18} y="30" width="10" height="2" fill="#6F3F1F" />
      </g>
    ))}
    <rect x="2" y="56" width="76" height="4" fill="#3F2E20" />
  </svg>
);

export const HeroLicense: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg viewBox="0 0 80 64" width={size} height={(size * 64) / 80} aria-hidden="true">
    <rect x="10" y="10" width="60" height="44" rx="3" fill="#28C76F" stroke="#0E3B22" strokeWidth="1.2" />
    <rect x="14" y="14" width="52" height="36" rx="2" fill="#34D399" stroke="#0E3B22" strokeWidth="0.6" />
    <path d="M40 22l4 8 8 1-6 6 1 8-7-4-7 4 1-8-6-6 8-1z" fill="#F5C524" stroke="#A77810" strokeWidth="1" strokeLinejoin="round" />
    <text x="40" y="46" textAnchor="middle" fill="#0E3B22" fontSize="5" fontWeight="900">NFT LICENSE</text>
  </svg>
);

export const HeroAgency: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg viewBox="0 0 80 64" width={size} height={(size * 64) / 80} aria-hidden="true">
    <rect x="6" y="18" width="68" height="42" fill="#5BD7E0" stroke="#1F4F76" strokeWidth="1.2" />
    {[0, 1, 2, 3].map((row) =>
      [0, 1, 2, 3, 4, 5].map((col) => (
        <rect key={`${row}-${col}`} x={10 + col * 10} y={22 + row * 8} width="6" height="5" fill="#1F4F76" />
      ))
    )}
    <rect x="32" y="50" width="16" height="10" fill="#1F4F76" />
  </svg>
);

export const HeroCrypto: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg viewBox="0 0 80 64" width={size} height={(size * 64) / 80} aria-hidden="true">
    <circle cx="40" cy="32" r="24" fill="#F5C524" stroke="#A77810" strokeWidth="1.6" />
    <circle cx="40" cy="32" r="18" fill="none" stroke="#A77810" strokeWidth="1" />
    <text x="40" y="40" textAnchor="middle" fill="#A77810" fontSize="22" fontWeight="900" fontFamily="Inter">₿</text>
    <path d="M20 14l-6-6M60 14l6-6M20 50l-6 6M60 50l6 6" stroke="#7B5BD7" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const HeroLaundro: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg viewBox="0 0 80 64" width={size} height={(size * 64) / 80} aria-hidden="true">
    <rect x="6" y="14" width="68" height="46" fill="#34D399" stroke="#0E3B22" strokeWidth="1.2" />
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect x={10 + i * 22} y="22" width="18" height="30" fill="#E0F5EC" stroke="#0E3B22" strokeWidth="1" />
        <circle cx={19 + i * 22} cy="34" r="6" fill="#5BD7E0" stroke="#0E3B22" strokeWidth="0.8" />
        <circle cx={19 + i * 22} cy="34" r="3" fill="#fff" />
      </g>
    ))}
  </svg>
);

// ─────── LOBBY ───────

export const IconHourglass: React.FC<IconProps> = ({ size = 22, className, style }) =>
  wrap(
    <g>
      <rect x="6" y="3" width="12" height="2" rx="0.5" fill="#7F3F1F" />
      <rect x="6" y="19" width="12" height="2" rx="0.5" fill="#7F3F1F" />
      <path d="M7 5h10v3c0 2-2 3-4 4-2 1-4 2-4 4v3h10v-3c0-2-2-3-4-4-2-1-4-2-4-4z" fill="#F5C524" stroke="#A77810" strokeWidth="1" strokeLinejoin="round" />
      <path d="M9 6.5h6c-0.3 1.5-1.4 2.3-3 2.7-1.6 0.4-2.7 1.2-3 2.8z" fill="#F5A524" />
      <path d="M9 17.5h6c-0.3-1.5-1.4-2.3-3-2.7-1.6-0.4-2.7-1.2-3-2.8z" fill="#F5A524" />
    </g>,
    size,
    className,
    style
  );

export const IconHourglassMini: React.FC<IconProps> = ({ size = 18, className, style }) =>
  wrap(
    <g>
      <rect x="6" y="3" width="12" height="2" rx="0.5" fill="#fff" opacity="0.4" />
      <rect x="6" y="19" width="12" height="2" rx="0.5" fill="#fff" opacity="0.4" />
      <path d="M7 5h10v3c0 2-2 3-4 4-2 1-4 2-4 4v3h10v-3c0-2-2-3-4-4-2-1-4-2-4-4z" fill="#F5C524" stroke="#fff" strokeOpacity=".25" strokeWidth="0.8" strokeLinejoin="round" />
    </g>,
    size,
    className,
    style
  );

export const IconHourglassPurple: React.FC<IconProps> = ({ size = 22, className, style }) =>
  wrap(
    <g>
      <rect x="6" y="3" width="12" height="2" rx="0.5" fill="#3A2069" />
      <rect x="6" y="19" width="12" height="2" rx="0.5" fill="#3A2069" />
      <path d="M7 5h10v3c0 2-2 3-4 4-2 1-4 2-4 4v3h10v-3c0-2-2-3-4-4-2-1-4-2-4-4z" fill="#7B5BD7" stroke="#3A2069" strokeWidth="1" strokeLinejoin="round" />
      <path d="M9 6.5h6c-0.3 1.5-1.4 2.3-3 2.7-1.6 0.4-2.7 1.2-3 2.8z" fill="#C7B7FF" />
    </g>,
    size,
    className,
    style
  );

export const IconGear: React.FC<IconProps> = ({ size = 18, className, style }) =>
  wrap(
    <g>
      <path
        d="M12 2.5l1.5 2.2 2.6-0.7 0.8 2.6 2.6 0.8-0.7 2.6 2.2 1.5-2.2 1.5 0.7 2.6-2.6 0.8-0.8 2.6-2.6-0.7-1.5 2.2-1.5-2.2-2.6 0.7-0.8-2.6-2.6-0.8 0.7-2.6L1.5 12l2.2-1.5L3 7.9l2.6-0.8 0.8-2.6 2.6 0.7z"
        fill="#B8B6A9"
        stroke="#7D7B6F"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.4" fill="#0B0D11" stroke="#7D7B6F" strokeWidth="1" />
    </g>,
    size,
    className,
    style
  );

export const IconCrown: React.FC<IconProps> = ({ size = 20, className, style }) =>
  wrap(
    <g>
      <path
        d="M3 18l1.5-10 4.5 4 3-6 3 6 4.5-4L21 18z"
        fill="#F5C524"
        stroke="#A77810"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <rect x="3" y="18" width="18" height="3" rx="0.6" fill="#A77810" />
      <circle cx="4.5" cy="8" r="1.5" fill="#F5C524" stroke="#A77810" strokeWidth="0.8" />
      <circle cx="19.5" cy="8" r="1.5" fill="#F5C524" stroke="#A77810" strokeWidth="0.8" />
      <circle cx="12" cy="6" r="1.5" fill="#F5C524" stroke="#A77810" strokeWidth="0.8" />
      <circle cx="12" cy="14" r="1.2" fill="#E84B2A" />
    </g>,
    size,
    className,
    style
  );

export const IconBot: React.FC<IconProps> = ({ size = 22, className, style }) =>
  wrap(
    <g>
      <rect x="5" y="9" width="14" height="11" rx="2.5" fill="#B8B6A9" stroke="#5D5C53" strokeWidth="1" />
      <rect x="3" y="11" width="3" height="6" rx="1" fill="#7D7B6F" />
      <rect x="18" y="11" width="3" height="6" rx="1" fill="#7D7B6F" />
      <path d="M12 4v4M11 4h2" stroke="#5D5C53" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12" cy="3.5" r="1.2" fill="#28C76F" />
      <circle cx="9" cy="13" r="1.4" fill="#28C76F" />
      <circle cx="15" cy="13" r="1.4" fill="#28C76F" />
      <path d="M9 16.5c1 1 4 1 5.5 0" stroke="#5D5C53" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </g>,
    size,
    className,
    style
  );

export const IconPlusCircle: React.FC<IconProps> = ({ size = 22, className, style }) =>
  wrap(
    <g>
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1.5" strokeDasharray="3 2.5" />
      <path d="M12 7v10M7 12h10" stroke="rgba(255,255,255,.4)" strokeWidth="2" strokeLinecap="round" />
    </g>,
    size,
    className,
    style
  );

export const IconZigzagChart: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <path
      d="M3 16l4-6 4 4 4-9 3 5 3-2"
      fill="none"
      stroke="#F5C524"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />,
    size,
    className,
    style
  );

export const IconLightning: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <path d="M13 2L4 13h6l-1 9 9-12h-6z" fill="#F5C524" stroke="#A77810" strokeWidth="1" strokeLinejoin="round" />,
    size,
    className,
    style
  );

export const IconChatSmile: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <g>
      <path
        d="M3 6c0-1.5 1-2.5 2.5-2.5h13c1.5 0 2.5 1 2.5 2.5v8c0 1.5-1 2.5-2.5 2.5H10l-4 4v-4H5.5C4 16.5 3 15.5 3 14z"
        fill="#5BD7E0"
        stroke="#1F4F76"
        strokeWidth="0.8"
      />
      <circle cx="9" cy="10" r="1.2" fill="#1F4F76" />
      <circle cx="15" cy="10" r="1.2" fill="#1F4F76" />
      <path d="M8.5 13c1.2 1.2 5.8 1.2 7 0" stroke="#1F4F76" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </g>,
    size,
    className,
    style
  );

export const IconLink: React.FC<IconProps> = ({ size = 16, className, style }) =>
  wrap(
    <g fill="none" stroke="#5BD7E0" strokeWidth="1.8" strokeLinecap="round">
      <path d="M10 14l4-4" />
      <path d="M14.5 6.5l1-1c1.5-1.5 4-1.5 5.5 0s1.5 4 0 5.5l-3 3c-1.5 1.5-4 1.5-5.5 0" />
      <path d="M9.5 17.5l-1 1c-1.5 1.5-4 1.5-5.5 0s-1.5-4 0-5.5l3-3c1.5-1.5 4-1.5 5.5 0" />
    </g>,
    size,
    className,
    style
  );

export const IconPlay: React.FC<IconProps> = ({ size = 14, className, style }) =>
  wrap(
    <path d="M7 4l13 8-13 8z" fill="currentColor" />,
    size,
    className,
    style
  );

export const IconReadyDot: React.FC<IconProps> = ({ size = 8, className, style }) =>
  wrap(
    <circle cx="12" cy="12" r="6" fill="#28C76F" />,
    size,
    className,
    style
  );
