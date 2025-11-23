"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"

export default function SignUpPage() {
  const [email, setEmail] = useState("")

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault()
    console.log("Email signup not implemented yet:", email)
  }

  const canContinueWithEmail = email.trim().length > 0

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      {/* clamp main content to min(512px, 100%) */}
      <div className="w-full max-w-[512px] bg-white px-4">
        {/* container without border or shadow */}
        <div className="text-[#1d1f25]">
          {/* Logo */}
          <div className="mb-12 h-[36.667px]">
            <AirtableLogo />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold mb-[32px] leading-[31.2px] auth-lg:text-[32px] auth-lg:leading-[56px]">
            Welcome to Airtable
          </h1>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="emailSignup"
                className="block text-heading-xsmall font-medium leading-3-token"
              >
                Work email
              </label>
              <input
                id="emailSignup"
                type="email"
                autoComplete="email"
                required
                placeholder="name@company.com"
                aria-label="Work email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 rounded-[6px] px-2 py-1 text-[15px] text-[#1d1f25] bg-white placeholder:text-[#757575] shadow-[0_0_1px_rgba(0,0,0,0.32),0_0_2px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.08)] outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={!canContinueWithEmail}
              className={`mt-2 inline-flex h-10 w-full items-center justify-center rounded-[6px] px-4 text-[15px] font-semibold text-white transition
                ${
                  canContinueWithEmail
                    ? "bg-[rgb(22,110,225)] cursor-pointer"
                    : "bg-[#8fb6ed]"
                }`}
            >
              Continue with email
            </button>
          </form>

          {/* Divider */}
          <div className="py-6 flex items-center justify-center leading-3-token">
            <p className="text-[0.8rem] font-normal text-[rgb(29,31,37)]">
              or
            </p>
          </div>

          {/* SSO button */}
          <button
            type="button"
            className="mb-4 inline-flex h-10 w-full items-center justify-center rounded-[6px] px-4 text-[15px] text-[#1d1f25] bg-white shadow-[0_0_1px_rgba(0,0,0,0.32),0_0_2px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.08)]"
          >
            <p className="text-[15px]">
              Continue with{" "}
              <span className="font-semibold">Single Sign On</span>
            </p>
          </button>

          {/* Google button */}
          <button
            type="button"
            onClick={() => signIn("google", 
                    { callbackUrl: "/" } // or "/dashboard", "/"
            )}
            className="mb-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[6px] px-4 text-[15px] text-[#1d1f25] bg-white shadow-[0_0_1px_rgba(0,0,0,0.32),0_0_2px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.08)]"
          >
            <GoogleIcon />
            <p className="text-[15px]">
              Continue with <span className="font-semibold">Google</span>
            </p>
          </button>

          {/* Apple button (UI only) */}
          <button
            type="button"
            className="mb-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[6px] px-4 text-[15px] text-[#1d1f25] bg-white shadow-[0_0_1px_rgba(0,0,0,0.32),0_0_2px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.08)]"
          >
            <AppleIcon />
            <p className="text-[15px]">
              Continue with <span className="font-semibold">Apple</span>
            </p>
          </button>

          {/* Legal + marketing consent */}
          <div className="mt-4 text-body-default leading-4-token text-foreground-subtle">
            <p className="mb-4 pl-6">
              By creating an account, you agree to the{" "}
              <a
                href="https://www.airtable.com/tos"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-600 underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="https://www.airtable.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-600 underline"
              >
                Privacy Policy
              </a>
              .
            </p>

            <label className="flex items-start gap-2.75">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
                aria-label="Consent to marketing communications"
              />
              <span>
                By checking this box, you agree to receive marketing and sales
                communications about Airtable products, services, and events.
                You understand that you can manage your preferences at any time
                by following the instructions in the communications received.
              </span>
            </label>
          </div>

          {/* Already have an account */}
          <div className="mt-4 flex items-center gap-1 text-sm text-foreground-subtle">
            <span>Already have an account?</span>
            <Link
              href="/login"
              className="font-semibold text-blue-600 underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

