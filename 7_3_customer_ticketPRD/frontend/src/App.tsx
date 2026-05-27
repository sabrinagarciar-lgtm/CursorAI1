import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "./components/Layout";
import { RequireAuth, RequireRole } from "./components/AuthGuards";
import { AgentsPage } from "./pages/AgentsPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { TicketListPage } from "./pages/TicketListPage";
import { TicketNewPage } from "./pages/TicketNewPage";
import { UsersPage } from "./pages/UsersPage";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route
            path="tickets"
            element={
              <RequireAuth>
                <TicketListPage />
              </RequireAuth>
            }
          />
          <Route
            path="tickets/new"
            element={
              <RequireAuth>
                <TicketNewPage />
              </RequireAuth>
            }
          />
          <Route
            path="tickets/:id"
            element={
              <RequireAuth>
                <TicketDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="agents"
            element={
              <RequireAuth>
                <RequireRole roles={["agent", "admin"]}>
                  <AgentsPage />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="users"
            element={
              <RequireAuth>
                <RequireRole roles={["admin"]}>
                  <UsersPage />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
