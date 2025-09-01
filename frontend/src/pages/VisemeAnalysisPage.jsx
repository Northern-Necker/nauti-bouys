import React, { useState, useEffect } from 'react';
import { analyzeVisemeMappings, getEnhancedVisemeMappings } from '../utils/visemeAnalyzer';
import { extractMorphTargets } from '../utils/morphTargetExtractor';

const VisemeAnalysisPage = () => {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [morphTargets, setMorphTargets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const glbUrl = '/assets/party-f-0013-fixed.glb';

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Extract all morph targets
      const morphs = await extractMorphTargets(glbUrl);
      setMorphTargets(morphs);
      
      // Analyze viseme mappings
      const analysis = await analyzeVisemeMappings(glbUrl);
      setAnalysisResults(analysis);
      
      console.log('🔍 Analysis Complete:', analysis);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  const getEnhancedMappings = () => {
    const enhanced = getEnhancedVisemeMappings();
    return enhanced;
  };

  const renderMorphList = (morphs, title, color) => {
    if (!morphs || morphs.length === 0) return null;
    
    return (
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ color }}>{title} ({morphs.length})</h4>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px'
        }}>
          {morphs.map((morph, idx) => (
            <span key={idx} style={{
              padding: '4px 8px',
              backgroundColor: color,
              color: 'white',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {morph}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderVisemeComparison = () => {
    const enhanced = getEnhancedMappings();
    
    return Object.entries(enhanced).map(([viseme, data]) => {
      const current = data.current.join(', ');
      const suggested = data.suggested.join(', ');
      const isChanged = current !== suggested;
      
      return (
        <div key={viseme} style={{
          padding: '15px',
          marginBottom: '10px',
          backgroundColor: isChanged ? '#fff3cd' : '#d4edda',
          border: isChanged ? '1px solid #ffc107' : '1px solid #28a745',
          borderRadius: '4px'
        }}>
          <h4>{viseme} - {data.description}</h4>
          <div style={{ marginBottom: '8px' }}>
            <strong>Current:</strong> {current}
          </div>
          <div style={{ marginBottom: '8px', color: isChanged ? '#856404' : '#155724' }}>
            <strong>Suggested:</strong> {suggested}
          </div>
          {isChanged && (
            <div style={{ color: '#721c24', fontStyle: 'italic' }}>
              ⚠️ Enhancement available
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Viseme Mapping Analysis</h1>
      
      <button 
        onClick={runAnalysis}
        disabled={loading}
        style={{
          padding: '10px 20px',
          marginBottom: '20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'wait' : 'pointer'
        }}
      >
        {loading ? 'Analyzing...' : 'Re-run Analysis'}
      </button>

      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}

      {morphTargets && (
        <div style={{ marginBottom: '40px' }}>
          <h2>Available Morph Targets</h2>
          {renderMorphList(morphTargets.bodyMorphs, 'Body Morphs', '#007bff')}
          {renderMorphList(morphTargets.tongueMorphs, 'Tongue Morphs', '#dc3545')}
        </div>
      )}

      {analysisResults && (
        <>
          <div style={{ marginBottom: '40px' }}>
            <h2>Current Usage Analysis</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <h3>✅ Used Morphs ({analysisResults.usedMorphs.length})</h3>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px',
                padding: '10px',
                backgroundColor: '#d4edda',
                borderRadius: '4px'
              }}>
                {analysisResults.usedMorphs.map((morph, idx) => (
                  <span key={idx} style={{
                    padding: '4px 8px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {morph}
                  </span>
                ))}
              </div>
            </div>

            {analysisResults.missingMorphs.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3>❌ Missing Morphs ({analysisResults.missingMorphs.length})</h3>
                <div style={{ 
                  padding: '10px',
                  backgroundColor: '#f8d7da',
                  borderRadius: '4px'
                }}>
                  {analysisResults.missingMorphs.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: '5px' }}>
                      <strong>{item.viseme}:</strong> {item.morph}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <h3>🔍 Unused Morphs Available for Enhancement</h3>
              {renderMorphList(analysisResults.suggestions.lipMorphs, 'Unused Lip Morphs', '#6c757d')}
              {renderMorphList(analysisResults.suggestions.tongueMorphs, 'Unused Tongue Morphs', '#6c757d')}
              {renderMorphList(analysisResults.suggestions.jawMorphs, 'Unused Jaw Morphs', '#6c757d')}
              {renderMorphList(analysisResults.suggestions.facialMorphs, 'Unused Facial Morphs', '#6c757d')}
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h2>Enhanced Mapping Recommendations</h2>
            <p>Based on the available morphs, here are the recommended enhancements for each viseme:</p>
            {renderVisemeComparison()}
          </div>

          <div style={{ 
            padding: '20px',
            backgroundColor: '#e7f3ff',
            borderRadius: '4px',
            marginTop: '40px'
          }}>
            <h3>Summary</h3>
            <ul>
              <li>Total Available Morphs: {morphTargets ? 
                (morphTargets.bodyMorphs ? morphTargets.bodyMorphs.length : 0) + 
                (morphTargets.tongueMorphs ? morphTargets.tongueMorphs.length : 0) : 0}</li>
              <li>Currently Used: {analysisResults.usedMorphs ? analysisResults.usedMorphs.length : 0}</li>
              <li>Unused (Available for Enhancement): {analysisResults.unusedMorphs ? analysisResults.unusedMorphs.length : 0}</li>
              <li>Missing (Need Fixing): {analysisResults.missingMorphs ? analysisResults.missingMorphs.length : 0}</li>
            </ul>
            <p style={{ marginTop: '15px', fontWeight: 'bold' }}>
              💡 Recommendation: Update the viseme mappings to utilize the unused morphs for enhanced realism, 
              especially the tongue and lip morphs that can add subtle details to speech animation.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default VisemeAnalysisPage;
