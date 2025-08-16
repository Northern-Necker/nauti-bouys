import React from 'react';
import InteractiveAvatar from '../components/avatar3d/InteractiveAvatar';

export default function InteractiveAvatarPage() {
  return (
    <div className="interactive-avatar-page">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Interactive 3D Avatar
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience our interactive 3D avatar powered by React Three Fiber. 
            The avatar responds to your mouse movements with realistic head tracking 
            and features smooth animations.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <InteractiveAvatar className="mb-8" />
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Features
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="feature-card">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">👁️</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800">
                    Mouse Head Tracking
                  </h3>
                </div>
                <p className="text-gray-600">
                  The avatar's head follows your mouse cursor for natural interaction
                </p>
              </div>
              
              <div className="feature-card">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">🎮</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800">
                    Interactive Controls
                  </h3>
                </div>
                <p className="text-gray-600">
                  Zoom, rotate, and explore the avatar from different angles
                </p>
              </div>
              
              <div className="feature-card">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">🎭</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800">
                    FBX Model Support
                  </h3>
                </div>
                <p className="text-gray-600">
                  Supports FBX models with animations and bone structures
                </p>
              </div>
              
              <div className="feature-card">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">⚡</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800">
                    Smooth Performance
                  </h3>
                </div>
                <p className="text-gray-600">
                  Optimized rendering with React Three Fiber for smooth 60fps
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mt-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Technical Details
            </h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="tech-detail">
                <strong className="text-gray-700">Framework:</strong>
                <span className="text-gray-600 ml-2">React Three Fiber</span>
              </div>
              <div className="tech-detail">
                <strong className="text-gray-700">3D Engine:</strong>
                <span className="text-gray-600 ml-2">Three.js</span>
              </div>
              <div className="tech-detail">
                <strong className="text-gray-700">Model Format:</strong>
                <span className="text-gray-600 ml-2">FBX</span>
              </div>
              <div className="tech-detail">
                <strong className="text-gray-700">Animation:</strong>
                <span className="text-gray-600 ml-2">Bone-based</span>
              </div>
              <div className="tech-detail">
                <strong className="text-gray-700">Interaction:</strong>
                <span className="text-gray-600 ml-2">Mouse tracking</span>
              </div>
              <div className="tech-detail">
                <strong className="text-gray-700">Controls:</strong>
                <span className="text-gray-600 ml-2">Orbit camera</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .interactive-avatar-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        
        .feature-card {
          transition: transform 0.2s ease-in-out;
        }
        
        .feature-card:hover {
          transform: translateY(-2px);
        }
        
        .tech-detail {
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .tech-detail:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}
