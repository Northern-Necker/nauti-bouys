import React from 'react';
import InteractiveAvatar from '../components/avatar3d/InteractiveAvatar';

export default function GLBTestMinimal() {
  React.useEffect(() => {
    // Block PDF extension interference
    const originalQuerySelectorAll = document.querySelectorAll;
    document.querySelectorAll = function(selector) {
      try {
        return originalQuerySelectorAll.call(this, selector);
      } catch (e) {
        console.warn('Selector error blocked:', e.message);
        return [];
      }
    };
    
    return () => {
      document.querySelectorAll = originalQuerySelectorAll;
    };
  }, []);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#1f2937', marginBottom: '20px' }}>
        GLB Test - Minimal (Working Pattern)
      </h1>
      
      <div style={{ 
        border: '2px solid #d1d5db', 
        borderRadius: '12px', 
        marginBottom: '20px',
        height: '400px',
        background: '#f9fafb',
        position: 'relative'
      }}>
        <div style={{ width: '100%', height: '100%' }}>
          <InteractiveAvatar className="test-avatar" />
        </div>
      </div>
      
      <div style={{ color: '#666' }}>
        <p>✅ Extension interference blocked</p>
        <p>This uses the exact same pattern as the working GLBAvatarValidationTest page.</p>
      </div>
    </div>
  );
}