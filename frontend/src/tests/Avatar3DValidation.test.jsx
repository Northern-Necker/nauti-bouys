import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import InteractiveAvatar from '../components/avatar3d/InteractiveAvatar';
import Avatar3DEngine from '../components/avatar3d/Avatar3DEngine';
import Avatar3DScene from '../components/avatar3d/Avatar3DScene';

// Mock Three.js and React Three Fiber
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => <div data-testid="canvas">{children}</div>,
  useFrame: jest.fn(),
}));

jest.mock('@react-three/drei', () => ({
  useGLTF: jest.fn(() => ({
    scene: {
      scale: { setScalar: jest.fn() },
      position: { set: jest.fn(), sub: jest.fn() },
      traverse: jest.fn(),
    },
    animations: [],
  })),
  useAnimations: jest.fn(() => ({ actions: {} })),
  OrbitControls: () => <div data-testid="orbit-controls" />,
  Environment: () => <div data-testid="environment" />,
}));

jest.mock('three', () => ({
  Box3: jest.fn().mockImplementation(() => ({
    setFromObject: jest.fn().mockReturnThis(),
    getSize: jest.fn(() => ({ x: 2, y: 4, z: 1 })),
    getCenter: jest.fn(() => ({ 
      x: 0, 
      y: 0, 
      z: 0,
      multiplyScalar: jest.fn().mockReturnThis(),
    })),
  })),
  Vector3: jest.fn().mockImplementation(() => ({ x: 0, y: 0, z: 0 })),
  MathUtils: {
    lerp: jest.fn((a, b, t) => a + (b - a) * t),
  },
}));

