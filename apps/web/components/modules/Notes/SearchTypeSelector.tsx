'use client';

interface SearchTypeSelectorProps {
  value: 'all' | 'articles' | 'research' | 'tutorials' | 'documentation';
  onChange: (value: 'all' | 'articles' | 'research' | 'tutorials' | 'documentation') => void;
  className?: string;
}

export default function SearchTypeSelector({ value, onChange, className = '' }: SearchTypeSelectorProps) {
  const options = [
    { value: 'all', label: 'All', icon: '🔍' },
    { value: 'articles', label: 'Articles', icon: '📰' },
    { value: 'research', label: 'Research', icon: '🔬' },
    { value: 'tutorials', label: 'Tutorials', icon: '📚' },
    { value: 'documentation', label: 'Documentation', icon: '📖' }
  ] as const;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
            value === option.value
              ? ' text-primary-foreground border-primary'
              : ' text-muted-foreground border-border hover:bg-muted'
          }`}
        >
          <span className="mr-1">{option.icon}</span>
          {option.label}
        </button>
      ))}
    </div>
  );
} 