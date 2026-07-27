import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ClanPage from './pages/ClanPage'
import PersonPage from './pages/PersonPage'
import RequireStaff from './components/RequireStaff'
import StaffDashboard from './pages/staff/StaffDashboard'
import { AuthProvider } from './lib/useAuth.jsx'
import CreatePerson from './pages/staff/CreatePerson'
import PersonsList from './pages/staff/PersonsList'
import EditPerson from './pages/staff/EditPerson'
import CampsManager from './pages/staff/CampsManager'
import StaffManager from './pages/staff/StaffManager'
import AuditLogViewer from './pages/staff/AuditLogViewer'
import IncoherenceChecker from './pages/staff/IncoherenceChecker'
import MergePersons from './pages/staff/MergePersons'
import { ThemeProvider } from './lib/useTheme'
import ThemeToggle from './components/ThemeToggle'
import Pantheon from './pages/Pantheon'
import CompatibilityChecker from './pages/staff/CompatibilityChecker'
import NavToggle from './components/NavToggle'
import Informations from './pages/Informations'
import AuDela from './pages/AuDela'

function App() {
  return (
    <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <ThemeToggle />
        <NavToggle />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clan/:campId" element={<ClanPage />} />
          <Route path="/personnage/:personId" element={<PersonPage />} />
          <Route
            path="/staff"
            element={
              <RequireStaff>
                <StaffDashboard />
              </RequireStaff>
            }
          />
          <Route
          path="/staff/creer-personnage"
          element={
            <RequireStaff>
              <CreatePerson />
            </RequireStaff>
          }
        />
        <Route
          path="/staff/personnages"
          element={<RequireStaff><PersonsList /></RequireStaff>}
        />
        <Route
          path="/staff/personnage/:personId/modifier"
          element={<RequireStaff><EditPerson /></RequireStaff>}
        />
        <Route
          path="/staff/camps"
          element={<RequireStaff><CampsManager /></RequireStaff>}
        />
        <Route
          path="/staff/gestion-staff"
          element={<RequireStaff adminOnly><StaffManager /></RequireStaff>}
        />
        <Route
          path="/staff/historique"
          element={<RequireStaff><AuditLogViewer /></RequireStaff>}
        />
        <Route
          path="/staff/verification"
          element={<RequireStaff><IncoherenceChecker /></RequireStaff>}
        />
        <Route
          path="/staff/fusion"
          element={<RequireStaff><MergePersons /></RequireStaff>}
        />
        <Route path="/pantheon" element={<Pantheon />} />
        <Route
          path="/staff/compatibilite"
          element={<RequireStaff><CompatibilityChecker /></RequireStaff>}
        />
        <Route path="/informations" element={<Informations />} />
        <Route path="/audela" element={<AuDela />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App