function AirtableLogo() {
  return (
    <div aria-label="Airtable" className="inline-block">
      <svg
        width="40"
        height="34"
        viewBox="0 0 200 170"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <path
            fill="#FFBA05"
            d="M90.0389,12.3675 L24.0799,39.6605 C20.4119,41.1785 20.4499,46.3885 24.1409,47.8515 L90.3759,74.1175 C96.1959,76.4255 102.6769,76.4255 108.4959,74.1175 L174.7319,47.8515 C178.4219,46.3885 178.4609,41.1785 174.7919,39.6605 L108.8339,12.3675 C102.8159,9.8775 96.0559,9.8775 90.0389,12.3675"
          />
          <path
            fill="#39CAFF"
            d="M105.3122,88.4608 L105.3122,154.0768 C105.3122,157.1978 108.4592,159.3348 111.3602,158.1848 L185.1662,129.5368 C186.8512,128.8688 187.9562,127.2408 187.9562,125.4288 L187.9562,59.8128 C187.9562,56.6918 184.8092,54.5548 181.9082,55.7048 L108.1022,84.3528 C106.4182,85.0208 105.3122,86.6488 105.3122,88.4608"
          />
          <path
            fill="#DC043B"
            d="M88.0781,91.8464 L17.7121,125.6524 C14.7811,127.0664 11.0401,124.9304 11.0401,121.6744 L11.0401,60.0884 C11.0401,58.9104 11.6441,57.8934 12.4541,57.1274 C13.5731,56.2884 15.2541,55.4484 17.5941,55.9784 L87.7101,83.7594 C91.2741,85.1734 91.5541,90.1674 88.0781,91.8464"
          />
          <path
            fill="rgba(0,0,0,0.25)"
            d="M88.0781,91.8464 L66.1741,102.4224 L12.4541,57.1274 C12.7921,56.7884 13.1751,56.5094 13.5731,56.2884 C14.6781,55.6254 16.2541,55.4484 17.5941,55.9784 L87.7101,83.7594 C91.2741,85.1734 91.5541,90.1674 88.0781,91.8464"
          />
        </g>
      </svg>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64,9.2045 C17.64,8.5664 17.5827,7.9527 17.4764,7.3636 L9,7.3636 L9,10.845 L13.8436,10.845 C13.635,11.97 13.0009,12.9232 12.0477,13.5614 L12.0477,15.8195 L14.9564,15.8195 C16.6582,14.2527 17.64,11.9455 17.64,9.2045 Z"
        fill="#4285F4"
      />
      <path
        d="M9,18 C11.43,18 13.4673,17.1941 14.9564,15.8195 L12.0477,13.5614 C11.2418,14.1014 10.2109,14.4205 9,14.4205 C6.6559,14.4205 4.6718,12.8373 3.9641,10.71 L0.9573,10.71 L0.9573,13.0418 C2.4382,15.9832 5.4818,18 9,18 Z"
        fill="#34A853"
      />
      <path
        d="M3.9641,10.71 C3.7841,10.17 3.6818,9.5932 3.6818,9 C3.6818,8.4068 3.7841,7.83 3.9641,7.29 L3.9641,4.9582 L0.9573,4.9582 C0.3477,6.1732 0,7.5477 0,9 C0,10.4523 0.3477,11.8268 0.9573,13.0418 L3.9641,10.71 Z"
        fill="#FBBC05"
      />
      <path
        d="M9,3.5795 C10.3214,3.5795 11.5077,4.0336 12.4405,4.9255 L15.0218,2.3441 C13.4632,0.8918 11.4259,0 9,0 C5.4818,0 2.4382,2.0168 0.9573,4.9582 L3.9641,7.29 C4.6718,5.1627 6.6559,3.5795 9,3.5795 Z"
        fill="#EA4335"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="19 19 18 18"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M28.2227,20.3846 C29.0547,20.3846 30.0977,19.8048 30.7188,19.0318 C31.2812,18.3312 31.6914,17.3528 31.6914,16.3744 C31.6914,16.2416 31.6797,16.1087 31.6562,16 C30.7305,16.0362 29.6172,16.6402 28.9492,17.4495 C28.4219,18.0655 27.9414,19.0318 27.9414,20.0223 C27.9414,20.1672 27.9648,20.3121 27.9766,20.3605 C28.0352,20.3725 28.1289,20.3846 28.2227,20.3846 Z M25.293,35 C26.4297,35 26.9336,34.2149 28.3516,34.2149 C29.793,34.2149 30.1094,34.9758 31.375,34.9758 C32.6172,34.9758 33.4492,33.7921 34.2344,32.6325 C35.1133,31.3039 35.4766,29.9994 35.5,29.939 C35.418,29.9148 33.0391,28.9123 33.0391,26.0979 C33.0391,23.658 34.9141,22.5588 35.0195,22.4743 C33.7773,20.6383 31.8906,20.59 31.375,20.59 C29.9805,20.59 28.8438,21.4596 28.1289,21.4596 C27.3555,21.4596 26.3359,20.6383 25.1289,20.6383 C22.832,20.6383 20.5,22.595 20.5,26.2912 C20.5,28.5861 21.3672,31.014 22.4336,32.5842 C23.3477,33.9129 24.1445,35 25.293,35 Z"
        fill="currentColor"
      />
    </svg>
  )
}
