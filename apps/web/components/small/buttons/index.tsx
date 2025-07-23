export function ButtonPrimary({ children, onClick, className }: { children: React.ReactNode, onClick?: () => void, className?: string }) {
    return <button className={` max-h-20 bg-[var(--brand-primary)]  justify-center rounded-md border-2 border-[var(--brand-primary)] p-4 flex items-center gap-2 hover:bg-[var(--brand-secondary)] text-white ${className}`} onClick={onClick}>
        {children}
    </button>;
}

export function ButtonSecondary({ children, onClick, className }: { children: React.ReactNode, onClick?: () => void, className?: string }) {
    return <button className={`border-2 border-[var(--brand-secondary)] justify-center rounded-md p-4 flex items-center gap-2 hover:bg-[var(--brand-primary)] ${className}`} onClick={onClick}>
        {children}
    </button>;
}