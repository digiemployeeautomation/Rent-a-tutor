"use client"

import {
  Bell,
  Search,
  Sun,
  Moon,
  Monitor,
  UserPen,
  Plus,
  Mic,
  Camera,
  Pencil,
  SlidersHorizontal,
  MessageSquare,
} from "lucide-react"
import React, { useMemo, useState, useRef, useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"
import useMeasure from "react-use-measure"
import { cn } from "@/lib/utils"

// Change Here
const MAIN_NAV = [
  { icon: Plus, name: "home" },
  { icon: Search, name: "search" },
  { icon: Bell, name: "notifications" },
  { icon: UserPen, name: "profile" },
  { icon: Sun, name: "theme" },
]

const HOME_ITEMS = [
  { icon: Pencil, text: "Note" },
  { icon: Mic, text: "Voice" },
  { icon: Camera, text: "Screenshot" },
]

const SEARCH_OPTIONS = [
  { icon: SlidersHorizontal, text: "Filter" },
  { icon: MessageSquare, text: "Trending" },
]

const NOTIFICATION_TYPES = ["Messages", "System Alerts"]

const PROFILE_LINKS = ["My Account", "Settings", "Subscription / Billing"]

const THEME_OPTIONS = [
  { key: "light", icon: Sun, text: "Light" },
  { key: "dark", icon: Moon, text: "Dark" },
  { key: "system", icon: Monitor, text: "System" },
]

const BottomMenu = () => {
  const containerRef = useRef(null)
  const [elementRef] = useMeasure()
  const [hiddenRef, hiddenBounds] = useMeasure()
  const [view, setView] = useState("default")

  const [theme, setTheme] = useState("light")

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setView("default")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const sharedHover =
    "group transition-all duration-75 px-3 py-2 text-[15px] text-muted-foreground w-full text-left rounded-[12px] hover:bg-muted/80 hover:text-foreground"

  const content = useMemo(() => {
    switch (view) {
      case "default":
        return null

      case "home":
        return (
          <div className="space-y-0.5 min-w-[210px] p-[6px] py-0.5">
            {HOME_ITEMS.map(({ icon: Icon, text }) => (
              <button
                key={text}
                className={`${sharedHover} flex items-center gap-3`}
              >
                <Icon
                  size={20}
                  className="text-muted-foreground group-hover:text-foreground transition-all duration-75"
                />
                <span className="transition-all duration-75">{text}</span>
              </button>
            ))}
          </div>
        )

      case "search":
        return (
          <div className="space-y-2 min-w-[270px] p-[8px] py-1">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-[6px] text-[14.5px] text-foreground bg-muted/80 border border-border rounded-[12px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex gap-1.5">
              {SEARCH_OPTIONS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  className={`${sharedHover} flex-1 flex items-center justify-center gap-1.5 bg-muted hover:bg-accent`}
                >
                  <Icon
                    size={14}
                    strokeWidth={2}
                    className="text-muted-foreground group-hover:text-foreground transition-all duration-75"
                  />
                  <span className="transition-all duration-75">{text}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case "notifications":
        return (
          <div className="space-y-0.5 min-w-[210px] p-[6px] py-0.5">
            {NOTIFICATION_TYPES.map((t) => (
              <button key={t} className={sharedHover}>
                <span className="transition-all duration-75">{t}</span>
              </button>
            ))}
          </div>
        )

      case "profile":
        return (
          <div className="space-y-0.5 min-w-[230px] p-[6px] py-0.5">
            {PROFILE_LINKS.map((t) => (
              <button key={t} className={sharedHover}>
                <span className="transition-all duration-75">{t}</span>
              </button>
            ))}
            <div className="border-t border-border my-[2px]" />
            <button className="px-3 py-2 text-[15px] text-destructive w-full text-left rounded-[12px] hover:bg-destructive/10 transition-all duration-75">
              Logout
            </button>
          </div>
        )

      case "theme":
        return (
          <div className="flex items-center justify-between gap-1.5 min-w-[270px] p-[6px] py-0.5">
            {THEME_OPTIONS.map(({ key, icon: Icon, text }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`flex items-center justify-center gap-2 rounded-[12px] px-3 py-2 transition-all duration-100 ${
                  theme === key
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-all duration-75 ${
                    theme === key ? "text-foreground" : "text-muted-foreground"
                  }`}
                />
                <span>{text}</span>
              </button>
            ))}
          </div>
        )

      default:
        return null
    }
  }, [view, theme])

  return (
    <div
      ref={containerRef}
      className={cn("relative flex flex-col items-center")}
    >
      {/* Hidden for measurement */}
      <div
        ref={hiddenRef}
        className="absolute left-[-9999px] top-[-9999px] invisible pointer-events-none"
      >
        <div className="rounded-[18px] bg-background/95 border border-border py-1">
          {content}
        </div>
      </div>

      {/* Animated submenu */}
      <AnimatePresence mode="wait">
        {view !== "default" && (
          <motion.div
            key="submenu"
            initial={{
              opacity: 0,
              scaleY: 0.9,
              scaleX: 0.95,
              height: 0,
              width: 0,
              originY: 1,
              originX: 0.5,
            }}
            animate={{
              opacity: 1,
              scaleY: 1,
              scaleX: 1,
              height: hiddenBounds.height || "auto",
              width: hiddenBounds.width || "auto",
              originY: 1,
              originX: 0.5,
            }}
            exit={{
              opacity: 0,
              scaleY: 0.9,
              scaleX: 0.95,
              height: 0,
              width: 0,
              originY: 1,
              originX: 0.5,
            }}
            transition={{
              duration: 0.3,
              ease: [0.45, 0, 0.25, 1],
            }}
            style={{
              transformOrigin: "bottom center",
            }}
            className="absolute bottom-[70px] overflow-hidden"
          >
            <div
              ref={elementRef}
              className="rounded-[18px] bg-background/95 backdrop-blur-xl border border-border"
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={view}
                  initial={{
                    opacity: 0,
                    scale: 0.96,
                    filter: "blur(10px)",
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    filter: "blur(0px)",
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    filter: "blur(12px)",
                  }}
                  transition={{
                    duration: 0.25,
                    ease: [0.42, 0, 0.58, 1],
                  }}
                  className="py-1"
                >
                  {content}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex items-center gap-1 bg-background/95 backdrop-blur-xl border border-border rounded-[18px] p-1 mt-3 z-10">
        {MAIN_NAV.map(({ icon: Icon, name }) => (
          <button
            key={name}
            className={`p-3 rounded-[16px] transition-all ${
              view === name ? "bg-accent" : "hover:bg-muted"
            }`}
            onClick={() => setView(view === name ? "default" : name)}
          >
            <Icon
              size={22}
              className={`transition-all ${
                view === name ? "text-foreground" : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default BottomMenu
