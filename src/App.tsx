import type React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuthStore } from "./stores/authStore"
import { AuthForm } from "./components/auth/AuthForm"
import { Layout } from "./components/layout/Layout"
import { Dashboard } from "./pages/Dashboard"
import { GroupList } from "./pages/GroupList"
import { ProjectList } from "./pages/ProjectList"
import { RecordList } from "./pages/RecordList"

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthForm />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="groups" element={<GroupList />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="records" element={<RecordList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
