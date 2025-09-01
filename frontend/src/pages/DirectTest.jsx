import React from 'react';

export default function DirectTest() {
  console.log('DirectTest component rendering');
  
  return (
    <div style={{ 
      background: 'red', 
      color: 'white', 
      padding: '50px', 
      fontSize: '24px',
      minHeight: '100vh',
      margin: 0
    }}>
      <h1 style={{ fontSize: '48px', margin: 0 }}>
        🔴 DIRECT TEST - NO LAYOUT
      </h1>
      <p style={{ fontSize: '24px', margin: '20px 0' }}>
        If you see this red page, React routing works.
      </p>
      <p style={{ fontSize: '18px', margin: '20px 0' }}>
        The issue is likely in the Layout component or CSS conflicts.
      </p>
      <div style={{
        background: 'yellow',
        color: 'black',
        padding: '20px',
        margin: '20px 0',
        border: '5px solid blue'
      }}>
        <h2>This should be highly visible</h2>
        <p>If this appears, the component is rendering</p>
      </div>
    </div>
  );
}