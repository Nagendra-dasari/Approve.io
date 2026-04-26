import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/common/ToastProvider";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import VerifyOtpPage from "./modules/auth/pages/VerifyOtpPage";
import SetPasswordPage from "./modules/auth/pages/SetPasswordPage";
import ForgotPasswordPage from "./modules/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "./modules/auth/pages/ResetPasswordPage";
import TenantsPage from "./modules/tenants/pages/TenantsPage";
import RolesPage from "./modules/roles/pages/RolesPage";
import PermissionsPage from "./modules/permissions/pages/PermissionsPage";
import PositionsPage from "./modules/positions/pages/PositionsPage";
import AssignmentsPage from "./modules/assignments/pages/AssignmentsPage";
import PeoplePage from "./modules/users/pages/PeoplePage";
import WorkflowsPage from "./modules/workflows/pages/WorkflowsPage";
import FormsPage from "./modules/forms/pages/FormsPage";
import PublicLinksPage from "./modules/publicForms/pages/PublicLinksPage";
import KycPage from "./modules/kyc/pages/KycPage";
import SignaturesPage from "./modules/signatures/pages/SignaturesPage";
import DocumentsPage from "./modules/documents/pages/DocumentsPage";
import ImportsPage from "./modules/imports/pages/ImportsPage";
import NotificationsPage from "./modules/notifications/pages/NotificationsPage";
import AuditPage from "./modules/audit/pages/AuditPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import { ROUTE_PERMISSIONS } from "./lib/access-control";
import SetupChecklistPage from "./pages/SetupChecklistPage";
import PermissionMatrixPage from "./pages/PermissionMatrixPage";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/set-password" element={<SetPasswordPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="setup-checklist" element={<SetupChecklistPage />} />
              <Route
                path="permission-matrix"
                element={
                  <ProtectedRoute requiredPermissions={ROUTE_PERMISSIONS["/permission-matrix"]}>
                    <PermissionMatrixPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tenants"
                element={
                  <ProtectedRoute requiredPermissions={ROUTE_PERMISSIONS["/tenants"]}>
                    <TenantsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="roles"
                element={
                  <ProtectedRoute requiredPermissions={ROUTE_PERMISSIONS["/roles"]}>
                    <RolesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="permissions"
                element={
                  <ProtectedRoute requiredPermissions={ROUTE_PERMISSIONS["/permissions"]}>
                    <PermissionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="positions"
                element={
                  <ProtectedRoute requiredPermissions={ROUTE_PERMISSIONS["/positions"]}>
                    <PositionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="people"
                element={
                  <ProtectedRoute requiredPermissions={ROUTE_PERMISSIONS["/people"]}>
                    <PeoplePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="assignments"
                element={
                  <ProtectedRoute requiredPermissions={ROUTE_PERMISSIONS["/assignments"]}>
                    <AssignmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="workflows"
                element={
                  <ProtectedRoute requiredPermissions={ROUTE_PERMISSIONS["/workflows"]}>
                    <WorkflowsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="forms"
                element={
                  <ProtectedRoute requiredPermissions={ROUTE_PERMISSIONS["/forms"]}>
                    <FormsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="public-links"
                element={
                  <ProtectedRoute requiredPermissions={ROUTE_PERMISSIONS["/public-links"]}>
                    <PublicLinksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="kyc"
                element={
                  <ProtectedRoute requiredPermissions={ROUTE_PERMISSIONS["/kyc"]}>
                    <KycPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="signatures"
                element={
                  <ProtectedRoute requiredPermissions={ROUTE_PERMISSIONS["/signatures"]}>
                    <SignaturesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="documents"
                element={
                  <ProtectedRoute requiredPermissions={ROUTE_PERMISSIONS["/documents"]}>
                    <DocumentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="imports"
                element={
                  <ProtectedRoute requiredPermissions={ROUTE_PERMISSIONS["/imports"]}>
                    <ImportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="notifications"
                element={
                  <ProtectedRoute requiredPermissions={ROUTE_PERMISSIONS["/notifications"]}>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit"
                element={
                  <ProtectedRoute requiredPermissions={ROUTE_PERMISSIONS["/audit"]}>
                    <AuditPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="/access-denied" element={<AccessDeniedPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
