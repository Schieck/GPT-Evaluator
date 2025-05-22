import type { ChangeEvent } from 'react';

interface TextAreaProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    rows?: number;
    disabled?: boolean;
}

export const TextArea = ({
    value,
    onChange,
    placeholder,
    className = '',
    rows = 5,
    disabled = false
}: TextAreaProps) => {
    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
    };

    return (
        <textarea
            className={`w-full p-3 bg-zinc-900 text-sm resize-none border-0 rounded-md focus:ring-1 focus:ring-orange-500 focus:outline-none placeholder-zinc-600 ${className}`}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            rows={rows}
            disabled={disabled}
        />
    );
}; 