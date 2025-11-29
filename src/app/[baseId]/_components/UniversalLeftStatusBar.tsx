import React from "react"
import { Bell, HelpCircle } from "lucide-react"
import Link from "next/link"

export function UniversalLeftStatusBar() {
  return (
    <aside
      id="universalLeftStatusBar"
      className="height-full hide-print colors-background-default"
    >
      <div
        data-testid="universal-left-status-bar"
        className="border-box height-full flex flex-column justify-between py2 px1 border-right colors-background-default"
        style={{ width: 56 }}
      >
        {/* Top cluster */}
        <div className="flex flex-none flex-column items-center gap2">
          {/* Home / logo */}
          <div className="flex items-center">
            <Link
              id="appTopBarHomeButton"
              aria-label="Back to home"
              className="flex flex-none relative pointer circle focus-ring"
              href="/"
              style={{ width: 24, height: 24 }}
            >
              <div className="flex flex-auto items-center justify-center">
                <div style={{ position: "relative", top: 2 }}>
                  <AirtableMark />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Bottom cluster */}
        <div className="flex flex-auto flex-column justify-end items-center gap1-and-half">
          <button
            type="button"
            aria-label="Help menu"
            className="control circle focus-ring"
            style={{ width: 28, height: 28 }}
          >
            <HelpCircle size={16} />
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="control pill focus-ring relative"
            style={{ width: 28, height: 28 }}
          >
            <div className="relative flex items-center justify-center" style={{ width: 18, height: 18 }}>
              <Bell size={16} />
              {/* badge placeholder */}
              <span className="notif-badge invisible">0</span>
            </div>
          </button>

          <button
            type="button"
            aria-label="Account"
            className="account circle focus-ring shadow-elevation-low"
            style={{ width: 28, height: 28 }}
          >
            <div className="userIcon circle">
              <span className="userInitial">N</span>
            </div>
          </button>
        </div>
      </div>
    </aside>
  )
}

function AirtableMark() {
  return (
    <svg width="24" height="20.4" viewBox="0 0 200 170" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path
          fill="var(--colors-foreground-default)"
          d="M90.0389,12.3675 L24.0799,39.6605 C20.4119,41.1785 20.4499,46.3885 24.1409,47.8515 L90.3759,74.1175 C96.1959,76.4255 102.6769,76.4255 108.4959,74.1175 L174.7319,47.8515 C178.4219,46.3885 178.4609,41.1785 174.7919,39.6605 L108.8339,12.3675 C102.8159,9.8775 96.0559,9.8775 90.0389,12.3675"
        />
        <path
          fill="var(--colors-foreground-default)"
          d="M105.3122,88.4608 L105.3122,154.0768 C105.3122,157.1978 108.4592,159.3348 111.3602,158.1848 L185.1662,129.5368 C186.8512,128.8688 187.9562,127.2408 187.9562,125.4288 L187.9562,59.8128 C187.9562,56.6918 184.8092,54.5548 181.9082,55.7048 L108.1022,84.3528 C106.4182,85.0208 105.3122,86.6488 105.3122,88.4608"
        />
        <path
          fill="var(--colors-foreground-default)"
          d="M88.0781,91.8464 L66.1741,102.4224 L63.9501,103.4974 L17.7121,125.6524 C14.7811,127.0664 11.0401,124.9304 11.0401,121.6744 L11.0401,60.0884 C11.0401,58.9104 11.6441,57.8934 12.4541,57.1274 C12.7921,56.7884 13.1751,56.5094 13.5731,56.2884 C14.6781,55.6254 16.2541,55.4484 17.5941,55.9784 L87.7101,83.7594 C91.2741,85.1734 91.5541,90.1674 88.0781,91.8464"
        />
      </g>
    </svg>
  )
}
