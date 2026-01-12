import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './layouts/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Categories from './pages/Categories'
import Products from './pages/Products'
import Sales from './pages/Sales'
import SalesList from './pages/SalesList'
import SaleDetails from './pages/SaleDetails'
import Invoice from './pages/Invoice'
import Inventory from './pages/Inventory'
import Returns from './pages/Returns'
import Suppliers from './pages/Suppliers'
import PurchaseInvoices from './pages/PurchaseInvoices'
import Expenses from './pages/Expenses'
import ProfitLoss from './pages/ProfitLoss'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'
import './styles/print.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
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
            <Route path="categories" element={<Categories />} />
            <Route path="products" element={<Products />} />
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
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
