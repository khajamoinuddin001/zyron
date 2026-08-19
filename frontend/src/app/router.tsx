import { createBrowserRouter, Navigate, Outlet, ScrollRestoration } from 'react-router-dom';
import { useAuthStore, Role } from '../store/auth.store';

import LandingPage from './LandingPage';
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import { AcceptInvite } from '../features/auth/pages/AcceptInvite';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import DashboardLayout from '../layouts/DashboardLayout';

import SuperAdminDashboard from '../platform-admin/dashboard/Dashboard';
import Subscriptions from '../platform-admin/subscriptions/Subscriptions';
import OrganizationsList from '../platform-admin/organizations/OrganizationsList';
import { SystemHealthDashboard } from '../platform-admin/health/SystemHealthDashboard';
import OrgDashboard from '../features/dashboard/pages/Dashboard';
import AppsPage from '../features/dashboard/pages/AppsPage';
import TopAbsentStudents from '../features/dashboard/pages/TopAbsentStudents';
import AppStore from '../features/settings/pages/AppStore';
import TeamRoles from '../features/settings/pages/TeamRoles';
import OrgSettings from '../features/settings/pages/OrgSettings';
import ProfileSettings from '../features/settings/pages/ProfileSettings';
import AttendanceDashboard from '../features/attendance/pages/AttendanceDashboard';
import MessagingApp from '../features/messaging/pages/MessagingApp';
import { CalendarApp } from '../features/calendar/pages/CalendarApp';
import ContactsApp from '../features/contacts/pages/ContactsApp';
import ContactDetails from '../features/contacts/pages/ContactDetails';

const ProtectedRoute = ({ allowedRoles, children }: { allowedRoles: Role[], children?: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role as Role)) {
    return <Navigate to="/" replace />;
  }

  // If the route has children, Outlet is used. If it wraps an element, render children.
  return children ? <>{children}</> : <Outlet />;
};

const RootLayout = () => {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
};

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <LandingPage />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/register',
        element: <Register />,
      },
      {
        path: '/invite/:token',
        element: <AcceptInvite />,
      },
      {
        path: '/admin',
        element: <ProtectedRoute allowedRoles={['SUPER_ADMIN']} />,
        children: [
          {
            path: '',
            element: <SuperAdminLayout />,
            children: [
              { path: '', element: <SuperAdminDashboard /> },
              { path: 'subscriptions', element: <Subscriptions /> },
              { path: 'organizations', element: <OrganizationsList /> },
              { path: 'health', element: <SystemHealthDashboard /> }
            ]
          }
        ],
      },
      {
        path: '/dashboard',
        element: <ProtectedRoute allowedRoles={['ORG_ADMIN', 'STAFF']} />,
        children: [
          {
            path: '',
            element: <DashboardLayout />,
            children: [
              { path: '', element: <OrgDashboard /> },
              { path: 'apps', element: <AppsPage /> },
              { path: 'top-absent', element: <TopAbsentStudents /> },
              { path: 'profile', element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_ADMIN', 'STAFF', 'CLIENT']}><ProfileSettings /></ProtectedRoute> },
              { path: 'app-store', element: <ProtectedRoute allowedRoles={['ORG_ADMIN']}><AppStore /></ProtectedRoute> },
              { path: 'team-roles', element: <ProtectedRoute allowedRoles={['ORG_ADMIN']}><TeamRoles /></ProtectedRoute> },
              { path: 'settings', element: <ProtectedRoute allowedRoles={['ORG_ADMIN']}><OrgSettings /></ProtectedRoute> },
              { path: 'attendance', element: <ProtectedRoute allowedRoles={['ORG_ADMIN', 'STAFF']}><AttendanceDashboard /></ProtectedRoute> },
              { path: 'messaging', element: <ProtectedRoute allowedRoles={['ORG_ADMIN', 'STAFF']}><MessagingApp /></ProtectedRoute> },
              { path: 'calendar', element: <ProtectedRoute allowedRoles={['ORG_ADMIN', 'STAFF', 'CLIENT']}><CalendarApp /></ProtectedRoute> },
              { path: 'contacts', element: <ProtectedRoute allowedRoles={['ORG_ADMIN', 'STAFF']}><ContactsApp /></ProtectedRoute> },
              { path: 'contacts/:id', element: <ProtectedRoute allowedRoles={['ORG_ADMIN', 'STAFF']}><ContactDetails /></ProtectedRoute> }
            ]
          }
        ],
      },
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  }
]);
