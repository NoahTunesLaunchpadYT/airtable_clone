// app/page.tsx
import { auth } from "~/server/auth" // adjust path if needed
import { SignOutButton } from "~/app/components/sign-out-button" // adjust path

export default async function HomePage() {
  const session = await auth()

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-[512px] px-4 text-[#1d1f25]">
        {!session ? (
          <div>
            <h1 className="text-2xl font-semibold mb-4">
              Not signed in
            </h1>
            <p>
              Go to <a href="/signup" className="text-blue-600 underline">Sign up</a> to sign in with Google.
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-semibold mb-4">
              Signed in user
            </h1>

            <p className="mb-2">
              <span className="font-semibold">Name:</span> {session.user?.name}
            </p>
            <p className="mb-2">
              <span className="font-semibold">Email:</span> {session.user?.email}
            </p>
            <p className="mb-4">
              <span className="font-semibold">User id:</span>{" "}
              {(session.user as any)?.id}
            </p>

            <h2 className="text-xl font-semibold mb-2">
              Full session object
            </h2>
            <pre className="text-xs bg-[#f5f5f7] p-3 rounded border border-gray-200 overflow-x-auto">
{JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}
        <SignOutButton />
      </div>
    </main>
  )
}