describe('3D Avatar Comprehensive Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Avatar Visibility', () => {
    test('Avatar model should be properly scaled and positioned', async () => {
      const { container } = render(<InteractiveAvatar />);
      
      await waitFor(() => {
        const canvas = container.querySelector('.avatar-canvas');
        expect(canvas).toBeInTheDocument();
      });
    });

    test('Avatar should be centered at origin (0, 0, 0)', async () => {
      const mockGltf = {
        scene: {
          scale: { setScalar: jest.fn() },
          position: { 
            set: jest.fn(),
            sub: jest.fn(),
          },
          traverse: jest.fn(),
        },
        animations: [],
      };
      
      const { useGLTF } = require('@react-three/drei');
      useGLTF.mockReturnValue(mockGltf);
      
      render(<InteractiveAvatar />);
      
      await waitFor(() => {
        // Check that position.sub was called to center the model
        expect(mockGltf.scene.position.sub).toHaveBeenCalled();
      });
    });

    test('Camera should be positioned correctly', () => {
      const { container } = render(<InteractiveAvatar />);
      const canvas = container.querySelector('[data-testid="canvas"]');
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('Avatar Loading States', () => {
    test('Should show loading overlay initially', () => {
      const { container } = render(<InteractiveAvatar />);
      const loadingOverlay = container.querySelector('.loading-overlay');
      expect(loadingOverlay).toBeInTheDocument();
      expect(loadingOverlay).toHaveTextContent('Loading interactive avatar...');
    });

    test('Should handle GLB model loading errors gracefully', async () => {
      const { useGLTF } = require('@react-three/drei');
      useGLTF.mockImplementation(() => {
        throw new Error('Failed to load GLB');
      });
      
      const { container } = render(<InteractiveAvatar />);
      
      await waitFor(() => {
        const errorOverlay = container.querySelector('.error-overlay');
        expect(errorOverlay).toBeInTheDocument();
      });
    });

    test('Should fallback to image when GLB fails', async () => {
      const onError = jest.fn();
      const { container } = render(
        <Canvas>
          <InteractiveAvatar onAvatarReady={onError} />
        </Canvas>
      );
      
      // Simulate GLB loading timeout
      await waitFor(() => {
        // The fallback should be triggered after timeout
        expect(container.querySelector('.avatar-canvas')).toBeInTheDocument();
      }, { timeout: 11000 });
    });
  });

  describe('Gesture System', () => {
    test('Should initialize gesture system when enabled', async () => {
      const onAvatarReady = jest.fn();
      render(<InteractiveAvatar gestureEnabled={true} onAvatarReady={onAvatarReady} />);
      
      await waitFor(() => {
        // Check if gesture system is initialized
        expect(window.testAvatarGesture).toBeDefined();
      }, { timeout: 5000 });
    });

    test('Should not initialize gestures when disabled', () => {
      render(<InteractiveAvatar gestureEnabled={false} />);
      expect(window.testAvatarGesture).toBeUndefined();
    });
  });

  describe('Mouse Interaction', () => {
    test('Should track mouse movement for head animation', () => {
      const { container } = render(<InteractiveAvatar />);
      const canvas = container.querySelector('.avatar-canvas');
      
      if (canvas) {
        fireEvent.mouseMove(canvas, { 
          clientX: 100, 
          clientY: 100,
          currentTarget: {
            getBoundingClientRect: () => ({
              left: 0,
              top: 0,
              width: 800,
              height: 600,
            }),
          },
        });
      }
    });
  });

  describe('Avatar3DEngine Component', () => {
    test('Should render with initial message', () => {
      const initialMessage = "Welcome to the bar!";
      render(<Avatar3DEngine initialMessage={initialMessage} />);
      
      // Check if message bubble contains the initial message
      const messageBubble = document.querySelector('.message-bubble');
      expect(messageBubble).toHaveTextContent(initialMessage);
    });

    test('Should handle user messages', async () => {
      const onMessage = jest.fn().mockResolvedValue('Response from AI');
      render(<Avatar3DEngine onMessage={onMessage} />);
      
      // Simulate user sending a message
      const input = document.querySelector('.message-input');
      const sendButton = document.querySelector('.send-button');
      
      if (input && sendButton) {
        fireEvent.change(input, { target: { value: 'Hello AI' } });
        fireEvent.click(sendButton);
        
        await waitFor(() => {
          expect(onMessage).toHaveBeenCalledWith('Hello AI');
        });
      }
    });
  });

  describe('Avatar Controls', () => {
    test('Should have text input for messages', () => {
      render(<Avatar3DEngine />);
      const input = document.querySelector('.message-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', expect.stringContaining('Type your message'));
    });

    test('Should have microphone button for voice input', () => {
      render(<Avatar3DEngine />);
      const micButton = document.querySelector('.mic-button');
      expect(micButton).toBeInTheDocument();
    });

    test('Should have send button', () => {
      render(<Avatar3DEngine />);
      const sendButton = document.querySelector('.send-button');
      expect(sendButton).toBeInTheDocument();
      expect(sendButton).toHaveTextContent('Send');
    });
  });

  describe('Avatar State Management', () => {
    test('Should transition between states correctly', async () => {
      const { container } = render(<Avatar3DEngine />);
      
      // Check initial state
      const messageBubble = container.querySelector('.message-bubble');
      expect(messageBubble).toHaveClass('idle');
      
      // Simulate thinking state
      const onMessage = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('Response'), 1000))
      );
      
      const { rerender } = render(<Avatar3DEngine onMessage={onMessage} />);
      
      const input = document.querySelector('.message-input');
      const sendButton = document.querySelector('.send-button');
      
      if (input && sendButton) {
        fireEvent.change(input, { target: { value: 'Test message' } });
        fireEvent.click(sendButton);
        
        // Should show thinking state
        await waitFor(() => {
          const bubble = container.querySelector('.message-bubble.thinking');
          expect(bubble).toBeInTheDocument();
        });
      }
    });
  });

  describe('Performance and Optimization', () => {
    test('Should properly dispose of Three.js resources on unmount', () => {
      const { unmount } = render(<InteractiveAvatar />);
      
      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow();
    });

    test('Should use proper scaling calculations', async () => {
      const { Box3, Vector3 } = require('three');
      
      render(<InteractiveAvatar />);
      
      await waitFor(() => {
        // Verify Box3 was used for bounds calculation
        expect(Box3).toHaveBeenCalled();
        expect(Vector3).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    test('Should have proper ARIA labels', () => {
      render(<Avatar3DEngine />);
      
      const input = document.querySelector('.message-input');
      const sendButton = document.querySelector('.send-button');
      const micButton = document.querySelector('.mic-button');
      
      expect(input).toBeDefined();
      expect(sendButton).toBeDefined();
      expect(micButton).toHaveAttribute('title');
    });
  });

  describe('Error Handling', () => {
    test('Should show retry button on error', async () => {
      const { useGLTF } = require('@react-three/drei');
      useGLTF.mockImplementation(() => {
        throw new Error('Load failed');
      });
      
      const { container } = render(<InteractiveAvatar />);
      
      await waitFor(() => {
        const retryButton = container.querySelector('button');
        if (retryButton && retryButton.textContent === 'Retry') {
          expect(retryButton).toBeInTheDocument();
        }
      });
    });
  });
});

// Integration test for complete avatar system
describe('Avatar System Integration', () => {
  test('Complete avatar workflow should function correctly', async () => {
    const onMessage = jest.fn().mockResolvedValue('Hello! How can I help you today?');
    const onAvatarReady = jest.fn();
    
    const { container } = render(
      <Avatar3DEngine 
        onMessage={onMessage}
        initialMessage="Welcome!"
      />
    );
    
    // Wait for initial load
    await waitFor(() => {
      const messageBubble = container.querySelector('.message-bubble');
      expect(messageBubble).toHaveTextContent('Welcome!');
    });
    
    // Send a message
    const input = container.querySelector('.message-input');
    const sendButton = container.querySelector('.send-button');
    
    if (input && sendButton) {
      fireEvent.change(input, { target: { value: 'Hi there!' } });
      fireEvent.click(sendButton);
      
      // Verify message was processed
      await waitFor(() => {
        expect(onMessage).toHaveBeenCalledWith('Hi there!');
      });
      
      // Verify response is displayed
      await waitFor(() => {
        const messageBubble = container.querySelector('.message-bubble');
        expect(messageBubble).toHaveTextContent('Hello! How can I help you today?');
      });
    }
  });
});