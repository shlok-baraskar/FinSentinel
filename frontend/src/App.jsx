import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Alerts from './pages/Alerts'
import Analytics from './pages/Analytics'
import TeamManagement from './pages/TeamManagement'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-dark-950 transition-colors duration-200 [html:not(.dark)_&]:bg-gray-50">
              <Sidebar />
              <main className="ml-64 p-8 max-w-7xl">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/team" element={<TeamManagement />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App