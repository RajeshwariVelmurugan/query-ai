import React from 'react';
import { Navigate, useLocation } from 'react-router';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const token = localStorage.getItem('access_token');
    const location = useLocation();

    if (!token) {
        // Redirect to login but save the current location to redirect back after login
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
