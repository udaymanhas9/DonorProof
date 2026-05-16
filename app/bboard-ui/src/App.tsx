import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box, Chip } from '@mui/material';
import Header from './components/Layout/Header';
import LoginChooser from './components/LoginChooser';
import Landing from './pages/Landing';
import Charities from './pages/Charities';
import CampaignPage from './pages/CampaignPage';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import RunProof from './pages/RunProof';
import PrivateLedger from './pages/PrivateLedger';
import { useDonorProof } from './contexts';

const DemoBanner: React.FC = () => {
  const { isDemoMode, isCharityOwner, walletStatus } = useDonorProof();
  if (!isDemoMode || walletStatus !== 'connected') return null;
  return (
    <Box sx={{ bgcolor: '#FEF3C7', borderBottom: '1px solid #FCD34D', py: 0.75, px: 3, display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center' }}>
      <Chip label="DEMO MODE" size="small" sx={{ bgcolor: '#F59E0B', color: '#fff', fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
      <Box component="span" sx={{ fontSize: '0.82rem', color: '#78350F' }}>
        {isCharityOwner
          ? 'Logged in as charity owner · Hope for Tomorrow · No real transactions'
          : 'Browsing as donor · Read-only view · No real transactions'}
      </Box>
    </Box>
  );
};

const AppInner: React.FC = () => {
  const { walletStatus } = useDonorProof();
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAFAF8' }}>
      {walletStatus !== 'connected' && <LoginChooser />}
      <Header />
      <DemoBanner />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/charities" element={<Charities />} />
        <Route path="/charity/:address" element={<CampaignPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/expenses" element={<Expenses />} />
        <Route path="/dashboard/proof" element={<RunProof />} />
        <Route path="/dashboard/ledger" element={<PrivateLedger />} />
      </Routes>
    </Box>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppInner />
  </BrowserRouter>
);

export default App;
