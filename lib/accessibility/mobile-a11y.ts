'use client'

export interface AccessibilityPreferences {
  reduceMotion: boolean
  highContrast: boolean
  largeText: boolean
  screenReader: boolean
  keyboard: boolean
  focusVisible: boolean
}

export interface A11yAnnouncement {
  message: string
  priority: 'polite' | 'assertive'
  timeout?: number
}

export interface AccessibilityIssue {
  id: string
  type: 'error' | 'warning' | 'info'
  element: Element
  message: string
  suggestion: string
  wcagLevel: 'A' | 'AA' | 'AAA'
  impact: 'low' | 'medium' | 'high' | 'critical'
}

class MobileAccessibilityManager {
  private preferences: AccessibilityPreferences
  private announcer: HTMLElement | null = null
  private focusTrap: HTMLElement | null = null
  private listeners: Map<string, Set<Function>> = new Map()
  private issues: AccessibilityIssue[] = []

  constructor() {
    this.preferences = this.detectPreferences()
    this.setupAnnouncer()
    this.setupFocusManagement()
    this.setupPreferenceListeners()
    this.applyPreferences()
  }

  // Detect user accessibility preferences
  private detectPreferences(): AccessibilityPreferences {
    return {
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      largeText: window.matchMedia('(min-resolution: 120dpi)').matches,
      screenReader: this.detectScreenReader(),
      keyboard: false, // Will be detected on first tab key
      focusVisible: window.matchMedia('(any-pointer: coarse)').matches
    }
  }

  // Detect screen reader usage
  private detectScreenReader(): boolean {
    // Check for common screen reader indicators
    const indicators = [
      'speechSynthesis' in window,
      'webkitSpeechSynthesis' in window,
      navigator.userAgent.includes('NVDA'),
      navigator.userAgent.includes('JAWS'),
      navigator.userAgent.includes('VoiceOver'),
      navigator.userAgent.includes('TalkBack')
    ]

    return indicators.some(indicator => indicator)
  }

  // Setup screen reader announcer
  private setupAnnouncer(): void {
    this.announcer = document.createElement('div')
    this.announcer.setAttribute('aria-live', 'polite')
    this.announcer.setAttribute('aria-atomic', 'true')
    this.announcer.setAttribute('aria-hidden', 'false')
    this.announcer.style.cssText = `
      position: absolute !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
    `
    document.body.appendChild(this.announcer)
  }

