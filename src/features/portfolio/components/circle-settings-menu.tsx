'use client'

import { CaretDown, GearSix } from '@phosphor-icons/react'
import { AnimatePresence, motion, useAnimationControls } from 'motion/react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { cn } from '@/lib/utils'

const emptySubscribe = () => () => {}

const CONSTANTS = {
  itemSize: 40,
  radius: 78,
  openStagger: 0.03,
  closeStagger: 0.06,
}

// Arc fanning down-left: Sound (85deg), Theme (122deg), Language (158deg)
const ARC_ANGLES = [
  (85 * Math.PI) / 180,
  (122 * Math.PI) / 180,
  (158 * Math.PI) / 180,
]

/* Micro-animated Sun & Moon SVG */
function AnimatedThemeIcon({
  isDark,
  isOpen,
}: {
  isDark: boolean
  isOpen: boolean
}) {
  return (
    <div className="relative flex size-5 items-center justify-center">
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.svg
            key="moon"
            viewBox="0 0 24 24"
            fill="none"
            className="size-4.5 text-sky-400"
            initial={{ rotate: -70, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 70, scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          >
            {/* Crescent moon with soft translucent duotone fill */}
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
              fill="currentColor"
              fillOpacity={0.2}
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Micro-twinkle star (only active when open) */}
            <motion.circle
              cx="18"
              cy="5"
              r="1.1"
              fill="currentColor"
              animate={
                isOpen
                  ? { opacity: [0.3, 1, 0.3], scale: [0.8, 1.25, 0.8] }
                  : { opacity: 0.8, scale: 1 }
              }
              transition={
                isOpen
                  ? { repeat: Infinity, duration: 2, ease: 'easeInOut' }
                  : undefined
              }
            />
          </motion.svg>
        ) : (
          <motion.svg
            key="sun"
            viewBox="0 0 24 24"
            fill="none"
            className="size-4.5 text-amber-500"
            initial={{ rotate: 70, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -70, scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          >
            {/* Sun core */}
            <circle
              cx="12"
              cy="12"
              r="4.2"
              fill="currentColor"
              fillOpacity={0.25}
              stroke="currentColor"
              strokeWidth={1.8}
            />
            {/* Sun rays with rotation (only spins when open) */}
            <motion.g
              animate={isOpen ? { rotate: 360 } : { rotate: 0 }}
              transition={
                isOpen
                  ? { repeat: Infinity, duration: 18, ease: 'linear' }
                  : undefined
              }
              className="origin-center"
            >
              <line x1="12" y1="2" x2="12" y2="4.2" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
              <line x1="12" y1="19.8" x2="12" y2="22" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
              <line x1="4.93" y1="4.93" x2="6.48" y2="6.48" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
              <line x1="17.52" y1="17.52" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
              <line x1="2" y1="12" x2="4.2" y2="12" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
              <line x1="19.8" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
              <line x1="4.93" y1="19.07" x2="6.48" y2="17.52" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
              <line x1="17.52" y1="6.48" x2="19.07" y2="4.93" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
            </motion.g>
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  )
}

/* Micro-animated Sound & Speaker SVG */
function AnimatedSoundIcon({
  enabled,
  isOpen,
}: {
  enabled: boolean
  isOpen: boolean
}) {
  return (
    <div className="relative flex size-5 items-center justify-center">
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        className={cn(
          'size-4.5 transition-colors duration-200',
          enabled ? 'text-emerald-500' : 'text-muted-foreground'
        )}
      >
        {/* Speaker cone body */}
        <motion.path
          d="M11 5L6 9H3C2.45 9 2 9.45 2 10V14C2 14.55 2.45 15 3 15H6L11 19V5Z"
          fill="currentColor"
          fillOpacity={enabled ? 0.22 : 0.08}
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ scale: enabled && isOpen ? [1, 1.08, 1] : 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Sound waves when active */}
        {enabled ? (
          <>
            {/* Inner wave ripple */}
            <motion.path
              d="M15.5 8.5C16.8 9.8 17.5 10.9 17.5 12C17.5 13.1 16.8 14.2 15.5 15.5"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              animate={
                isOpen
                  ? {
                      opacity: [0.45, 1, 0.45],
                      scale: [0.94, 1.08, 0.94],
                    }
                  : { opacity: 0.8, scale: 1 }
              }
              transition={
                isOpen
                  ? {
                      repeat: Infinity,
                      duration: 1.4,
                      ease: 'easeInOut',
                    }
                  : undefined
              }
              className="origin-[11px_12px]"
            />
            {/* Outer wave ripple */}
            <motion.path
              d="M19 5C21 7.2 22 9.5 22 12C22 14.5 21 16.8 19 19"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              animate={
                isOpen
                  ? {
                      opacity: [0.3, 0.95, 0.3],
                      scale: [0.94, 1.08, 0.94],
                    }
                  : { opacity: 0.6, scale: 1 }
              }
              transition={
                isOpen
                  ? {
                      repeat: Infinity,
                      duration: 1.4,
                      delay: 0.2,
                      ease: 'easeInOut',
                    }
                  : undefined
              }
              className="origin-[11px_12px]"
            />
          </>
        ) : (
          /* Animated diagonal strike-through slash when muted */
          <motion.line
            x1="22"
            y1="2"
            x2="2"
            y2="22"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          />
        )}
      </motion.svg>
    </div>
  )
}

/* Micro-animated Globe + 3D Flip Language Indicator */
function AnimatedLanguageIcon({ language }: { language: 'en' | 'id' }) {
  return (
    <div className="relative flex size-6 items-center justify-center">
      {/* Background globe wireframe that spins on language toggle */}
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        className="absolute inset-0 size-6 text-foreground/20"
        animate={{ rotate: language === 'id' ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={1.2} />
        <ellipse cx="12" cy="12" rx="4.5" ry="10" stroke="currentColor" strokeWidth={1.2} />
        <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth={1.2} />
      </motion.svg>

      {/* 3D Roll/Flip language label */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={language}
          initial={{ rotateX: -90, y: 3, opacity: 0, scale: 0.8 }}
          animate={{ rotateX: 0, y: 0, opacity: 1, scale: 1 }}
          exit={{ rotateX: 90, y: -3, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          className="relative z-10 flex items-center justify-center"
        >
          <span className="font-mono text-[11px] font-black tracking-wider text-foreground select-none">
            {language.toUpperCase()}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

interface CircleSettingsMenuProps {
  isOpen: boolean
  onToggle: () => void
  label: string
  theme: string
  setTheme: (theme: string) => void
  language: 'en' | 'id'
  setLanguage: (lang: 'en' | 'id') => void
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
  t: {
    settings: {
      language: string
      english: string
      indonesian: string
      theme: string
      light: string
      dark: string
      sound: string
      soundOn: string
      soundOff: string
    }
  }
  playNavigation: () => void
}

interface MenuItemData {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  x: number
  y: number
}

function CircleMenuItem({
  item,
  index,
  isOpen,
  openStagger,
  closeStagger,
}: {
  item: MenuItemData
  index: number
  isOpen: boolean
  openStagger: number
  closeStagger: number
}) {
  const [hovering, setHovering] = useState(false)

  return (
    <motion.button
      type="button"
      aria-label={item.label}
      disabled={!isOpen}
      tabIndex={isOpen ? 0 : -1}
      onClick={item.onClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      initial={false}
      animate={{
        x: isOpen ? item.x : 0,
        y: isOpen ? item.y : 0,
        opacity: isOpen ? 1 : 0,
        scale: isOpen ? 1 : 0.3,
      }}
      whileHover={{
        scale: 1.12,
        transition: { duration: 0.12 },
      }}
      whileTap={{ scale: 0.92 }}
      transition={{
        delay: isOpen ? index * openStagger : (2 - index) * closeStagger,
        type: 'spring',
        stiffness: 340,
        damping: 26,
      }}
      style={{
        width: CONSTANTS.itemSize,
        height: CONSTANTS.itemSize,
      }}
      className={cn(
        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'flex items-center justify-center rounded-full',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none',
        'border border-line bg-card/95 text-foreground shadow-lg backdrop-blur-md',
        'transition-colors duration-150 hover:border-foreground/30 hover:bg-muted',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none select-none'
      )}
    >
      {item.icon}

      <AnimatePresence>
        {hovering && isOpen && (
          <motion.span
            initial={{ opacity: 0, scale: 0.85, y: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -2 }}
            transition={{ duration: 0.14 }}
            className="pointer-events-none absolute top-full left-1/2 z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-card/95 px-2 py-0.5 font-sans text-[10px] font-medium text-foreground shadow-md backdrop-blur-sm"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export function CircleSettingsMenu({
  isOpen,
  onToggle,
  label,
  theme,
  setTheme,
  language,
  setLanguage,
  soundEnabled,
  setSoundEnabled,
  t,
  playNavigation,
}: CircleSettingsMenuProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
  const containerAnimate = useAnimationControls()
  const shakeAnimation = useAnimationControls()
  const prevIsOpenRef = useRef(isOpen)

  const currentTheme = mounted ? theme : 'dark'

  const items: MenuItemData[] = [
    {
      id: 'sound',
      label: soundEnabled ? t.settings.soundOn : t.settings.soundOff,
      icon: <AnimatedSoundIcon enabled={soundEnabled} isOpen={isOpen} />,
      x: Math.round(CONSTANTS.radius * Math.cos(ARC_ANGLES[0])),
      y: Math.round(CONSTANTS.radius * Math.sin(ARC_ANGLES[0])),
      onClick: () => {
        const next = !soundEnabled
        setSoundEnabled(next)
        if (next) playNavigation()
      },
    },
    {
      id: 'theme',
      label: currentTheme === 'dark' ? t.settings.dark : t.settings.light,
      icon: <AnimatedThemeIcon isDark={currentTheme === 'dark'} isOpen={isOpen} />,
      x: Math.round(CONSTANTS.radius * Math.cos(ARC_ANGLES[1])),
      y: Math.round(CONSTANTS.radius * Math.sin(ARC_ANGLES[1])),
      onClick: () => {
        playNavigation()
        setTheme(currentTheme === 'dark' ? 'light' : 'dark')
      },
    },
    {
      id: 'language',
      label: `${t.settings.language}: ${language.toUpperCase()}`,
      icon: <AnimatedLanguageIcon language={language} />,
      x: Math.round(CONSTANTS.radius * Math.cos(ARC_ANGLES[2])),
      y: Math.round(CONSTANTS.radius * Math.sin(ARC_ANGLES[2])),
      onClick: () => {
        playNavigation()
        setLanguage(language === 'en' ? 'id' : 'en')
      },
    },
  ]

  useEffect(() => {
    if (prevIsOpenRef.current && !isOpen) {
      containerAnimate
        .start({
          rotate: -360,
          filter: 'blur(1px)',
          transition: {
            duration: CONSTANTS.closeStagger * (items.length + 2),
            ease: 'linear',
          },
        })
        .then(() => {
          containerAnimate.set({ rotate: 0, filter: 'blur(0px)' })
        })
        .catch(() => {})

      shakeAnimation
        .start({
          translateX: [0, 2, -2, 0, 2, -2, 0],
          transition: {
            duration: CONSTANTS.closeStagger * 2,
            ease: 'easeInOut',
          },
        })
        .then(() => {
          shakeAnimation.set({ translateX: 0 })
        })
        .catch(() => {})
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen, containerAnimate, shakeAnimation, items.length])

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div animate={shakeAnimation} initial={false} className="relative z-10 h-full w-full">
        <button
          type="button"
          onClick={onToggle}
          data-settings-trigger
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          title={label}
          aria-label={label}
          className={cn(
            'group relative flex h-full w-full min-w-0 cursor-pointer items-center justify-center gap-1.5 px-2 text-xs font-medium text-muted-foreground transition-colors duration-200 select-none hover:text-foreground focus-visible:z-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset sm:text-sm',
            isOpen && 'text-foreground'
          )}
        >
          <GearSix
            className={cn(
              'size-4 shrink-0 transition-transform duration-300 ease-out sm:size-4.5',
              isOpen
                ? 'rotate-180 duration-500'
                : 'duration-500 group-hover:rotate-90'
            )}
          />
          <span
            className={cn(
              'hidden max-w-24 overflow-hidden font-sans whitespace-nowrap transition-[opacity,max-width] duration-200 ease-out sm:block',
              isOpen ? 'opacity-100' : 'max-w-0 opacity-0'
            )}
          >
            {label}
          </span>
          <CaretDown
            className={cn(
              'hidden size-3 shrink-0 transition-transform duration-200 sm:block',
              isOpen && 'rotate-180'
            )}
            weight="bold"
            aria-hidden
          />
        </button>
      </motion.div>

      <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
        <motion.div
          animate={containerAnimate}
          initial={false}
          className="relative size-0"
          aria-hidden={!isOpen}
        >
          {items.map((item, index) => (
            <CircleMenuItem
              key={item.id}
              item={item}
              index={index}
              isOpen={isOpen}
              openStagger={CONSTANTS.openStagger}
              closeStagger={CONSTANTS.closeStagger}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}
