import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./layouts/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductCard from "./pages/ProductCard";
import Sales from "./pages/Sales";
import SalesList from "./pages/SalesList";
import SaleDetails from "./pages/SaleDetails";
import Invoice from "./pages/Invoice";
import Inventory from "./pages/Inventory";
import Returns from "./pages/Returns";
import SalesReturn from "./pages/SalesReturn";
import Suppliers from "./pages/Suppliers";
import PurchaseInvoices from "./pages/PurchaseInvoices";
import Expenses from "./pages/Expenses";
import ProfitLoss from "./pages/ProfitLoss";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import FastLoginTestPanel from "./pages/FastLoginTestPanel";
import StartShift from "./pages/StartShift";
import CardTerminalSimulator from "./pages/CardTerminalSimulator";
import "./App.css";
import "./styles/print.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/fast-login-test" element={<FastLoginTestPanel />} />
          <Route path="/terminal-simulator" element={<CardTerminalSimulator />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route
              path="products"
              element={
                <ProtectedRoute requiredPermission="view products">
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="products/:id"
              element={
                <ProtectedRoute requiredPermission="view products">
                  <ProductCard />
                </ProtectedRoute>
              }
            />
            <Route
              path="sales"
              element={
                <ProtectedRoute requiredPermission="create sales">
                  <Sales />
                </ProtectedRoute>
              }
            />
            <Route
              path="sales-list"
              element={
                <ProtectedRoute requiredPermission="view sales">
                  <SalesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="sales/:id"
              element={
                <ProtectedRoute requiredPermission="view sales">
                  <SaleDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="sales/:id/invoice"
              element={
                <ProtectedRoute requiredPermission="view sales">
                  <Invoice />
                </ProtectedRoute>
              }
            />
            <Route
              path="inventory"
              element={
                <ProtectedRoute requiredPermission="view inventory">
                  <Inventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="returns"
              element={
                <ProtectedRoute requiredPermission="view returns">
                  <Returns />
                </ProtectedRoute>
              }
            />
            <Route
              path="sales-returns"
              element={
                <ProtectedRoute requiredPermission="create returns">
                  <SalesReturn />
                </ProtectedRoute>
              }
            />
            <Route
              path="suppliers"
              element={
                <ProtectedRoute requiredPermission="view suppliers">
                  <Suppliers />
                </ProtectedRoute>
              }
            />
            <Route
              path="purchase-invoices"
              element={
                <ProtectedRoute requiredPermission="view purchases">
                  <PurchaseInvoices />
                </ProtectedRoute>
              }
            />
            <Route
              path="expenses"
              element={
                <ProtectedRoute requiredPermission="view expenses">
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="profit-loss"
              element={
                <ProtectedRoute requiredPermission="view reports">
                  <ProfitLoss />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute requiredPermission="view reports">
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute requiredPermission="view settings">
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute requiredPermission="view users">
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="roles"
              element={
                <ProtectedRoute requiredPermission="view roles">
                  <Roles />
                </ProtectedRoute>
              }
            />
            <Route path="profile" element={<Profile />} />
            <Route
              path="start-shift"
              element={
                <ProtectedRoute requiredPermission="create sales">
                  <StartShift />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
