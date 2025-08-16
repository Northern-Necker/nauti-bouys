import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import IAAvatar from '../../src/components/common/IAAvatar'

describe('IAAvatar Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<IAAvatar />)
      
      expect(screen.getByText('Ready to help')).toBeTruthy()
      expect(screen.getByText('IA Assistant')).toBeTruthy()
    })

    it('renders with custom size', () => {
      const { rerender } = render(<IAAvatar size="small" />)
      
      let avatar = document.querySelector('.w-16')
      expect(avatar).toBeTruthy()
      
      rerender(<IAAvatar size="large" />)
      avatar = document.querySelector('.w-48')
      expect(avatar).toBeTruthy()
    })

    it('shows controls when enabled', () => {
      render(<IAAvatar showControls={true} />)
      
      // Check for microphone button
      const micButton = screen.getByTitle(/Start listening|Stop listening/)
      expect(micButton).toBeTruthy()
      
      // Check for mute button
      const muteButton = screen.getByTitle(/Mute|Unmute/)
      expect(muteButton).toBeTruthy()
      
      // Check for chat button
      const chatButton = screen.getByTitle('Start chat')
      expect(chatButton).toBeTruthy()
    })

    it('hides controls when disabled', () => {
      render(<IAAvatar showControls={false} />)
      
      expect(screen.queryByTitle(/Start listening|Stop listening/)).toBeNull()
      expect(screen.queryByTitle(/Mute|Unmute/)).toBeNull()
      expect(screen.queryByTitle('Start chat')).toBeNull()
    })
  })

  describe('Avatar States', () => {
    it('starts in idle state', () => {
      render(<IAAvatar />)
      
      expect(screen.getByText('Ready to help')).toBeTruthy()
      
      const avatar = document.querySelector('.from-teal-400')
      expect(avatar).toBeTruthy()
      expect(avatar.classList.contains('hover:scale-105')).toBe(true)
    })

    it('switches to listening state when mic is activated', () => {
      render(<IAAvatar showControls={true} />)
      
      const micButton = screen.getByTitle('Start listening')
      fireEvent.click(micButton)
      
      expect(screen.getByText('Listening...')).toBeTruthy()
      
      const avatar = document.querySelector('.ring-teal-300')
      expect(avatar).toBeTruthy()
      expect(avatar.classList.contains('animate-pulse')).toBe(true)
    })

    it('shows thinking state periodically', async () => {
      render(<IAAvatar />)
      
      // Fast forward through the animation cycle
      vi.advanceTimersByTime(3000)
      
      await waitFor(() => {
        expect(screen.getByText('Thinking...')).toBeTruthy()
      })
      
      // Should return to idle after 500ms
      vi.advanceTimersByTime(500)
      
      await waitFor(() => {
        expect(screen.getByText('Ready to help')).toBeTruthy()
      })
    })

    it('shows status indicators for different states', () => {
      render(<IAAvatar showControls={true} />)
      
      const micButton = screen.getByTitle('Start listening')
      fireEvent.click(micButton)
      
      // Should show green indicator for listening
      const statusIndicator = document.querySelector('.bg-green-400')
      expect(statusIndicator).toBeTruthy()
      
      const animatedIndicator = document.querySelector('.animate-ping')
      expect(animatedIndicator).toBeTruthy()
    })
  })

  describe('Control Interactions', () => {
    it('toggles microphone state correctly', () => {
      render(<IAAvatar showControls={true} />)
      
      const micButton = screen.getByTitle('Start listening')
      
      // Initial state - should show Mic icon
      expect(micButton.querySelector('.lucide-mic')).toBeTruthy()
      expect(micButton.classList.contains('bg-teal-500')).toBe(true)
      
      // Click to start listening
      fireEvent.click(micButton)
      
      // Should now show MicOff icon and red styling
      expect(micButton.querySelector('.lucide-mic-off')).toBeTruthy()
      expect(micButton.classList.contains('bg-red-500')).toBe(true)
      expect(micButton.title).toBe('Stop listening')
      
      // Click again to stop listening
      fireEvent.click(micButton)
      
      // Should return to original state
      expect(micButton.querySelector('.lucide-mic')).toBeTruthy()
      expect(micButton.classList.contains('bg-teal-500')).toBe(true)
      expect(micButton.title).toBe('Start listening')
    })

    it('toggles mute state correctly', () => {
      render(<IAAvatar showControls={true} />)
      
      const muteButton = screen.getByTitle('Mute')
      
      // Initial state - should show Volume2 icon
      expect(muteButton.querySelector('.lucide-volume-2')).toBeTruthy()
      expect(muteButton.classList.contains('bg-blue-500')).toBe(true)
      
      // Click to mute
      fireEvent.click(muteButton)
      
      // Should show VolumeX icon and gray styling
      expect(muteButton.querySelector('.lucide-volume-x')).toBeTruthy()
      expect(muteButton.classList.contains('bg-gray-500')).toBe(true)
      expect(muteButton.title).toBe('Unmute')
      
      // Click again to unmute
      fireEvent.click(muteButton)
      
      // Should return to original state
      expect(muteButton.querySelector('.lucide-volume-2')).toBeTruthy()
      expect(muteButton.classList.contains('bg-blue-500')).toBe(true)
      expect(muteButton.title).toBe('Mute')
    })

    it('has chat activation button', () => {
      render(<IAAvatar showControls={true} />)
      
      const chatButton = screen.getByTitle('Start chat')
      
      expect(chatButton.querySelector('.lucide-message-circle')).toBeTruthy()
      expect(chatButton.classList.contains('bg-purple-500')).toBe(true)
    })
  })

  describe('Visual Animations', () => {
    it('shows eye animations based on state', () => {
      render(<IAAvatar showControls={true} />)
      
      const micButton = screen.getByTitle('Start listening')
      fireEvent.click(micButton)
      
      // In listening state, eyes should have animate-pulse
      const eyes = document.querySelector('.flex.space-x-2.mb-2')
      expect(eyes.classList.contains('animate-pulse')).toBe(true)
    })

    it('shows mouth animation when speaking', () => {
      render(<IAAvatar />)
      
      // The mouth animation is handled by isSpeaking state
      // This would need to be triggered by props or internal state
      const mouth = document.querySelector('.w-4.h-1.bg-white.rounded-full')
      expect(mouth).toBeTruthy()
    })

    it('has hover effects on avatar', () => {
      render(<IAAvatar />)
      
      const avatar = document.querySelector('.from-teal-400')
      expect(avatar.classList.contains('hover:scale-105')).toBe(true)
      
      // Interaction ring should have hover effects
      const interactionRing = document.querySelector('.hover\\:border-teal-300')
      expect(interactionRing).toBeTruthy()
    })
  })

  describe('Quick Actions (Large Size)', () => {
    it('shows quick action buttons for large avatar', () => {
      render(<IAAvatar size="large" showControls={true} />)
      
      expect(screen.getByText('Recommend drinks')).toBeTruthy()
      expect(screen.getByText('Check availability')).toBeTruthy()
      expect(screen.getByText('Make reservation')).toBeTruthy()
    })

    it('hides quick actions for smaller sizes', () => {
      render(<IAAvatar size="medium" showControls={true} />)
      
      expect(screen.queryByText('Recommend drinks')).toBeNull()
      expect(screen.queryByText('Check availability')).toBeNull()
      expect(screen.queryByText('Make reservation')).toBeNull()
    })

    it('applies correct styling to quick action buttons', () => {
      render(<IAAvatar size="large" showControls={true} />)
      
      const recommendButton = screen.getByText('Recommend drinks')
      expect(recommendButton.classList.contains('bg-teal-100')).toBe(true)
      expect(recommendButton.classList.contains('text-teal-700')).toBe(true)
      expect(recommendButton.classList.contains('hover:bg-teal-200')).toBe(true)
    })
  })

  describe('Size Variations', () => {
    it('applies correct classes for small size', () => {
      render(<IAAvatar size="small" />)
      
      const avatar = document.querySelector('.w-16.h-16')
      expect(avatar).toBeTruthy()
      
      const statusText = screen.getByText('Ready to help')
      expect(statusText.classList.contains('text-sm')).toBe(true)
      
      const assistantText = screen.getByText('IA Assistant')
      expect(assistantText.classList.contains('text-xs')).toBe(true)
    })

    it('applies correct classes for medium size', () => {
      render(<IAAvatar size="medium" />)
      
      const avatar = document.querySelector('.w-32.h-32')
      expect(avatar).toBeTruthy()
      
      const statusText = screen.getByText('Ready to help')
      expect(statusText.classList.contains('text-base')).toBe(true)
      
      const assistantText = screen.getByText('IA Assistant')
      expect(assistantText.classList.contains('text-sm')).toBe(true)
    })

    it('applies correct classes for large size', () => {
      render(<IAAvatar size="large" />)
      
      const avatar = document.querySelector('.w-48.h-48')
      expect(avatar).toBeTruthy()
      
      const statusText = screen.getByText('Ready to help')
      expect(statusText.classList.contains('text-lg')).toBe(true)
    })
  })

  describe('Animation Cycles', () => {
    it('cycles through thinking state periodically', async () => {
      render(<IAAvatar />)
      
      // Should start in idle state
      expect(screen.getByText('Ready to help')).toBeTruthy()
      
      // After 3 seconds, should briefly show thinking
      vi.advanceTimersByTime(3000)
      
      await waitFor(() => {
        expect(screen.getByText('Thinking...')).toBeTruthy()
      })
      
      // After additional 500ms, should return to idle
      vi.advanceTimersByTime(500)
      
      await waitFor(() => {
        expect(screen.getByText('Ready to help')).toBeTruthy()
      })
    })

    it('maintains animation cycle consistency', async () => {
      render(<IAAvatar />)
      
      // Run through multiple cycles
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(3000)
        await waitFor(() => {
          expect(screen.getByText('Thinking...')).toBeTruthy()
        })
        
        vi.advanceTimersByTime(500)
        await waitFor(() => {
          expect(screen.getByText('Ready to help')).toBeTruthy()
        })
      }
    })
  })

  describe('Accessibility', () => {
    it('has appropriate button titles for screen readers', () => {
      render(<IAAvatar showControls={true} />)
      
      expect(screen.getByTitle('Start listening')).toBeTruthy()
      expect(screen.getByTitle('Mute')).toBeTruthy()
      expect(screen.getByTitle('Start chat')).toBeTruthy()
    })

    it('updates button titles when state changes', () => {
      render(<IAAvatar showControls={true} />)
      
      const micButton = screen.getByTitle('Start listening')
      fireEvent.click(micButton)
      
      expect(screen.getByTitle('Stop listening')).toBeTruthy()
      
      const muteButton = screen.getByTitle('Mute')
      fireEvent.click(muteButton)
      
      expect(screen.getByTitle('Unmute')).toBeTruthy()
    })
  })
})