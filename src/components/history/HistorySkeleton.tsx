export default function HistorySkeleton() {
    return (
        <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="p-4 rounded-full bg-zinc-900/50 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">History Empty</h3>
            <p className="text-sm text-zinc-400 max-w-[280px]">
                Your validation history will appear here once you have performed some evaluations.
            </p>
        </div>
    )
}