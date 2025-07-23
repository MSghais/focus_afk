export const formatTime = (minutes: number) => {
    if (minutes === 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes * 60) % 60);
    if (hours > 0) {
        return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
    }
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
};

export const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
};