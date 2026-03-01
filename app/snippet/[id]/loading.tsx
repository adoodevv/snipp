export default function SnippetLoading() {
    return (
        <div className="w-full pb-36 lg:pb-24">
            <header className="lg:hidden mb-6 flex justify-between items-center pb-4 border-b border-gray-200">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </header>
            <div className="mb-6 animate-pulse">
                <div className="h-9 w-64 sm:w-80 bg-gray-200 rounded mb-4" />
                <div className="flex flex-wrap gap-2 mb-2">
                    <div className="h-7 w-20 bg-gray-100 rounded-full" />
                    <div className="h-7 w-24 bg-gray-100 rounded-full" />
                    <div className="h-7 w-16 bg-gray-100 rounded-full" />
                </div>
                <div className="h-4 w-48 bg-gray-100 rounded" />
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden bg-white p-6 animate-pulse">
                <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
                <div className="h-[min(400px,60vh)] w-full bg-gray-100 rounded-lg" />
            </div>
        </div>
    );
}
