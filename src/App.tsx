import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import Projects from "./pages/Projects";
import ProjectForm from "./pages/ProjectForm";
import ProjectDetail from "./pages/ProjectDetail";
import DailyUpdates from "./pages/DailyUpdates";
import ActivityLog from "./pages/ActivityLog";
import Reports from "./pages/Reports";
import Users from "./pages/Users";

const queryClient = new QueryClient();

const Shell = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><AppLayout>{children}</AppLayout></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<Shell><Index /></Shell>} />
            <Route path="/projects" element={<Shell><Projects /></Shell>} />
            <Route path="/projects/new" element={<ProtectedRoute roles={["admin"]}><AppLayout><ProjectForm /></AppLayout></ProtectedRoute>} />
            <Route path="/projects/:id" element={<Shell><ProjectDetail /></Shell>} />
            <Route path="/projects/:id/edit" element={<ProtectedRoute roles={["admin"]}><AppLayout><ProjectForm /></AppLayout></ProtectedRoute>} />
            <Route path="/daily-updates" element={<Shell><DailyUpdates /></Shell>} />
            <Route path="/activity" element={<Shell><ActivityLog /></Shell>} />
            <Route path="/reports" element={<Shell><Reports /></Shell>} />
            <Route path="/users" element={<ProtectedRoute roles={["admin", "supervisor"]}><AppLayout><Users /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
