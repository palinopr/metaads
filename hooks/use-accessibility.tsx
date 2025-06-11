'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  mobileA11yManager, 
  AccessibilityPreferences, 
  AccessibilityIssue, 
  A11yAnnouncement 
} from '@/lib/accessibility/mobile-a11y'

interface UseAccessibilityReturn {
  // Preferences
  preferences: AccessibilityPreferences
  updatePreferences: (updates: Partial<AccessibilityPreferences>) => void
  
  // Announcements
  announce: (message: string, priority?: 'polite' | 'assertive', timeout?: number) => void
  
  // Focus management
  trapFocus: (container: HTMLElement) => void
  releaseFocus: () => void
  
  // Accessibility audit
  issues: AccessibilityIssue[]
  runAudit: () => AccessibilityIssue[]
  
  // Screen reader detection
  isScreenReader: boolean
  
  // Utilities
  enhanceElement: (element: HTMLElement, type: 'button' | 'link', options?: any) => void
}

export function useAccessibility(): UseAccessibilityReturn {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    mobileA11yManager.getPreferences()
  )
  const [issues, setIssues] = useState<AccessibilityIssue[]>([])

  useEffect(() => {
    const handlePreferencesUpdate = (newPreferences: AccessibilityPreferences) => {
      setPreferences(newPreferences)
    }

    const handleAuditCompleted = (newIssues: AccessibilityIssue[]) => {
      setIssues(newIssues)
    }

    mobileA11yManager.on('preferences-updated', handlePreferencesUpdate)
    mobileA11yManager.on('audit-completed', handleAuditCompleted)

    // Initial load
    setIssues(mobileA11yManager.getIssues())

    return () => {
      mobileA11yManager.off('preferences-updated', handlePreferencesUpdate)
      mobileA11yManager.off('audit-completed', handleAuditCompleted)
    }
  }, [])

  const updatePreferences = useCallback((updates: Partial<AccessibilityPreferences>) => {
    mobileA11yManager.updatePreferences(updates)
  }, [])

  const announce = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite', 
    timeout = 1000
  ) => {
    mobileA11yManager.announce(message, priority, timeout)
  }, [])

  const trapFocus = useCallback((container: HTMLElement) => {
    mobileA11yManager.trapFocus(container)
  }, [])

  const releaseFocus = useCallback(() => {
    mobileA11yManager.releaseFocusTrap()
  }, [])

  const runAudit = useCallback(() => {
    return mobileA11yManager.auditAccessibility()
  }, [])

  const enhanceElement = useCallback((
    element: HTMLElement, 
    type: 'button' | 'link', 
    options: any = {}
  ) => {
    if (type === 'button') {
      // Enhance button accessibility
      const rect = element.getBoundingClientRect()
      if (rect.width < 44 || rect.height < 44) {
        element.style.minWidth = '44px'
        element.style.minHeight = '44px'
        element.style.display = 'inline-flex'
        element.style.alignItems = 'center'
        element.style.justifyContent = 'center'
      }
      
      if (options.label && !element.getAttribute('aria-label')) {
        element.setAttribute('aria-label', options.label)
      }
    } else if (type === 'link') {
      if (options.description) {
        element.setAttribute('aria-describedby', options.description)
      }
    }
  }, [])

  return {
    preferences,
    updatePreferences,
    announce,
    trapFocus,
    releaseFocus,
    issues,
    runAudit,
    isScreenReader: preferences.screenReader,
    enhanceElement
  }
}

// Hook for live announcements
export function useLiveAnnouncer() {
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Create live region if it doesn't exist
    if (!regionRef.current) {
      const region = document.createElement('div')
      region.setAttribute('aria-live', 'polite')
      region.setAttribute('aria-atomic', 'true')
      region.className = 'sr-only'
      region.style.cssText = `
        position: absolute !important;
        left: -10000px !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
      `
      document.body.appendChild(region)
      regionRef.current = region
    }

    return () => {
      if (regionRef.current) {
        document.body.removeChild(regionRef.current)
      }
    }
  }, [])

  const announce = useCallback((message: string, timeout = 1000) => {
    if (regionRef.current) {
      regionRef.current.textContent = message
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = ''
        }
      }, timeout)
    }
  }, [])

  return { announce }
}

// Hook for keyboard navigation
export function useKeyboardNavigation() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true)
        document.documentElement.classList.add('keyboard-user')
      }
    }

    const handleMouseDown = () => {
      setIsKeyboardUser(false)
      document.documentElement.classList.remove('keyboard-user')
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return { isKeyboardUser }
}