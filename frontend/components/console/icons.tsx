import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps) {
  return <svg fill="none" height="16" viewBox="0 0 16 16" width="16" {...props} />;
}

export function IconSidebar(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 3.5H6.5V12.5H3V3.5ZM9.5 3.5H13V7.5H9.5V3.5ZM9.5 9H13V12.5H9.5V9Z" fill="currentColor" />
    </BaseIcon>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M9.25 4.5V3.25H12.75V12.75H9.25V11.5H11.5V4.5H9.25ZM8.5 11L7.6 10.1L9.57 8.12H3V6.87H9.57L7.6 4.9L8.5 4L12 7.5L8.5 11Z"
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
      <rect height="9" rx="1" stroke="currentColor" width="11" x="2.5" y="3.5" />
      <path d="M2.5 6.75H13.5" stroke="currentColor" />
    </BaseIcon>
  );
}

export function IconNavAnalytics(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 12.5H13" stroke="currentColor" />
      <path d="M4.5 10V7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 10V5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11.5 10V4.5" stroke="currentColor" strokeWidth="1.5" />
    </BaseIcon>
  );
}

export function IconNavSettings(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M8 4.25C5.93 4.25 4.25 5.93 4.25 8C4.25 10.07 5.93 11.75 8 11.75C10.07 11.75 11.75 10.07 11.75 8C11.75 5.93 10.07 4.25 8 4.25ZM8 5.5C9.38 5.5 10.5 6.62 10.5 8C10.5 9.38 9.38 10.5 8 10.5C6.62 10.5 5.5 9.38 5.5 8C5.5 6.62 6.62 5.5 8 5.5Z"
        fill="currentColor"
      />
      <path
        d="M8 2.5L8.55 3.6C8.86 3.67 9.16 3.79 9.43 3.95L10.6 3.55L11.4 4.95L10.42 5.7C10.47 5.99 10.47 6.29 10.42 6.58L11.4 7.35L10.6 8.75L9.43 8.35C9.16 8.51 8.86 8.63 8.55 8.7L8 9.8L7.45 8.7C7.14 8.63 6.84 8.51 6.57 8.35L5.4 8.75L4.6 7.35L5.58 6.58C5.53 6.29 5.53 5.99 5.58 5.7L4.6 4.95L5.4 3.55L6.57 3.95C6.84 3.79 7.14 3.67 7.45 3.6L8 2.5Z"
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
      <rect height="8" rx="1.2" stroke="currentColor" width="11" x="2.5" y="4" />
      <path d="M2.5 6.5H13.5" stroke="currentColor" />
      <path d="M5 10.25H7.5" stroke="currentColor" />
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
