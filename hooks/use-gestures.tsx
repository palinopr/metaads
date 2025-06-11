'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface GestureEvent {
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'pan'
  clientX: number
  clientY: number
  deltaX?: number
  deltaY?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  scale?: number
  velocity?: number
  distance?: number
  duration?: number
  target: Element
}

export interface GestureOptions {
  onTap?: (event: GestureEvent) => void
  onDoubleTap?: (event: GestureEvent) => void
  onLongPress?: (event: GestureEvent) => void
  onSwipe?: (event: GestureEvent) => void
  onPinch?: (event: GestureEvent) => void
  onPan?: (event: GestureEvent) => void
  onPanStart?: (event: GestureEvent) => void
  onPanEnd?: (event: GestureEvent) => void
  
  // Configuration
  longPressDelay?: number
  doubleTapDelay?: number
  swipeThreshold?: number
  pinchThreshold?: number
  panThreshold?: number
  preventScrollOnPan?: boolean
  disabled?: boolean
}

interface TouchData {
  identifier: number
  clientX: number
  clientY: number
  timestamp: number
}

interface GestureState {
  touches: Map<number, TouchData>
  startTime: number
  startX: number
  startY: number
  currentX: number
  currentY: number
  lastTapTime: number
  isPanning: boolean
  isPinching: boolean
  initialDistance: number
  currentDistance: number
  scale: number
}

export function useGestures(
  ref: React.RefObject<Element>,
  options: GestureOptions = {}
) {
  const {
    onTap,
    onDoubleTap,
    onLongPress,
    onSwipe,
    onPinch,
    onPan,
    onPanStart,
    onPanEnd,
    longPressDelay = 500,
    doubleTapDelay = 300,
    swipeThreshold = 50,
    pinchThreshold = 0.1,
    panThreshold = 10,
    preventScrollOnPan = false,
    disabled = false
  } = options

  const gestureState = useRef<GestureState>({
    touches: new Map(),
    startTime: 0,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    lastTapTime: 0,
    isPanning: false,
    isPinching: false,
    initialDistance: 0,
    currentDistance: 0,
    scale: 1
  })

  const longPressTimer = useRef<NodeJS.Timeout>()

  // Utility functions
  const getDistance = (touch1: TouchData, touch2: TouchData) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getSwipeDirection = (deltaX: number, deltaY: number): 'up' | 'down' | 'left' | 'right' => {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left'
    } else {
      return deltaY > 0 ? 'down' : 'up'
    }
  }

  const createGestureEvent = (
    type: GestureEvent['type'],
    clientX: number,
    clientY: number,
    additionalData: Partial<GestureEvent> = {}
  ): GestureEvent => ({
    type,
    clientX,
    clientY,
    target: ref.current as Element,
    ...additionalData
  })

  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = undefined
    }
  }

  // Touch event handlers
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (disabled || !ref.current) return

    const state = gestureState.current
    const touches = Array.from(event.touches)
    
    // Clear any existing long press timer
    clearLongPressTimer()

    // Update touch tracking
    touches.forEach(touch => {
      state.touches.set(touch.identifier, {
        identifier: touch.identifier,
        clientX: touch.clientX,
        clientY: touch.clientY,
        timestamp: Date.now()
      })
    })

    if (touches.length === 1) {
      const touch = touches[0]
      state.startTime = Date.now()
      state.startX = touch.clientX
      state.startY = touch.clientY
      state.currentX = touch.clientX
      state.currentY = touch.clientY

      // Start long press timer
      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          onLongPress(createGestureEvent('long-press', touch.clientX, touch.clientY))
        }, longPressDelay)
      }
    } else if (touches.length === 2) {
      // Pinch gesture setup
      const [touch1, touch2] = touches
      state.initialDistance = getDistance(
        { ...touch1, timestamp: 0 },
        { ...touch2, timestamp: 0 }
      )
      state.currentDistance = state.initialDistance
      state.scale = 1
      state.isPinching = true
    }
  }, [disabled, onLongPress, longPressDelay])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (disabled || !ref.current) return

    const state = gestureState.current
    const touches = Array.from(event.touches)

    if (touches.length === 1) {
      const touch = touches[0]
      const deltaX = touch.clientX - state.startX
      const deltaY = touch.clientY - state.startY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      state.currentX = touch.clientX
      state.currentY = touch.clientY

      // Start panning if threshold exceeded
      if (!state.isPanning && distance > panThreshold) {
        state.isPanning = true
        clearLongPressTimer()
        
        if (onPanStart) {
          onPanStart(createGestureEvent('pan', touch.clientX, touch.clientY, {
            deltaX,
            deltaY,
            distance
          }))
        }

        if (preventScrollOnPan) {
          event.preventDefault()
        }
      }

      // Continue panning
      if (state.isPanning && onPan) {
        onPan(createGestureEvent('pan', touch.clientX, touch.clientY, {
          deltaX,
          deltaY,
          distance
        }))

        if (preventScrollOnPan) {
          event.preventDefault()
        }
      }

      // Clear long press if moved too much
      if (distance > panThreshold) {
        clearLongPressTimer()
      }
    } else if (touches.length === 2 && state.isPinching) {
      // Pinch gesture
      const [touch1, touch2] = touches
      state.currentDistance = getDistance(
        { ...touch1, timestamp: 0 },
        { ...touch2, timestamp: 0 }
      )
      
      const newScale = state.currentDistance / state.initialDistance
      const scaleChange = Math.abs(newScale - state.scale)
      
      if (scaleChange > pinchThreshold) {
        state.scale = newScale
        
        if (onPinch) {
          const centerX = (touch1.clientX + touch2.clientX) / 2
          const centerY = (touch1.clientY + touch2.clientY) / 2
          
          onPinch(createGestureEvent('pinch', centerX, centerY, {
            scale: newScale,
            distance: state.currentDistance
          }))
        }
      }

      event.preventDefault()
    }
  }, [disabled, onPan, onPanStart, onPinch, panThreshold, pinchThreshold, preventScrollOnPan])

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (disabled || !ref.current) return

    const state = gestureState.current
    const endTime = Date.now()
    const duration = endTime - state.startTime
    
    clearLongPressTimer()

    // Remove ended touches
    const changedTouches = Array.from(event.changedTouches)
    changedTouches.forEach(touch => {
      state.touches.delete(touch.identifier)
    })

    if (event.touches.length === 0) {
      // All touches ended
      const deltaX = state.currentX - state.startX
      const deltaY = state.currentY - state.startY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const velocity = distance / duration

      if (state.isPanning) {
        // End pan gesture
        state.isPanning = false
        if (onPanEnd) {
          onPanEnd(createGestureEvent('pan', state.currentX, state.currentY, {
            deltaX,
            deltaY,
            distance,
            velocity,
            duration
          }))
        }
      } else if (state.isPinching) {
        // End pinch gesture
        state.isPinching = false
      } else if (distance < panThreshold && duration < 300) {
        // Tap gesture
        const now = Date.now()
        const timeSinceLastTap = now - state.lastTapTime

        if (timeSinceLastTap < doubleTapDelay && onDoubleTap) {
          // Double tap
          onDoubleTap(createGestureEvent('double-tap', state.currentX, state.currentY))
          state.lastTapTime = 0 // Reset to prevent triple tap
        } else if (onTap) {
          // Single tap
          onTap(createGestureEvent('tap', state.currentX, state.currentY))
          state.lastTapTime = now
        }
      } else if (distance >= swipeThreshold && velocity > 0.5) {
        // Swipe gesture
        if (onSwipe) {
          onSwipe(createGestureEvent('swipe', state.currentX, state.currentY, {
            deltaX,
            deltaY,
            direction: getSwipeDirection(deltaX, deltaY),
            velocity,
            distance,
            duration
          }))
        }
      }

      // Reset state
      state.touches.clear()
      state.scale = 1
    }
  }, [disabled, onTap, onDoubleTap, onSwipe, onPanEnd, doubleTapDelay, swipeThreshold, panThreshold])

  // Set up event listeners
  useEffect(() => {
    const element = ref.current
    if (!element || disabled) return

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
      clearLongPressTimer()
    }
  }, [disabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    gestureState: gestureState.current,
    clearLongPressTimer
  }
}

