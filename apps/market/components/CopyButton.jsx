'use client'

import { useEffect, useRef, useState } from 'react'

import styles from './CopyButton.module.css'

// Reusable "copy to clipboard" button. Both icons and both labels are rendered
// stacked in shared CSS-grid cells, so the button sizes to its widest state up
// front and never wraps or resizes when data-copied flips which pair is shown.
// A rejected clipboard write (e.g. a permission-denied browser or an insecure
// context) leaves the label alone so the user just presses again. `label` lets
// callers name what's copied ("Copy link", "Copy code"); the post-copy label
// stays "Copied".
const CopyButton = ({ text, label = 'Copy', className = '' }) => {
  const [copied, setCopied] = useState(false)
  const timer = useRef()

  // Revert the "Copied" state after a moment; clear on unmount and on each new
  // copy so a rapid second click isn't cut short by the first click's timer.
  useEffect(() => {
    if (!copied) return
    timer.current = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer.current)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // clipboard unavailable / denied — leave the label as-is
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`${styles.copyButton}${className ? ` ${className}` : ''}`}
      data-copied={copied}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon} aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${styles.icon} ${styles.check}`} aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.label} ${styles.copied}`}>Copied</span>
    </button>
  )
}

export default CopyButton
