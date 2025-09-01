import React from 'react';

export default function SimpleReactTest() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#333', 
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <h1>✅ React is Working!</h1>
      <p>This is a simple test to confirm React rendering works</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}