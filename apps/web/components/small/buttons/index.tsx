export function ButtonPrimary({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) {
    return <button className="bg-[var(--brand-primary)] rounded-md border-2 border-[var(--brand-primary)] p-4 flex items-center gap-2 hover:bg-[var(--brand-secondary)] text-white" onClick={onClick}>
        {children}
    </button>;
}

export function ButtonSecondary({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) {
    return <button className="border-2 border-[var(--brand-secondary)] rounded-md p-4 flex items-center gap-2 hover:bg-[var(--brand-primary)]" onClick={onClick}>
        {children}
    </button>;
}