import Link from "next/link"
import { auth } from "~/server/auth"
import AirtableHomeClient from "./client"

type SessionUser = {
  name?: string | null
}

export default async function AirtableDemoPage() {
  const session = await auth()
  const user = session?.user as SessionUser | undefined
  const isSignedIn = !!session

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-[#f6f6f8] text-[#1f1f24]">
        <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col justify-center px-6 py-10">
          <h1 className="text-[22px] font-semibold leading-tight">Not signed in</h1>
          <p className="mt-2 text-[13px] text-[#6b6b76]">
            Sign in with Google to view workspaces and bases.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-[#1b72e8] px-4 text-[13px] font-semibold text-white hover:brightness-95"
          >
            Sign in with Google
          </Link>
        </div>
      </main>
    )
  }

  return <AirtableHomeClient userName={user?.name ?? "User"} />
}
