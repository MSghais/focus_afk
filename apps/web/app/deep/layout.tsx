export default function DeepModeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
            {children}
        </div>
    );
} 