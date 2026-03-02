import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps) {
  return <svg fill="none" height="16" viewBox="0 0 16 16" width="16" {...props} />;
}

export function IconMenuOpen(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M2.5 4H13.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
      <path d="M2.5 8H13.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
      <path d="M2.5 12H13.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
    </BaseIcon>
  );
}

export function IconMenuClose(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 8H13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
      <path d="M7 4L3 8L7 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.3" />
    </BaseIcon>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M9.5 4.5V3H13V13H9.5V11.5H11.5V4.5H9.5ZM8 11L6.95 9.95L8.83 8.08H2.75V6.92H8.83L6.95 5.05L8 4L11.75 7.5L8 11Z"
        fill="currentColor"
      />
    </BaseIcon>
  );
}

export function IconUser(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M8 8.25C9.52 8.25 10.75 7.02 10.75 5.5C10.75 3.98 9.52 2.75 8 2.75C6.48 2.75 5.25 3.98 5.25 5.5C5.25 7.02 6.48 8.25 8 8.25ZM8 9.25C5.84 9.25 4 10.38 4 11.75V13.25H12V11.75C12 10.38 10.16 9.25 8 9.25Z"
        fill="currentColor"
      />
    </BaseIcon>
  );
}

export function IconNavDashboard(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect height="4.5" rx="0.8" stroke="currentColor" width="4.5" x="2.75" y="3" />
      <rect height="4.5" rx="0.8" stroke="currentColor" width="4.5" x="8.75" y="3" />
      <rect height="4.5" rx="0.8" stroke="currentColor" width="4.5" x="2.75" y="8.5" />
      <rect height="4.5" rx="0.8" stroke="currentColor" width="4.5" x="8.75" y="8.5" />
    </BaseIcon>
  );
}

export function IconNavAnalytics(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 12.5H13" stroke="currentColor" />
      <rect fill="currentColor" height="3.25" rx="0.6" width="2" x="4" y="8.5" />
      <rect fill="currentColor" height="5.25" rx="0.6" width="2" x="7" y="6.5" />
      <rect fill="currentColor" height="7.25" rx="0.6" width="2" x="10" y="4.5" />
    </BaseIcon>
  );
}

export function IconNavSettings(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M8 4.25C5.93 4.25 4.25 5.93 4.25 8C4.25 10.07 5.93 11.75 8 11.75C10.07 11.75 11.75 10.07 11.75 8C11.75 5.93 10.07 4.25 8 4.25ZM8 5.7C9.27 5.7 10.3 6.73 10.3 8C10.3 9.27 9.27 10.3 8 10.3C6.73 10.3 5.7 9.27 5.7 8C5.7 6.73 6.73 5.7 8 5.7Z"
        fill="currentColor"
      />
      <path
        d="M8 2.5V3.5M8 12.5V13.5M3.5 8H2.5M13.5 8H12.5M10.95 5.05L11.65 4.35M4.35 11.65L5.05 10.95M5.05 5.05L4.35 4.35M11.65 11.65L10.95 10.95"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseIcon>
  );
}

export function IconNavBilling(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect height="8" rx="1.4" stroke="currentColor" width="11" x="2.5" y="4" />
      <path d="M2.5 6.25H13.5" stroke="currentColor" />
      <rect fill="currentColor" height="1.5" rx="0.5" width="2.8" x="4.2" y="8.6" />
    </BaseIcon>
  );
}

export function IconCardStorage(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect height="7.5" rx="1.2" stroke="currentColor" width="10.5" x="2.75" y="4.25" />
      <path d="M4.5 7H11.5" stroke="currentColor" />
    </BaseIcon>
  );
}

export function IconCardContainers(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect height="4.5" stroke="currentColor" width="4.5" x="2.75" y="4.25" />
      <rect height="4.5" stroke="currentColor" width="4.5" x="8.75" y="7.25" />
    </BaseIcon>
  );
}

export function IconCardCost(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 10.5L6.2 5.5L8.6 9L12 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  );
}

export function IconCardCpu(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect height="7.5" rx="1.2" stroke="currentColor" width="7.5" x="4.25" y="4.25" />
      <path d="M8 2.5V4.25M8 11.75V13.5M2.5 8H4.25M11.75 8H13.5" stroke="currentColor" />
    </BaseIcon>
  );
}

export function IconHeadingUser(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M8 8.5C9.38 8.5 10.5 7.38 10.5 6C10.5 4.62 9.38 3.5 8 3.5C6.62 3.5 5.5 4.62 5.5 6C5.5 7.38 6.62 8.5 8 8.5ZM8 9.5C5.93 9.5 4.25 10.62 4.25 12V13H11.75V12C11.75 10.62 10.07 9.5 8 9.5Z"
        fill="currentColor"
      />
    </BaseIcon>
  );
}
