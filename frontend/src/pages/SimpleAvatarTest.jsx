import React, { useState, useEffect } from 'react';

export default function SimpleAvatarTest() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('SimpleAvatarTest mounted');
  }, []);

  const nextStep = () => {
    try {
      setStep(prev => prev + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Error: {error}</h1>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#f5f7fa', minHeight: '100vh' }}>
      <h1 style={{ 
        background: '#3b82f6', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        🔧 Simple Avatar Test - Step {step}
      </h1>

      {step >= 1 && (
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          margin: '20px 0', 
          borderRadius: '8px',
          border: '2px solid #22c55e'
        }}>
          <h2>✅ Step 1: Basic React Component Works</h2>
          <p>This page is loading correctly without any 3D components.</p>
          <button 
            onClick={nextStep}
            style={{ 
              background: '#22c55e', 
              color: 'white', 
              padding: '10px 20px', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Next Step: Try Loading Avatar
          </button>
        </div>
      )}

      {step >= 2 && (
        <AvatarLoader />
      )}
    </div>
  );
}

function AvatarLoader() {
  const [avatarError, setAvatarError] = useState(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  useEffect(() => {
    console.log('Attempting to load InteractiveAvatar...');
    
    // Try to import the avatar component
    import('../components/avatar3d/InteractiveAvatar')
      .then(() => {
        console.log('✅ InteractiveAvatar imported successfully');
        setAvatarLoaded(true);
      })
      .catch((err) => {
        console.error('❌ Failed to import InteractiveAvatar:', err);
        setAvatarError(err.message);
      });
  }, []);

  if (avatarError) {
    return (
      <div style={{ 
        background: '#fecaca', 
        padding: '20px', 
        margin: '20px 0', 
        borderRadius: '8px',
        border: '2px solid #ef4444'
      }}>
        <h2>❌ Step 2: Avatar Import Failed</h2>
        <p><strong>Error:</strong> {avatarError}</p>
        <p>The InteractiveAvatar component has import/compilation issues.</p>
        <details>
          <summary>Technical Details</summary>
          <pre style={{ background: '#f3f4f6', padding: '10px', fontSize: '12px' }}>
            {avatarError}
          </pre>
        </details>
      </div>
    );
  }

  if (!avatarLoaded) {
    return (
      <div style={{ 
        background: '#fef3c7', 
        padding: '20px', 
        margin: '20px 0', 
        borderRadius: '8px',
        border: '2px solid #f59e0b'
      }}>
        <h2>⏳ Step 2: Loading Avatar Component...</h2>
        <p>Importing InteractiveAvatar component...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      background: '#dcfce7', 
      padding: '20px', 
      margin: '20px 0', 
      borderRadius: '8px',
      border: '2px solid #22c55e'
    }}>
      <h2>✅ Step 2: Avatar Component Loaded Successfully</h2>
      <p>InteractiveAvatar imported without errors.</p>
      <RenderAvatarTest />
    </div>
  );
}

function RenderAvatarTest() {
  const [renderError, setRenderError] = useState(null);
  const [InteractiveAvatar, setInteractiveAvatar] = useState(null);

  useEffect(() => {
    import('../components/avatar3d/InteractiveAvatar')
      .then((module) => {
        setInteractiveAvatar(() => module.default);
      })
      .catch((err) => {
        setRenderError(err.message);
      });
  }, []);

  if (renderError) {
    return (
      <div style={{ 
        background: '#fecaca', 
        padding: '20px', 
        margin: '20px 0', 
        borderRadius: '8px',
        border: '2px solid #ef4444'
      }}>
        <h3>❌ Step 3: Avatar Render Failed</h3>
        <p>Error: {renderError}</p>
      </div>
    );
  }

  if (!InteractiveAvatar) {
    return (
      <div style={{ 
        background: '#fef3c7', 
        padding: '20px', 
        margin: '20px 0', 
        borderRadius: '8px'
      }}>
        <h3>⏳ Step 3: Preparing Avatar Render...</h3>
      </div>
    );
  }

  return (
    <div style={{ 
      background: '#dcfce7', 
      padding: '20px', 
      margin: '20px 0', 
      borderRadius: '8px',
      border: '2px solid #22c55e'
    }}>
      <h3>✅ Step 3: Rendering Avatar</h3>
      <div style={{ 
        height: '400px', 
        border: '2px dashed #666', 
        borderRadius: '8px',
        background: '#f9fafb'
      }}>
        <ErrorBoundary>
          <InteractiveAvatar />
        </ErrorBoundary>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
          <h4>❌ Avatar Rendering Error</h4>
          <p>{this.state.error}</p>
        </div>
      );
    }

    return this.props.children;
  }
}