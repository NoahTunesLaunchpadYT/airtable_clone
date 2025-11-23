"use client"

import { signOut } from "next-auth/react"

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/signup" })}
      className="mt-4 inline-flex h-10 items-center justify-center rounded-[6px] px-4 text-[15px] font-semibold text-white bg-[rgb(22,110,225)]"
    >
      Sign out
    </button>
  )
}
