import React from "react";

type IconName = "add" | "create" | "search" | "search-active" | "user" | 
"settings" | "home" | "login" | "refresh" | "lfg" | "mentoring" | "list" 
| "questMap" | "badge" | "eye" | "remove" | "lfg-complete" | "calendar" | 
"filter" | "sort" | "chevron-up" | "chevron-down" | "drag" | "sort-asc" | "sort-desc" | "chevron-left" | "chevron-right" | 
"close" | "check" | "edit" | "archive" | "delete" | "copy" | "more" | "tag" | "clock" | "undo" ;

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
      <polygon points="12,6 13,11 18,12 13,13 12,18 11,13 6,12 11,11" fill="currentColor" />
      <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="2" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </>
  ),
  "lfg-complete" : (
    <>
      <polygon points="12,6 13,11 18,12 13,13 12,18 11,13 6,12 11,11" fill="currentColor" />
      <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="2" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
  ),
  eye: (
    <>
      <path d="M12 12m-1 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" fill="currentColor" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 0 0-18 0z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  remove: (
    <>
      <path d="M19 11l-7-7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="5" y1="11" x2="19" y2="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  calendar: (
    <>
      <path d="M19 21v-2a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M22 9l-10-7-10 7L2 11v12h20V11L22 9z" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="none" stroke="currentColor" strokeWidth="2"/>
    </>
  ),
  filter: (
    <>
      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  sort: (
    <>
      <path d="M3 6h18M6 12h12M9 18h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "chevron-up": (
    <>
      <polyline points="18,15 12,9 6,15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "chevron-down": (
    <>
      <polyline points="6,9 12,15 18,9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  drag: (
    <>
      <circle cx="9" cy="5" r="1" fill="currentColor"/>
      <circle cx="9" cy="12" r="1" fill="currentColor"/>
      <circle cx="9" cy="19" r="1" fill="currentColor"/>
      <circle cx="15" cy="5" r="1" fill="currentColor"/>
      <circle cx="15" cy="12" r="1" fill="currentColor"/>
      <circle cx="15" cy="19" r="1" fill="currentColor"/>
    </>
  ),
  "sort-asc": (
    <>
      <path d="M3 6h18M6 12h12M9 18h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="18,15 12,9 6,15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "sort-desc": (
    <>
      <path d="M3 6h18M6 12h12M9 18h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="6,9 12,15 18,9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "chevron-left": (
    <>
      <polyline points="15,18 9,12 15,6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "chevron-right": (
    <>
      <polyline points="9,18 15,12 9,6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "close": (
    <>
      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "check": (
    <>
      <polyline points="20,6 9,17 4,12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "edit": (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "archive": (
    <>
      <rect x="3" y="4" width="18" height="4" rx="2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 12h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "delete": (
    <>
      <polyline points="3,6 5,6 21,6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "copy": (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "more": (
    <>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
      <circle cx="19" cy="12" r="1" fill="currentColor"/>
      <circle cx="5" cy="12" r="1" fill="currentColor"/>
    </>
  ),
  "tag": (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "clock": (
    <>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="12,6 12,12 16,14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "undo": (
    <>
      <path d="M3 7v6h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  "search-active": (
    <>
      <path d="M19 11l-7-7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="5" y1="11" x2="19" y2="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
  className?: string;
}

export function Icon({ name, size = 24, className, ...props }: IconProps) {


  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      color="var(--text-primary)"
      className={className}
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