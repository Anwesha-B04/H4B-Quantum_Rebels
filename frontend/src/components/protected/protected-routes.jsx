import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("tokenCV");
  const role = localStorage.getItem("cvisionary:role");

  if (!token) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;

  return children;
};

export default ProtectedRoute;