  // Setup focus management
  private setupFocusManagement(): void {
    // Detect keyboard usage
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.preferences.keyboard = true
        this.applyPreferences()
      }
    })

    // Enhanced focus indicators for mobile
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement
      if (this.preferences.focusVisible || this.preferences.keyboard) {
        target.setAttribute('data-focus-visible', 'true')
      }
    })

    document.addEventListener('focusout', (e) => {
      const target = e.target as HTMLElement
      target.removeAttribute('data-focus-visible')
    })
  }

  // Setup preference listeners
  private setupPreferenceListeners(): void {
    // Listen for media query changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    motionQuery.addEventListener('change', (e) => {
      this.preferences.reduceMotion = e.matches
      this.applyPreferences()
    })

    const contrastQuery = window.matchMedia('(prefers-contrast: high)')
    contrastQuery.addEventListener('change', (e) => {
      this.preferences.highContrast = e.matches
      this.applyPreferences()
    })

    // Listen for orientation changes (affects reading flow)
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.announce('Screen orientation changed', 'polite')
      }, 500)
    })
  }

  // Apply accessibility preferences
  private applyPreferences(): void {
    const html = document.documentElement

    // Reduce motion
    if (this.preferences.reduceMotion) {
      html.style.setProperty('--animation-duration', '0.01ms')
      html.style.setProperty('--transition-duration', '0.01ms')
      html.classList.add('reduce-motion')
    } else {
      html.style.removeProperty('--animation-duration')
      html.style.removeProperty('--transition-duration')
      html.classList.remove('reduce-motion')
    }

    // High contrast
    if (this.preferences.highContrast) {
      html.classList.add('high-contrast')
    } else {
      html.classList.remove('high-contrast')
    }

    // Large text
    if (this.preferences.largeText) {
      html.classList.add('large-text')
    } else {
      html.classList.remove('large-text')
    }

    // Keyboard navigation
    if (this.preferences.keyboard) {
      html.classList.add('keyboard-user')
    }

    // Screen reader optimizations
    if (this.preferences.screenReader) {
      html.classList.add('screen-reader')
    }

    this.emit('preferences-updated', this.preferences)
  }

  // Screen reader announcements
  announce(message: string, priority: 'polite' | 'assertive' = 'polite', timeout = 1000): void {
    if (!this.announcer) return

    this.announcer.setAttribute('aria-live', priority)
    this.announcer.textContent = message

    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = ''
      }
    }, timeout)

    this.emit('announcement', { message, priority, timeout })
  }

  // Focus management
  trapFocus(container: HTMLElement): void {
    this.focusTrap = container
    const focusableElements = this.getFocusableElements(container)
    
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement.focus()

    // Store cleanup function
    container.setAttribute('data-focus-trap', 'true')
    ;(container as any)._focusTrapCleanup = () => {
      container.removeEventListener('keydown', handleKeyDown)
      container.removeAttribute('data-focus-trap')
    }
  }

  releaseFocusTrap(): void {
    if (this.focusTrap) {
      const cleanup = (this.focusTrap as any)._focusTrapCleanup
      if (cleanup) cleanup()
      this.focusTrap = null
    }
  }

  // Get focusable elements
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]:not([disabled])'
    ].join(', ')

    return Array.from(container.querySelectorAll(selectors))
      .filter(el => this.isVisible(el as HTMLElement)) as HTMLElement[]
  }

  // Check if element is visible
  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element)
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           element.offsetParent !== null
  }

  // Skip links for mobile
  createSkipLink(target: string, label: string): HTMLElement {
    const skipLink = document.createElement('a')
    skipLink.href = target
    skipLink.textContent = label
    skipLink.className = 'skip-link'
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--primary);
      color: var(--primary-foreground);
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 9999;
      transition: top 0.3s;
    `

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px'
    })

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px'
    })

    return skipLink
  }

  // Touch target size checker
  checkTouchTargets(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = []
    const minSize = 44 // WCAG minimum touch target size

    const touchTargets = document.querySelectorAll(
      'button, a, input, [role="button"], [role="link"], [onclick]'
    )

    touchTargets.forEach((element, index) => {
      const rect = element.getBoundingClientRect()
      
      if (rect.width < minSize || rect.height < minSize) {
        issues.push({
          id: `touch-target-${index}`,
          type: 'error',
          element: element as Element,
          message: `Touch target is too small (${Math.round(rect.width)}x${Math.round(rect.height)}px)`,
          suggestion: `Increase touch target size to at least ${minSize}x${minSize}px`,
          wcagLevel: 'AA',
          impact: 'high'
        })
      }
    })

    return issues
  }

  // Color contrast checker (simplified)
  checkColorContrast(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = []
    
    // This would require a full contrast checking algorithm
    // For now, we'll check for common issues
    const elements = document.querySelectorAll('*')
    
    elements.forEach((element, index) => {
      const style = window.getComputedStyle(element as Element)
      const bgColor = style.backgroundColor
      const textColor = style.color
      
      // Simple check for white text on white background
      if (textColor === 'rgb(255, 255, 255)' && bgColor === 'rgb(255, 255, 255)') {
        issues.push({
          id: `contrast-${index}`,
          type: 'error',
          element: element as Element,
          message: 'Insufficient color contrast',
          suggestion: 'Ensure text has sufficient contrast with background',
          wcagLevel: 'AA',
          impact: 'critical'
        })
      }
    })

    return issues
  }

  // Alt text checker
  checkAltText(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = []
    const images = document.querySelectorAll('img')

    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-label') && !img.getAttribute('aria-labelledby')) {
        issues.push({
          id: `alt-text-${index}`,
          type: 'error',
          element: img,
          message: 'Image missing alt text',
          suggestion: 'Provide descriptive alt text for images',
          wcagLevel: 'A',
          impact: 'high'
        })
      }
    })

    return issues
  }

  // Heading structure checker
  checkHeadingStructure(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = []
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    let previousLevel = 0

    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName.charAt(1))
      
      if (currentLevel > previousLevel + 1) {
        issues.push({
          id: `heading-${index}`,
          type: 'warning',
          element: heading,
          message: `Heading level skipped (h${previousLevel} to h${currentLevel})`,
          suggestion: 'Use heading levels in sequential order',
          wcagLevel: 'AA',
          impact: 'medium'
        })
      }
      
      previousLevel = currentLevel
    })

    return issues
  }

  // Run full accessibility audit
  auditAccessibility(): AccessibilityIssue[] {
    const allIssues = [
      ...this.checkTouchTargets(),
      ...this.checkColorContrast(),
      ...this.checkAltText(),
      ...this.checkHeadingStructure()
    ]

    this.issues = allIssues
    this.emit('audit-completed', allIssues)
    return allIssues
  }

  // Get current preferences
  getPreferences(): AccessibilityPreferences {
    return { ...this.preferences }
  }

  // Update preferences
  updatePreferences(updates: Partial<AccessibilityPreferences>): void {
    this.preferences = { ...this.preferences, ...updates }
    this.applyPreferences()
  }

  // Get current issues
  getIssues(): AccessibilityIssue[] {
    return [...this.issues]
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback)
  }

  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Error in accessibility event listener:', error)
      }
    })
  }
}

// Export singleton instance
export const mobileA11yManager = new MobileAccessibilityManager()

// Utility functions
export function addA11yAttributes(element: HTMLElement, attributes: Record<string, string>): void {
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })
}

export function enhanceButton(button: HTMLElement, label?: string): void {
  // Ensure minimum touch target size
  const rect = button.getBoundingClientRect()
  if (rect.width < 44 || rect.height < 44) {
    button.style.minWidth = '44px'
    button.style.minHeight = '44px'
  }

  // Add accessible label if missing
  if (!button.getAttribute('aria-label') && !button.textContent?.trim() && label) {
    button.setAttribute('aria-label', label)
  }

  // Add role if missing
  if (!button.getAttribute('role') && button.tagName !== 'BUTTON') {
    button.setAttribute('role', 'button')
  }

  // Ensure keyboard accessibility
  if (!button.hasAttribute('tabindex') && button.tagName !== 'BUTTON') {
    button.setAttribute('tabindex', '0')
  }
}

export function enhanceLink(link: HTMLElement, description?: string): void {
  // Add descriptive text for screen readers
  if (description && !link.getAttribute('aria-describedby')) {
    const descId = `desc-${Math.random().toString(36).substr(2, 9)}`
    const descElement = document.createElement('span')
    descElement.id = descId
    descElement.textContent = description
    descElement.className = 'sr-only'
    link.appendChild(descElement)
    link.setAttribute('aria-describedby', descId)
  }

  // Ensure external links are announced
  if (link.getAttribute('href')?.startsWith('http') && 
      !link.getAttribute('aria-label')?.includes('external')) {
    const label = link.getAttribute('aria-label') || link.textContent || ''
    link.setAttribute('aria-label', `${label} (opens in new tab)`)
  }
}

export function createLiveRegion(
  level: 'polite' | 'assertive' = 'polite',
  atomic = true
): HTMLElement {
  const region = document.createElement('div')
  region.setAttribute('aria-live', level)
  region.setAttribute('aria-atomic', atomic.toString())
  region.className = 'sr-only'
  return region
}