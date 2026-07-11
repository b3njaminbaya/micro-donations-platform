import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/public/Home";
import NotFound from "./pages/public/NotFound";
import Causes from "./pages/public/Causes";
import CauseDetail from "./pages/public/CauseDetail";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";
import Dashboard from "./pages/dashboard/Dashboard";
import CreateCause from "./pages/dashboard/CreateCause";
import EditCause from "./pages/dashboard/EditCause";
import MyCauses from "./pages/dashboard/MyCauses";
import MyDonations from "./pages/dashboard/MyDonations";
import Profile from "./pages/dashboard/Profile";
import Rewards from "./pages/dashboard/Rewards";
import AdminCauses from "./pages/admin/AdminCauses";
import AdminUsers from "./pages/admin/AdminUsers";
import AuthProvider from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import UserLayout from "./components/UserLayout";

function App() {
  const location = useLocation();

  const userLayoutPaths = [
    "/dashboard",
    "/create-cause",
    "/edit-cause",
    "/my-causes",
    "/my-donations",
    "/profile",
    "/rewards",
    "/admin",
  ];

  const isUserLayoutRoute = userLayoutPaths.some(path =>
    location.pathname.startsWith(path)
  );

  return (
    <AuthProvider>
      {!isUserLayoutRoute && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/causes" element={<Causes />} />
        <Route path="/causes/:id" element={<CauseDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes with Layout */}
        <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-cause" element={<CreateCause />} />
          <Route path="/edit-cause/:id" element={<EditCause />} />
          <Route path="/my-causes" element={<MyCauses />} />
          <Route path="/my-donations" element={<MyDonations />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/rewards" element={<Rewards />} />
        </Route>

        <Route element={<ProtectedRoute adminOnly><UserLayout /></ProtectedRoute>}>
          <Route path="/admin/causes" element={<AdminCauses />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isUserLayoutRoute && <Footer />}
      <ToastContainer position="top-right" autoClose={4000} />
    </AuthProvider>
  );
};

export default App;

