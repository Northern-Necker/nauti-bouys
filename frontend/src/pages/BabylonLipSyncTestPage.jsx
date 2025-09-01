/**
 * Babylon.js Lip-Sync Test Page
 * 
 * Tests if Babylon.js can access tongue morphs that Three.js cannot
 */

import React, { useEffect, useRef, useState } from 'react';
import { BabylonActorCoreLipSync } from '../utils/babylonActorCoreLipSync';

const BabylonLipSyncTestPage = () => {
    const canvasRef = useRef(null);
    const lipSyncRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [morphInfo, setMorphInfo] = useState(null);
    const [currentViseme, setCurrentViseme] = useState('sil');
    
    // All visemes for testing
    const visemes = [
        { key: 'sil', label: 'Silence', description: 'Closed mouth' },
        { key: 'aa', label: 'AA', description: 'Father (AH)' },
        { key: 'E', label: 'E', description: 'Eat (EE)' },
        { key: 'ih', label: 'IH', description: 'It (IH)' },
        { key: 'oh', label: 'OH', description: 'Open (OH)' },
        { key: 'ou', label: 'OU', description: 'Oops (OO)' },
        { key: 'PP', label: 'PP', description: 'Pop (P, B, M) - Reduced intensity' },
        { key: 'DD', label: 'DD ⚠️', description: 'Dog (D, T) - NEEDS TONGUE_TIP_UP' },
        { key: 'nn', label: 'NN ⚠️', description: 'No (N) - NEEDS TONGUE_TIP_UP' },
        { key: 'TH', label: 'TH', description: 'Think - Tongue Out (working)' },
        { key: 'kk', label: 'KK', description: 'Key (K, G) - Jaw Forward' },
        { key: 'RR', label: 'RR ⚠️', description: 'Run (R) - NEEDS TONGUE_CURL' },
        { key: 'FF', label: 'FF', description: 'Fish (F, V)' },
        { key: 'SS', label: 'SS', description: 'Sun (S, Z)' },
        { key: 'CH', label: 'CH', description: 'Church (CH, SH, J)' }
    ];
    
    useEffect(() => {
        if (canvasRef.current) {
            // Initialize Babylon.js lip-sync system
            lipSyncRef.current = new BabylonActorCoreLipSync(
                canvasRef.current,
                '/assets/Grace40s.fbx'
            );
            
            // Wait for model to load
            setTimeout(() => {
                if (lipSyncRef.current) {
                    setIsLoaded(true);
                    
                    // Get morph information
                    const morphs = Array.from(lipSyncRef.current.morphTargets.keys());
                    const tongueMorphs = morphs.filter(m => m.toLowerCase().includes('tongue'));
                    
                    setMorphInfo({
                        total: morphs.length,
                        tongueCount: tongueMorphs.length,
                        tongueMorphs: tongueMorphs,
                        hasTongueOut: morphs.includes('Tongue_Out'),
                        hasTongueTipUp: morphs.includes('Tongue_Tip_Up'),
                        hasTongueCurl: morphs.includes('Tongue_Curl')
                    });
                }
            }, 3000); // Give time for model to load
        }
        
        return () => {
            if (lipSyncRef.current) {
                lipSyncRef.current.dispose();
            }
        };
    }, []);
    
    const applyViseme = (viseme) => {
        if (lipSyncRef.current && isLoaded) {
            lipSyncRef.current.applyViseme(viseme);
            setCurrentViseme(viseme);
        }
    };
    
    const testTongueMorphs = () => {
        if (lipSyncRef.current && isLoaded) {
            lipSyncRef.current.testTongueMorphs();
        }
    };
    
    const testSentence = () => {
        if (lipSyncRef.current && isLoaded) {
            // Test sentence: "The dog ran near the thin path"
            // Tests: TH, DD, RR, NN visemes specifically
            const sequence = [
                'TH', 'ih',      // The
                'DD', 'oh', 'kk', // dog
                'RR', 'aa', 'nn', // ran
                'nn', 'ih', 'RR', // near
                'TH', 'ih',      // the
                'TH', 'ih', 'nn', // thin
                'PP', 'aa', 'TH', // path
                'sil'
            ];
            
            lipSyncRef.current.animateVisemes(sequence, 300);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-4 text-cyan-400">
                    Babylon.js Lip-Sync Test - Tongue Morph Access
                </h1>
                
                {/* Status Panel */}
                <div className="bg-gray-800 p-4 rounded-lg mb-4">
                    <h2 className="text-xl font-semibold mb-2 text-yellow-400">
                        Morph Target Status
                    </h2>
                    {morphInfo ? (
                        <div className="space-y-2">
                            <p>Total morphs accessible: <span className="text-green-400">{morphInfo.total}</span></p>
                            <p>Tongue morphs found: <span className={morphInfo.tongueCount > 0 ? 'text-green-400' : 'text-red-400'}>
                                {morphInfo.tongueCount}
                            </span></p>
                            
                            <div className="mt-3">
                                <p className="font-semibold mb-1">Critical Tongue Morphs:</p>
                                <ul className="ml-4 space-y-1">
                                    <li className={morphInfo.hasTongueOut ? 'text-green-400' : 'text-red-400'}>
                                        {morphInfo.hasTongueOut ? '✓' : '✗'} Tongue_Out (TH viseme)
                                    </li>
                                    <li className={morphInfo.hasTongueTipUp ? 'text-green-400' : 'text-red-400'}>
                                        {morphInfo.hasTongueTipUp ? '✓' : '✗'} Tongue_Tip_Up (NN, DD visemes)
                                    </li>
                                    <li className={morphInfo.hasTongueCurl ? 'text-green-400' : 'text-red-400'}>
                                        {morphInfo.hasTongueCurl ? '✓' : '✗'} Tongue_Curl (RR viseme)
                                    </li>
                                </ul>
                            </div>
                            
                            {morphInfo.tongueMorphs.length > 0 && (
                                <div className="mt-3">
                                    <p className="font-semibold mb-1">All tongue morphs:</p>
                                    <ul className="ml-4 text-sm text-gray-300">
                                        {morphInfo.tongueMorphs.map(morph => (
                                            <li key={morph}>• {morph}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-400">Loading model...</p>
                    )}
                </div>
                
                {/* 3D Canvas */}
                <div className="bg-gray-800 p-4 rounded-lg mb-4">
                    <h2 className="text-xl font-semibold mb-2">3D Model View</h2>
                    <canvas 
                        ref={canvasRef}
                        className="w-full h-96 bg-black rounded"
                        style={{ touchAction: 'none' }}
                    />
                    <p className="text-sm text-gray-400 mt-2">
                        Current Viseme: <span className="text-cyan-400 font-semibold">{currentViseme.toUpperCase()}</span>
                    </p>
                </div>
                
                {/* Test Controls */}
                <div className="bg-gray-800 p-4 rounded-lg mb-4">
                    <h2 className="text-xl font-semibold mb-3">Test Controls</h2>
                    
                    {/* Special Tests */}
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2 text-yellow-400">Special Tests</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={testTongueMorphs}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                                disabled={!isLoaded}
                            >
                                Test Tongue Morphs
                            </button>
                            <button
                                onClick={testSentence}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
                                disabled={!isLoaded}
                            >
                                Test Sentence (DD, NN, RR, TH)
                            </button>
                        </div>
                    </div>
                    
                    {/* Individual Visemes */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Individual Visemes</h3>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                            {visemes.map((viseme) => (
                                <button
                                    key={viseme.key}
                                    onClick={() => applyViseme(viseme.key)}
                                    className={`px-3 py-2 rounded transition-all ${
                                        currentViseme === viseme.key 
                                            ? 'bg-cyan-600 ring-2 ring-cyan-400' 
                                            : viseme.label.includes('⚠️')
                                                ? 'bg-red-600 hover:bg-red-700'
                                                : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                    disabled={!isLoaded}
                                    title={viseme.description}
                                >
                                    {viseme.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Comparison with Three.js */}
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2 text-cyan-400">
                        Three.js vs Babylon.js Comparison
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-red-900/20 p-3 rounded">
                            <h3 className="font-semibold text-red-400 mb-2">Three.js (Current)</h3>
                            <ul className="text-sm space-y-1">
                                <li>✗ Cannot access Tongue_Tip_Up</li>
                                <li>✗ Cannot access Tongue_Curl</li>
                                <li>✓ Can access Tongue_Out</li>
                                <li>✗ NN viseme shows no change</li>
                                <li>✗ DD and RR look identical</li>
                            </ul>
                        </div>
                        <div className="bg-green-900/20 p-3 rounded">
                            <h3 className="font-semibold text-green-400 mb-2">Babylon.js (Test)</h3>
                            <ul className="text-sm space-y-1">
                                <li>? Testing Tongue_Tip_Up access</li>
                                <li>? Testing Tongue_Curl access</li>
                                <li>? Testing Tongue_Out access</li>
                                <li>? Testing NN viseme articulation</li>
                                <li>? Testing DD/RR differentiation</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                {/* Instructions */}
                <div className="mt-4 p-4 bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold text-blue-400 mb-2">Testing Instructions:</h3>
                    <ol className="text-sm space-y-1 ml-4">
                        <li>1. Check the Morph Target Status panel - do we see tongue morphs?</li>
                        <li>2. Click "Test Tongue Morphs" - watch for tongue visibility</li>
                        <li>3. Test NN viseme - does the tongue tip go up?</li>
                        <li>4. Test DD viseme - is it different from KK?</li>
                        <li>5. Test RR viseme - does the tongue curl back?</li>
                        <li>6. Run "Test Sentence" for animated sequence</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default BabylonLipSyncTestPage;
