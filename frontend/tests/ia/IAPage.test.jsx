import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import IAPage from '../../src/pages/IAPage'

// Mock the IAAvatar component
vi.mock('../../src/components/common/IAAvatar', () => ({
  default: ({ size, showControls }) => (
    <div data-testid="ia-avatar" data-size={size} data-show-controls={showControls}>
      <div data-testid="avatar-display">Mocked Avatar</div>
      {showControls && (
        <div data-testid="avatar-controls">
          <button data-testid="mic-toggle">Mic</button>
          <button data-testid="mute-toggle">Mute</button>
          <button data-testid="chat-toggle">Chat</button>
        </div>
      )}
      <div data-testid="quick-actions">
        <button data-testid="recommend-drinks">Recommend drinks</button>
        <button data-testid="check-availability">Check availability</button>
        <button data-testid="make-reservation">Make reservation</button>
      </div>
    </div>
  )
}))

const renderIAPage = () => {
  return render(
    <BrowserRouter>
      <IAPage />
    </BrowserRouter>
  )
}

describe('IAPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Page Layout and Structure', () => {
    it('renders the IA page with correct title and description', () => {
      renderIAPage()
      
      expect(screen.getByText('IA Assistant')).toBeTruthy()
      expect(screen.getByText(/Chat with our intelligent assistant for personalized recommendations/)).toBeTruthy()
    })

    it('renders two-panel responsive layout', () => {
      renderIAPage()
      
      // Check for grid container
      const gridContainer = document.querySelector('.grid')
      expect(gridContainer).toBeTruthy()
      expect(gridContainer.classList.contains('grid-cols-1')).toBe(true)
      expect(gridContainer.classList.contains('lg:grid-cols-3')).toBe(true)
    })

    it('renders avatar section with correct positioning', () => {
      renderIAPage()
      
      const avatarSection = document.querySelector('.lg\\:col-span-1')
      expect(avatarSection).toBeTruthy()
      
      // Check for sticky positioning
      const stickyDiv = avatarSection.querySelector('.sticky')
      expect(stickyDiv).toBeTruthy()
    })

    it('renders chat section with correct layout', () => {
      renderIAPage()
      
      const chatSection = document.querySelector('.lg\\:col-span-2')
      expect(chatSection).toBeTruthy()
      
      // Check fixed height
      const chatContainer = chatSection.querySelector('[style*="height: 600px"]')
      expect(chatContainer).toBeTruthy()
    })
  })

  describe('Chat Interface Functionality', () => {
    it('displays initial AI greeting message', () => {
      renderIAPage()
      
      expect(screen.getByText(/Hello! I'm your Nauti Bouys IA assistant/)).toBeTruthy()
    })

    it('renders message input field and send button', () => {
      renderIAPage()
      
      const inputField = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      expect(inputField).toBeTruthy()
      expect(sendButton).toBeTruthy()
    })

    it('allows typing in message input', async () => {
      renderIAPage()
      
      const inputField = screen.getByPlaceholderText('Type your message...')
      
      fireEvent.change(inputField, { target: { value: 'Hello, IA!' } })
      
      expect(inputField.value).toBe('Hello, IA!')
    })

    it('sends message and displays it in chat', async () => {
      renderIAPage()
      
      const inputField = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(inputField, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)
      
      // Check if user message appears
      expect(screen.getByText('Test message')).toBeTruthy()
      
      // Input should be cleared
      expect(inputField.value).toBe('')
    })

    it('shows loading state while AI responds', async () => {
      vi.useFakeTimers()
      renderIAPage()
      
      const inputField = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(inputField, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)
      
      // Should show typing indicator
      expect(screen.getByText('IA is typing...')).toBeTruthy()
      
      // Should show animated dots
      const animatedDots = document.querySelectorAll('.animate-bounce')
      expect(animatedDots.length).toBeGreaterThan(0)
      
      vi.useRealTimers()
    })

    it('generates AI response after delay', async () => {
      vi.useFakeTimers()
      renderIAPage()
      
      const inputField = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(inputField, { target: { value: 'wine' } })
      fireEvent.click(sendButton)
      
      // Fast forward through the 1.5 second delay
      vi.advanceTimersByTime(1500)
      
      await waitFor(() => {
        expect(screen.getByText(/I'd be happy to help you find the perfect beverage/)).toBeTruthy()
      })
      
      vi.useRealTimers()
    })

    it('prevents sending empty messages', () => {
      renderIAPage()
      
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      // Button should be disabled when input is empty
      expect(sendButton).toHaveProperty('disabled', true)
    })

    it('handles form submission with Enter key', () => {
      renderIAPage()
      
      const inputField = screen.getByPlaceholderText('Type your message...')
      
      fireEvent.change(inputField, { target: { value: 'Test message' } })
      fireEvent.submit(inputField.closest('form'))
      
      expect(screen.getByText('Test message')).toBeTruthy()
    })
  })

  describe('Voice Controls', () => {
    it('renders microphone toggle button', () => {
      renderIAPage()
      
      const micButton = screen.getByRole('button', { name: /microphone/i })
      expect(micButton).toBeTruthy()
    })

    it('toggles microphone state on click', () => {
      renderIAPage()
      
      const micButton = screen.getByRole('button', { name: /microphone/i })
      
      // Initial state should show Mic icon (not listening)
      expect(micButton.querySelector('.lucide-mic')).toBeTruthy()
      
      // Click to start listening
      fireEvent.click(micButton)
      
      // Should now show MicOff icon and red styling
      expect(micButton.querySelector('.lucide-mic-off')).toBeTruthy()
      expect(micButton.classList.contains('bg-red-500')).toBe(true)
    })

    it('shows correct visual feedback for listening state', () => {
      renderIAPage()
      
      const micButton = screen.getByRole('button', { name: /microphone/i })
      
      fireEvent.click(micButton)
      
      expect(micButton.classList.contains('bg-red-500')).toBe(true)
      expect(micButton.classList.contains('text-white')).toBe(true)
    })
  })

  describe('Clear Chat Functionality', () => {
    it('renders clear chat button', () => {
      renderIAPage()
      
      const clearButton = screen.getByText('Clear Chat')
      expect(clearButton).toBeTruthy()
    })

    it('clears chat history when clicked', async () => {
      renderIAPage()
      
      // Send a message first
      const inputField = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(inputField, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)
      
      expect(screen.getByText('Test message')).toBeTruthy()
      
      // Clear chat
      const clearButton = screen.getByText('Clear Chat')
      fireEvent.click(clearButton)
      
      // Should only show initial greeting
      expect(screen.queryByText('Test message')).toBeNull()
      expect(screen.getByText(/Hello! I'm your Nauti Bouys IA assistant/)).toBeTruthy()
    })
  })

  describe('IAAvatar Integration', () => {
    it('renders IAAvatar with correct props', () => {
      renderIAPage()
      
      const avatar = screen.getByTestId('ia-avatar')
      expect(avatar).toBeTruthy()
      expect(avatar.getAttribute('data-size')).toBe('large')
      expect(avatar.getAttribute('data-show-controls')).toBe('true')
    })

    it('displays help information sidebar', () => {
      renderIAPage()
      
      expect(screen.getByText('What I can help with:')).toBeTruthy()
      expect(screen.getByText('• Beverage recommendations')).toBeTruthy()
      expect(screen.getByText('• Making reservations')).toBeTruthy()
      expect(screen.getByText('• Menu information')).toBeTruthy()
      expect(screen.getByText('• Event details')).toBeTruthy()
      expect(screen.getByText('• General questions')).toBeTruthy()
    })
  })

  describe('Message Display and Formatting', () => {
    it('displays user messages with correct styling', () => {
      renderIAPage()
      
      const inputField = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(inputField, { target: { value: 'User message' } })
      fireEvent.click(sendButton)
      
      const userMessage = screen.getByText('User message').closest('div')
      expect(userMessage.classList.contains('bg-teal-600')).toBe(true)
      expect(userMessage.classList.contains('text-white')).toBe(true)
    })

    it('displays AI messages with correct styling', () => {
      renderIAPage()
      
      const aiMessage = screen.getByText(/Hello! I'm your Nauti Bouys IA assistant/).closest('div')
      expect(aiMessage.classList.contains('bg-gray-100')).toBe(true)
      expect(aiMessage.classList.contains('text-gray-900')).toBe(true)
    })

    it('displays timestamps for messages', () => {
      renderIAPage()
      
      // Check initial AI message has timestamp
      const timeElements = document.querySelectorAll('[class*="text-xs"]')
      const hasTimestamp = Array.from(timeElements).some(el => 
        el.textContent.match(/\d{1,2}:\d{2}/)
      )
      expect(hasTimestamp).toBe(true)
    })
  })
})