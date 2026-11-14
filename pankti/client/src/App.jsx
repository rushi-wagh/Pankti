import { Navigate, Route, Routes } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './pages/Dashboard';
import QueuePage from './pages/QueuePage';

function Protected() {
  return localStorage.getItem('qf-token') ? <Dashboard /> : <Navigate to="/login" replace />;
}

function ProtectedQueue() {
  return localStorage.getItem('qf-token') ? <QueuePage /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/" element={<Protected />} />
      <Route path="/queues" element={<Protected />} />
      <Route path="/queues/:id" element={<ProtectedQueue />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
