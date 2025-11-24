import { auth } from "~/server/auth";
import Link from "next/link";
import { SignOutButton } from "~/app/components/sign-out-button";
import { BasesList } from "~/app/components/bases-list";

type SessionUser = {
  name?: string | null;
  // we deliberately ignore id/email here so we never render them
};

export default async function HomePage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  const isSignedIn = !!session;

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-3xl px-4 py-6 text-[#1d1f25] space-y-6">
        {/* Auth status row */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            {isSignedIn ? (
              <>
                <h1 className="text-2xl font-semibold">
                  Hi{user?.name ? `, ${user.name}` : ""} 👋
                </h1>
                <p className="text-sm text-gray-600">
                  You are signed in with Google.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold">
                  Not signed in
                </h1>
                <p className="text-sm text-gray-600">
                  Sign in with Google to create and view bases.
                </p>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {!isSignedIn && (
              <Link
                href="/signup"
                className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
              >
                Sign in with Google
              </Link>
            )}

            {isSignedIn && <SignOutButton />}
          </div>
        </div>

        {/* Main content */}
        {isSignedIn ? (
          <BasesList />
        ) : (
          <p className="text-sm text-gray-700">
            Once you sign in, your bases will appear here.
          </p>
        )}
      </div>
    </main>
  );
}
