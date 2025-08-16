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
import EnhancedIAPage from './pages/EnhancedIAPage'
import SimpleIAPage from './pages/SimpleIAPage'
import EnhancedDidAgentPage from './pages/EnhancedDidAgentPage'
import NautiBouysDIDAgentPage from './pages/NautiBouysDIDAgentPage'
import DIDStreamingPage from './pages/DIDStreamingPage'
import TestDidIntegration from './components/TestDidIntegration'

function App() {
  return (
    <Router>
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
          <Route path="/ia" element={<EnhancedIAPage />} />
          <Route path="/ia/basic" element={<IAPage />} />
          <Route path="/ia/simple" element={<SimpleIAPage />} />
          <Route path="/ia/did-agent" element={<EnhancedDidAgentPage />} />
          <Route path="/ia/nauti-bouys-agent" element={<NautiBouysDIDAgentPage />} />
          <Route path="/ia/did-streaming" element={<DIDStreamingPage />} />
          <Route path="/test-did" element={<TestDidIntegration />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
