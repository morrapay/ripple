import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const SelectDomain = lazy(() => import("./pages/SelectDomain"));
const DomainLayout = lazy(() => import("./layouts/DomainLayout"));
const Dashboard = lazy(() => import("./pages/domain/Dashboard"));
const DataLayer = lazy(() => import("./pages/domain/DataLayer"));
const Mapping = lazy(() => import("./pages/domain/Mapping"));
const JourneyDetail = lazy(() => import("./pages/domain/JourneyDetail"));
const Communications = lazy(() => import("./pages/domain/Communications"));
const Channels = lazy(() => import("./pages/domain/Channels"));
const Preferences = lazy(() => import("./pages/domain/Preferences"));
const Governance = lazy(() => import("./pages/domain/Governance"));
const Users = lazy(() => import("./pages/domain/Users"));
const Archive = lazy(() => import("./pages/domain/Archive"));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/select-domain" element={<SelectDomain />} />
        <Route path="/domain/:id" element={<DomainLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="data-layer" element={<DataLayer />} />
          <Route path="mapping" element={<Mapping />} />
          <Route path="mapping/:journeyId" element={<JourneyDetail />} />
          <Route path="communications" element={<Communications />} />
          <Route path="channels" element={<Channels />} />
          <Route path="preferences" element={<Preferences />} />
          <Route path="governance" element={<Governance />} />
          <Route path="users" element={<Users />} />
          <Route path="archive" element={<Archive />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
