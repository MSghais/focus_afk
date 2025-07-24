import React from "react";

type IconName = "add" | "create" | "search" | "user" | "settings" | "home" | "login" | "refresh" | "lfg" | "mentoring" | "list" | "questMap" | "badge";

const iconPaths: Record<IconName, React.ReactNode> = {
  add: (
    <>
      <path d="M12 4v16m8-8H4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  create: (
    <>
      <rect x="11" y="4" width="2" height="16" fill="currentColor" />
      <rect x="4" y="11" width="16" height="2" fill="currentColor" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <rect x="6" y="16" width="12" height="4" rx="2" fill="currentColor" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 9 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="currentColor" strokeWidth="2"/>
    </>
  ),
  home: (
    <>
      <path d="M19 21v-2a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M22 9l-10-7-10 7L2 11v12h20V11L22 9z" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="none" stroke="currentColor" strokeWidth="2"/>
    </>
  ),
  login: (
    <>
      <path d="M19 21v-2a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M22 9l-10-7-10 7L2 11v12h20V11L22 9z" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="none" stroke="currentColor" strokeWidth="2"/>
    </>
  ),
  refresh: (
    <>
      {/* Circular arrow for refresh */}
      <path
        d="M17.65 6.35A8 8 0 1 0 20 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="21 6 17 6 17 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  lfg: (
    <>
      <path d="M19 21v-2a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M22 9l-10-7-10 7L2 11v12h20V11L22 9z" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="none" stroke="currentColor" strokeWidth="2"/>
    </>
  ),

  mentoring: (
    <>
      <path d="M19 21v-2a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M22 9l-10-7-10 7L2 11v12h20V11L22 9z" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="none" stroke="currentColor" strokeWidth="2"/>
    </>
  ),
  list: (
    <>
      <rect x="4" y="6" width="16" height="2" rx="1" fill="currentColor" />
      <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor" />
      <rect x="4" y="16" width="16" height="2" rx="1" fill="currentColor" />
    </>
  ),
  // Quest icon for game: a map with a location marker
  questMap: (
    <>
      {/* Map outline */}
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
      {/* Fold lines */}
      <path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="2" fill="none"/>
      {/* Location marker */}
      <path
        d="M12 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 0c0 2.5 2 4.5 2 4.5s2-2 2-4.5a4 4 0 1 0-8 0c0 2.5 2 4.5 2 4.5s2-2 2-4.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </>
  ),
  badge: (
    <>
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 20v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 22v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  )
};

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
}

export function Icon({ name, size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}


export default function IconCreate() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="11" y="4" width="2" height="16" fill="currentColor" />
      <rect x="4" y="11" width="16" height="2" fill="currentColor" />
    </svg>
  );
}

export function IconUser() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <rect x="6" y="16" width="12" height="4" rx="2" fill="currentColor" />
    </svg>
  );
}

export function IconSettings() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >       
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 9 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

export function IconHome() {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >       
        <path d="M19 21v-2a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M22 9l-10-7-10 7L2 11v12h20V11L22 9z" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="none" stroke="currentColor" strokeWidth="2"/>
      </svg>
    );
  }