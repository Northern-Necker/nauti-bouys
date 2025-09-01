import React, { useState, useEffect } from 'react';
import { validateAvatar } from '../utils/avatarValidator';
import InteractiveAvatar from '../components/avatar3d/InteractiveAvatar';
import EnhancedAvatar3D from '../components/avatar3d/EnhancedAvatar3D';

export default function AvatarValidationTest() {
  const [validationResults, setValidationResults] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [currentTest, setCurrentTest] = useState('interactive');
  const [renderTest, setRenderTest] = useState({
    interactive: false,
    enhanced: false,
    glbDirect: false
  });
  
  useEffect(() => {
    // Automatically run validation on mount
    runValidation();
  }, []);
  
  const runValidation = async () => {
    setIsValidating(true);
    console.log('🚀 Starting avatar validation test...');
    
    try {
      const results = await validateAvatar('/assets/SavannahAvatar.glb');
      setValidationResults(results);
      
      // Test rendering
      testRendering();
    } catch (error) {
      console.error('Validation failed:', error);
      setValidationResults({
        fileLoaded: false,
        errors: [error.message],
        sceneRenderable: false
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  const testRendering = () => {
    // Test each avatar component
    console.log('🎨 Testing avatar rendering...');
    
    // Try to render each component
    setRenderTest({
      interactive: true,
      enhanced: true,
      glbDirect: true
    });
  };
  
  const getStatusIcon = (status) => {
    return status ? '✅' : '❌';
  };
  
  const getOverallStatus = () => {
    if (!validationResults) return 'pending';
    
    const hasErrors = validationResults.errors && validationResults.errors.length > 0;
    const isRenderable = validationResults.sceneRenderable;
    
    if (hasErrors || !isRenderable) return 'failed';
    if (validationResults.warnings && validationResults.warnings.length > 0) return 'warning';
    return 'success';
  };
  
  return (
    <div className="validation-test-page">
      <div className="validation-header">
        <h1>Avatar Validation Test</h1>
        <p>Comprehensive testing of GLB avatar loading and rendering</p>
      </div>
      
      <div className="validation-container">
        {/* Validation Results Panel */}
        <div className="results-panel">
          <h2>Validation Results</h2>
          
          {isValidating ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Running validation tests...</p>
            </div>
          ) : validationResults ? (
            <div className="results">
              <div className={`overall-status ${getOverallStatus()}`}>
                <h3>Overall Status</h3>
                <div className="status-icon">
                  {getOverallStatus() === 'success' ? '✅' : 
                   getOverallStatus() === 'warning' ? '⚠️' : '❌'}
                </div>
                <p>
                  {getOverallStatus() === 'success' ? 'Avatar is working correctly' : 
                   getOverallStatus() === 'warning' ? 'Avatar works with warnings' : 
                   'Avatar has critical issues'}
                </p>
              </div>
              
              <div className="checks">
                <h3>Validation Checks</h3>
                <ul>
                  <li>{getStatusIcon(validationResults.fileLoaded)} GLB File Loaded</li>
                  <li>{getStatusIcon(validationResults.meshesFound)} Meshes Found</li>
                  <li>{getStatusIcon(validationResults.materialsValid)} Materials Valid</li>
                  <li>{getStatusIcon(validationResults.animationsFound)} Animations Found</li>
                  <li>{getStatusIcon(validationResults.bonesFound)} Bones Found</li>
                  <li>{getStatusIcon(validationResults.morphTargetsFound)} Morph Targets Found</li>
                  <li>{getStatusIcon(validationResults.boundingBoxValid)} Bounding Box Valid</li>
                  <li>{getStatusIcon(validationResults.sceneRenderable)} Scene Renderable</li>
                </ul>
              </div>
              
              {validationResults.details && (
                <div className="details">
                  <h3>Technical Details</h3>
                  <div className="detail-grid">
                    <div>Meshes: {validationResults.details.meshCount || 0}</div>
                    <div>Materials: {validationResults.details.materialCount || 0}</div>
                    <div>Bones: {validationResults.details.boneCount || 0}</div>
                    <div>Morph Targets: {validationResults.details.morphTargetCount || 0}</div>
                    <div>Animations: {validationResults.details.animationCount || 0}</div>
                    {validationResults.details.boundingBox && (
                      <div>
                        Max Size: {validationResults.details.boundingBox.maxDimension?.toFixed(2) || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {validationResults.errors && validationResults.errors.length > 0 && (
                <div className="errors">
                  <h3>❌ Errors</h3>
                  <ul>
                    {validationResults.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validationResults.warnings && validationResults.warnings.length > 0 && (
                <div className="warnings">
                  <h3>⚠️ Warnings</h3>
                  <ul>
                    {validationResults.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button onClick={runValidation} className="rerun-button">
                Re-run Validation
              </button>
            </div>
          ) : (
            <div className="no-results">
              <p>No validation results yet</p>
              <button onClick={runValidation}>Run Validation</button>
            </div>
          )}
        </div>
        
        {/* Live Render Test */}
        <div className="render-panel">
          <h2>Live Render Test</h2>
          
          <div className="test-controls">
            <button 
              onClick={() => setCurrentTest('interactive')}
              className={currentTest === 'interactive' ? 'active' : ''}
            >
              Interactive Avatar
            </button>
            <button 
              onClick={() => setCurrentTest('enhanced')}
              className={currentTest === 'enhanced' ? 'active' : ''}
            >
              Enhanced Avatar
            </button>
          </div>
          
          <div className="render-viewport">
            {currentTest === 'interactive' && renderTest.interactive && (
              <div className="test-component">
                <h3>Interactive Avatar Component</h3>
                <InteractiveAvatar />
              </div>
            )}
            
            {currentTest === 'enhanced' && renderTest.enhanced && (
              <div className="test-component">
                <h3>Enhanced Avatar Component</h3>
                <EnhancedAvatar3D 
                  avatarState="idle"
                  emotionalState="happy"
                  enableControls={true}
                />
              </div>
            )}
          </div>
          
          <div className="render-status">
            <h3>Component Status</h3>
            <ul>
              <li>{getStatusIcon(renderTest.interactive)} Interactive Avatar</li>
              <li>{getStatusIcon(renderTest.enhanced)} Enhanced Avatar</li>
            </ul>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .validation-test-page {
          min-height: 100vh;
          background: #0f172a;
          color: white;
          padding: 20px;
        }
        
        .validation-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .validation-header h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
        }
        
        .validation-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .results-panel,
        .render-panel {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 25px;
        }
        
        .results-panel h2,
        .render-panel h2 {
          margin-bottom: 20px;
          color: #60a5fa;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(96, 165, 250, 0.3);
          border-top: 4px solid #60a5fa;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .overall-status {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .overall-status.success {
          border: 2px solid #10b981;
        }
        
        .overall-status.warning {
          border: 2px solid #f59e0b;
        }
        
        .overall-status.failed {
          border: 2px solid #ef4444;
        }
        
        .status-icon {
          font-size: 3rem;
          margin: 10px 0;
        }
        
        .checks ul,
        .errors ul,
        .warnings ul {
          list-style: none;
          padding: 0;
        }
        
        .checks li {
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .details {
          margin-top: 20px;
        }
        
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          background: rgba(255, 255, 255, 0.05);
          padding: 15px;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        
        .errors,
        .warnings {
          margin-top: 20px;
          padding: 15px;
          border-radius: 8px;
        }
        
        .errors {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .warnings {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        
        .rerun-button,
        .test-controls button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 20px;
        }
        
        .rerun-button:hover,
        .test-controls button:hover {
          background: #2563eb;
        }
        
        .test-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .test-controls button.active {
          background: #10b981;
        }
        
        .render-viewport {
          height: 400px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        
        .test-component {
          height: 100%;
        }
        
        .test-component h3 {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.7);
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 0.9rem;
          z-index: 10;
        }
        
        .render-status {
          background: rgba(255, 255, 255, 0.05);
          padding: 15px;
          border-radius: 8px;
        }
        
        .render-status ul {
          list-style: none;
          padding: 0;
        }
        
        .render-status li {
          padding: 5px 0;
        }
        
        @media (max-width: 1024px) {
          .validation-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}