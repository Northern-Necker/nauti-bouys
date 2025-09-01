import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import BeveragesPage from './pages/beverages/BeveragesPage'
import CocktailsPage from './pages/cocktails/CocktailsPage'
import WinesPage from './pages/wines/WinesPage'
import SpiritsPage from './pages/spirits/SpiritsPage'
import CalendarPage from './pages/CalendarPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import IAPage from './pages/IAPage'
import SimpleIAPage from './pages/SimpleIAPage'
const MultiAvatarAIPage = lazy(() => import('./pages/MultiAvatarAIPage'))
const FbxViewer = lazy(() => import('./pages/FbxViewer'))
const InteractiveAvatarPage = lazy(() => import('./pages/InteractiveAvatarPage'))
const GLBTestPage = lazy(() => import('./pages/GLBTestPage'))
const GLBTestPageFixed = lazy(() => import('./pages/GLBTestPageFixed'))
const GLBTestMinimal = lazy(() => import('./pages/GLBTestMinimal'))
const BasicThreeTest = lazy(() => import('./pages/BasicThreeTest'))
const UltraMinimalGLBTest = lazy(() => import('./pages/UltraMinimalGLBTest'))
const PureThreeGLBTest = lazy(() => import('./pages/PureThreeGLBTest'))
const Avatar3DDemo = lazy(() => import('./pages/Avatar3DDemo'))
const AvatarValidationTest = lazy(() => import('./pages/AvatarValidationTest'))
const SimpleAvatarDebugPage = lazy(() => import('./pages/SimpleAvatarDebugPage'))
const AvatarScaleDebugPage = lazy(() => import('./pages/AvatarScaleDebugPage'))
const WorkingAvatarScaleTest = lazy(() => import('./pages/WorkingAvatarScaleTest'))
const SafeVisemeTest = lazy(() => import('./pages/SafeVisemeTest'))
const MinimalVisemeTest = lazy(() => import('./pages/MinimalVisemeTest'))
const SimpleReactTest = lazy(() => import('./pages/SimpleReactTest'))
const WorkingSafeVisemeTest = lazy(() => import('./pages/WorkingSafeVisemeTest'))
const GLBInspectorPage = lazy(() => import('./pages/GLBInspectorPage'))
const GLBAvatarValidationTest = lazy(() => import('./pages/GLBAvatarValidationTest'))
const GLBAvatarValidationTestSimple = lazy(() => import('./pages/GLBAvatarValidationTestSimple'))
const GLBDebugTest = lazy(() => import('./pages/GLBDebugTest'))
const GLBMinimalTest = lazy(() => import('./pages/GLBMinimalTest'))
const GLBLifecycleTest = lazy(() => import('./pages/GLBLifecycleTest'))
const GLBSimpleLifecycle = lazy(() => import('./pages/GLBSimpleLifecycle'))
const GLBPureTest = lazy(() => import('./pages/GLBPureTest'))
const MorphTargetAnalyzerPage = lazy(() => import('./pages/MorphTargetAnalyzerPage'))
const ActorCoreLipSyncTestPage = lazy(() => import('./pages/ActorCoreLipSyncTestPage'))
const FBXActorCoreLipSyncTestPage = lazy(() => import('./pages/FBXActorCoreLipSyncTestPage'))
const GLBActorCoreLipSyncTestPage = lazy(() => import('./pages/GLBActorCoreLipSyncTestPage'))
const BabylonLipSyncTestPage = lazy(() => import('./pages/BabylonLipSyncTestPage'))
const UnityLipSyncTestPage = lazy(() => import('./pages/UnityLipSyncTestPage'))
const EnhancedLipSyncTestPage = lazy(() => import('./pages/EnhancedLipSyncTestPage'))
const TTSLipSyncTestPage = lazy(() => import('./pages/TTSLipSyncTestPage'))
const TongueMorphTestPage = lazy(() => import('./pages/TongueMorphTestPage'))
const VisemeAnalysisPage = lazy(() => import('./pages/VisemeAnalysisPage'))
const TTSLipSyncTestPageFixed = lazy(() => import('./pages/TTSLipSyncTestPageFixed'))
const EnhancedTTSLipSyncPage = lazy(() => import('./pages/EnhancedTTSLipSyncPage'))
const VisemeLipSyncTestPage = lazy(() => import('./pages/VisemeLipSyncTestPage'))
const EmotionalLipSyncValidationPage = lazy(() => import('./pages/EmotionalLipSyncValidationPage'))
const Avatar3DTestPage = lazy(() => import('./pages/Avatar3DTestPage'))
const WorkingAvatarTest = lazy(() => import('./pages/WorkingAvatarTest'))
const SimpleAvatarTest = lazy(() => import('./pages/SimpleAvatarTest'))
const DirectTest = lazy(() => import('./pages/DirectTest'))
const SimpleTest = lazy(() => import('./pages/SimpleTest'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ConsolidatedAvatarTestPage = lazy(() => import('./pages/ConsolidatedAvatarTestPage'))
const OwnerDashboard = lazy(() => import('./components/owner/OwnerDashboard'))

function App() {
  return (
    <Router>
      <Routes>
        {/* Direct test routes - NO LAYOUT */}
        <Route 
          path="/direct-test" 
          element={
            <Suspense fallback={<div>Loading Direct Test...</div>}>
              <DirectTest />
            </Suspense>
          } 
        />
        <Route 
          path="/safe-viseme-test" 
          element={
            <Suspense fallback={<div>Loading Safe Viseme Test...</div>}>
              <SafeVisemeTest />
            </Suspense>
          } 
        />
        <Route 
          path="/minimal-viseme-test" 
          element={
            <Suspense fallback={<div>Loading Minimal Test...</div>}>
              <MinimalVisemeTest />
            </Suspense>
          } 
        />
        <Route 
          path="/simple-react-test" 
          element={
            <Suspense fallback={<div>Loading Simple Test...</div>}>
              <SimpleReactTest />
            </Suspense>
          } 
        />
        <Route 
          path="/working-safe-viseme-test" 
          element={
            <Suspense fallback={<div>Loading Working Viseme Test...</div>}>
              <WorkingSafeVisemeTest />
            </Suspense>
          } 
        />
        <Route 
          path="/glb-test" 
          element={
            <Suspense fallback={<div>Loading GLB Test...</div>}>
              <PureThreeGLBTest />
            </Suspense>
          } 
        />
        <Route
          path="/consolidated-avatar-test"
          element={
            <Suspense fallback={<div>Loading Consolidated Avatar Test...</div>}>
              <ConsolidatedAvatarTestPage />
            </Suspense>
          }
        />
        
        {/* All other routes with Layout */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/beverages" element={<BeveragesPage />} />
              <Route path="/cocktails" element={<CocktailsPage />} />
              <Route path="/wines" element={<WinesPage />} />
              <Route path="/spirits" element={<SpiritsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Main Bartender AI Assistant with Enhanced Emotional Avatar */}
              <Route path="/ia" element={<IAPage />} />
              <Route path="/ia/basic" element={<IAPage />} />
              <Route path="/ia/simple" element={<SimpleIAPage />} />
              <Route
                path="/ia/advanced-avatar"
                element={
                  <Suspense fallback={<div>Loading sophisticated avatar...</div>}>
                    <MultiAvatarAIPage />
                  </Suspense>
                }
              />
              <Route
                path="/fbx-viewer"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <FbxViewer />
                  </Suspense>
                }
              />
              <Route
                path="/interactive-avatar"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <InteractiveAvatarPage />
                  </Suspense>
                }
              />
              <Route
                path="/glb-inspector"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <GLBInspectorPage />
                  </Suspense>
                }
              />
              <Route
                path="/glb-test-original"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <GLBTestPage />
                  </Suspense>
                }
              />
              <Route
                path="/glb-avatar-validation"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <GLBAvatarValidationTest />
                  </Suspense>
                }
              />
              <Route
                path="/glb-simple"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <GLBAvatarValidationTestSimple />
                  </Suspense>
                }
              />
              <Route
                path="/glb-debug"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <GLBDebugTest />
                  </Suspense>
                }
              />
              <Route
                path="/glb-minimal"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <GLBMinimalTest />
                  </Suspense>
                }
              />
              <Route
                path="/glb-lifecycle"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <GLBLifecycleTest />
                  </Suspense>
                }
              />
              <Route
                path="/glb-simple-lifecycle"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <GLBSimpleLifecycle />
                  </Suspense>
                }
              />
              <Route
                path="/glb-pure"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <GLBPureTest />
                  </Suspense>
                }
              />
              <Route
                path="/avatar-demo"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <Avatar3DDemo />
                  </Suspense>
                }
              />
              <Route
                path="/avatar-validation"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <AvatarValidationTest />
                  </Suspense>
                }
              />
              <Route
                path="/avatar-debug"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <SimpleAvatarDebugPage />
                  </Suspense>
                }
              />
              <Route
                path="/avatar-scale-debug"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <AvatarScaleDebugPage />
                  </Suspense>
                }
              />
              <Route
                path="/avatar-scale-test"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <WorkingAvatarScaleTest />
                  </Suspense>
                }
              />
              <Route
                path="/morph-analyzer"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <MorphTargetAnalyzerPage />
                  </Suspense>
                }
              />
              <Route
                path="/actorcore-test"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <ActorCoreLipSyncTestPage />
                  </Suspense>
                }
              />
              <Route
                path="/fbx-actorcore-lipsync-test"
                element={
                  <Suspense fallback={<div>Loading FBX ActorCore Lip-Sync Test...</div>}>
                    <FBXActorCoreLipSyncTestPage />
                  </Suspense>
                }
              />
              <Route
                path="/glb-actorcore-lipsync-test"
                element={
                  <Suspense fallback={<div>Loading GLB ActorCore Lip-Sync Test...</div>}>
                    <GLBActorCoreLipSyncTestPage />
                  </Suspense>
                }
              />
              <Route
                path="/tongue-morph-test"
                element={
                  <Suspense fallback={<div>Loading Tongue Morph Test...</div>}>
                    <TongueMorphTestPage />
                  </Suspense>
                }
              />
              <Route
                path="/viseme-analysis"
                element={
                  <Suspense fallback={<div>Loading Viseme Analysis...</div>}>
                    <VisemeAnalysisPage />
                  </Suspense>
                }
              />
              <Route
                path="/babylon-lipsync-test"
                element={
                  <Suspense fallback={<div>Loading Babylon.js Lip-Sync Test...</div>}>
                    <BabylonLipSyncTestPage />
                  </Suspense>
                }
              />
              <Route
                path="/unity-lipsync-test"
                element={
                  <Suspense fallback={<div>Loading Unity WebGL Lip-Sync Test...</div>}>
                    <UnityLipSyncTestPage />
                  </Suspense>
                }
              />
              <Route
                path="/enhanced-lipsync-test"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <EnhancedLipSyncTestPage />
                  </Suspense>
                }
              />
              <Route
                path="/tts-lipsync-test"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <TTSLipSyncTestPage />
                  </Suspense>
                }
              />
              <Route
                path="/tts-lipsync-test-fixed"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <TTSLipSyncTestPageFixed />
                  </Suspense>
                }
              />
              <Route
                path="/enhanced-tts-lipsync"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <EnhancedTTSLipSyncPage />
                  </Suspense>
                }
              />
              <Route
                path="/viseme-test"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <VisemeLipSyncTestPage />
                  </Suspense>
                }
              />
              <Route
                path="/multi-avatar-ai"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <MultiAvatarAIPage />
                  </Suspense>
                }
              />
              <Route
                path="/emotional-lipsync-validation"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <EmotionalLipSyncValidationPage />
                  </Suspense>
                }
              />
              <Route
                path="/avatar-test"
                element={
                  <Suspense fallback={<div>Loading Avatar Test...</div>}>
                    <Avatar3DTestPage />
                  </Suspense>
                }
              />
              <Route
                path="/working-avatar-test"
                element={
                  <Suspense fallback={<div>Loading Working Avatar Test...</div>}>
                    <WorkingAvatarTest />
                  </Suspense>
                }
              />
              <Route
                path="/simple-avatar-test"
                element={
                  <Suspense fallback={<div>Loading Simple Avatar Test...</div>}>
                    <SimpleAvatarTest />
                  </Suspense>
                }
              />
              <Route
                path="/simple-test"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <SimpleTest />
                  </Suspense>
                }
              />
              <Route
                path="/settings"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <SettingsPage />
                  </Suspense>
                }
              />
              <Route
                path="/owner/dashboard"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <OwnerDashboard />
                  </Suspense>
                }
              />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  )
}

export default App
