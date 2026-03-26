import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import AddExpense from "./pages/AddExpense";
import ScanReceipt from "./pages/ScanReceipt";

import ReceiptList from "./pages/ReceiptList";
import Claims from "./pages/Claims";
import VoiceEntry from "./pages/VoiceEntry";
import Budget from "./pages/Budget";
import Forecast from "./pages/Forecast";
import Groups from "./pages/Groups";
import Reminders from "./pages/Reminders";
import Settings from "./pages/Settings";
import InvestmentAnalyzer from "./pages/InvestmentAnalyzer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="income" element={<Income />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="expenses/add" element={<AddExpense />} />
              <Route path="expenses/scan" element={<ScanReceipt />} />
              <Route path="expenses/voice" element={<VoiceEntry />} />
              
              <Route path="receipts" element={<ReceiptList />} />
              <Route path="claims" element={<Claims />} />
              <Route path="budget" element={<Budget />} />
              <Route path="forecast" element={<Forecast />} />
              <Route path="investments" element={<InvestmentAnalyzer />} />
              <Route path="groups" element={<Groups />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
