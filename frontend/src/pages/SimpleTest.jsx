import React from 'react';

export default function SimpleTest() {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: 'red', fontSize: '48px' }}>
        🔴 SIMPLE TEST PAGE WORKING
      </h1>
      <p style={{ fontSize: '24px' }}>
        If you see this, the page is loading correctly.
      </p>
      <div style={{ 
        background: 'yellow', 
        padding: '20px', 
        border: '3px solid red',
        margin: '20px 0' 
      }}>
        <h2>This is a test to verify page loading works</h2>
        <p>The issue is likely in the InteractiveAvatar import or Three.js dependencies</p>
      </div>
    </div>
  );
}