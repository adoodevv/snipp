import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getSnippetsByUserId } from "@/lib/db";
import { createSnippet } from "@/app/actions/snippetActions";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";

interface NewSnippetPageProps {
    searchParams: Promise<{ error?: string; created?: string }>;
}

export default async function NewSnippetPage({ searchParams }: NewSnippetPageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const params = await searchParams;
    const error = params.error;
    const created = params.created;

    const snippets = await getSnippetsByUserId(user.id);

    async function handleSubmit(formData: FormData) {
        "use server";
        const result = await createSnippet(formData);
        if (result.success) {
            redirect(`/snippet/${result.snippetId}`);
        } else {
            redirect("/new?error=" + encodeURIComponent(result.error || "Failed to create snippet"));
        }
    }

    return (
        <DashboardLayout snippets={snippets} user={user}>
            <div className="w-full">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-2">
                        Create New Snippet
                    </h1>
                    <p className="text-sm sm:text-base" style={{ color: "#666666" }}>
                        Share your code snippets with the community or keep them private.
                    </p>
                </div>

                <div className="app-card">
                    {error && (
                        <div className="mb-4 sm:mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {created && (
                        <div className="mb-4 sm:mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                            Snippet created successfully! Redirecting...
                        </div>
                    )}

                    <form action={handleSubmit} className="space-y-4 sm:space-y-6">
                        <div>
                            <label htmlFor="title" className="app-input-label">
                                Title
                            </label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                required
                                placeholder="My awesome snippet"
                                className="app-input"
                            />
                        </div>

                        <div>
                            <label htmlFor="language" className="app-input-label">
                                Language
                            </label>
                            <select
                                id="language"
                                name="language"
                                className="app-input"
                                defaultValue="javascript"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="typescript">TypeScript</option>
                                <option value="python">Python</option>
                                <option value="rust">Rust</option>
                                <option value="go">Go</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                                <option value="c">C</option>
                                <option value="csharp">C#</option>
                                <option value="php">PHP</option>
                                <option value="ruby">Ruby</option>
                                <option value="swift">Swift</option>
                                <option value="kotlin">Kotlin</option>
                                <option value="html">HTML</option>
                                <option value="css">CSS</option>
                                <option value="scss">SCSS</option>
                                <option value="json">JSON</option>
                                <option value="yaml">YAML</option>
                                <option value="markdown">Markdown</option>
                                <option value="sql">SQL</option>
                                <option value="bash">Bash</option>
                                <option value="shell">Shell</option>
                                <option value="dockerfile">Dockerfile</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="code" className="app-input-label">
                                Code
                            </label>
                            <textarea
                                id="code"
                                name="code"
                                rows={12}
                                required
                                placeholder="// Your code here..."
                                className="app-input font-mono text-sm sm:text-base resize-y min-h-[200px] sm:min-h-[300px]"
                            />
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <input
                                type="checkbox"
                                id="isPublic"
                                name="isPublic"
                                className="w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-300 text-orange-500 focus:ring-orange-400 focus:ring-2 cursor-pointer"
                            />
                            <label
                                htmlFor="isPublic"
                                className="text-sm sm:text-base text-slate-700 cursor-pointer"
                            >
                                Make public (shareable link)
                            </label>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                            <button type="submit" className="app-button-primary">
                                Save Snippet
                            </button>
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center w-full sm:w-auto rounded-full border border-slate-300 bg-white text-slate-700 font-semibold tracking-tight px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base hover:bg-slate-50 transition-colors duration-300"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
