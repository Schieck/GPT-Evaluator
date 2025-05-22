interface Props {
    count: number;
}

export default function ProviderCountTag({ count }: Props) {
    return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-zinc-800 text-zinc-400">
            {count} providers
        </span>
    );
} 