// Higher-level gesture hooks for common patterns
export function useSwipeNavigation(
  ref: React.RefObject<Element>,
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void
) {
  return useGestures(ref, {
    onSwipe: (event) => {
      switch (event.direction) {
        case 'left':
          onSwipeLeft?.()
          break
        case 'right':
          onSwipeRight?.()
          break
        case 'up':
          onSwipeUp?.()
          break
        case 'down':
          onSwipeDown?.()
          break
      }
    },
    swipeThreshold: 80,
    preventScrollOnPan: true
  })
}

export function usePullToRefresh(
  ref: React.RefObject<Element>,
  onRefresh: () => void,
  threshold = 100
) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  useGestures(ref, {
    onPanStart: (event) => {
      if (event.deltaY && event.deltaY > 0 && window.scrollY === 0) {
        setIsPulling(true)
      }
    },
    onPan: (event) => {
      if (isPulling && event.deltaY && event.deltaY > 0) {
        setPullDistance(Math.min(event.deltaY, threshold * 1.5))
      }
    },
    onPanEnd: (event) => {
      if (isPulling) {
        if (pullDistance >= threshold) {
          onRefresh()
        }
        setIsPulling(false)
        setPullDistance(0)
      }
    },
    panThreshold: 5,
    preventScrollOnPan: true
  })

  return {
    isPulling,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1)
  }
}

export function usePinchToZoom(
  ref: React.RefObject<Element>,
  onZoom?: (scale: number) => void,
  minScale = 0.5,
  maxScale = 3
) {
  const [scale, setScale] = useState(1)

  useGestures(ref, {
    onPinch: (event) => {
      if (event.scale) {
        const newScale = Math.max(minScale, Math.min(maxScale, event.scale))
        setScale(newScale)
        onZoom?.(newScale)
      }
    }
  })

  return { scale, setScale }
}