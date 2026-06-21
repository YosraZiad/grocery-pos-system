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
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductCard />} />
            <Route path="sales" element={<Sales />} />
            <Route path="sales-list" element={<SalesList />} />
            <Route path="sales/:id" element={<SaleDetails />} />
            <Route path="sales/:id/invoice" element={<Invoice />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="returns" element={<Returns />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="purchase-invoices" element={<PurchaseInvoices />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="profit-loss" element={<ProfitLoss />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="users" element={<Users />} />
            <Route path="roles" element={<Roles />} />
            <Route path="profile" element={<Profile />} />
            <Route path="start-shift" element={<StartShift />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
