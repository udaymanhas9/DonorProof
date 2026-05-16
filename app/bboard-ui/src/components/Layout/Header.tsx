import React from 'react';
import { AppBar, Box, Button, Typography, Chip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useDonorProof } from '../../contexts';

const NAV = [
  { label: 'Charities', path: '/charities' },
  { label: 'Dashboard', path: '/dashboard' },
];

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { walletStatus, walletAddress, connectWallet } = useDonorProof();

  const shortAddr = walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : '';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'rgba(250, 250, 248, 0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #E5E7EB',
        color: '#111827',
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', px: 3, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <VerifiedIcon sx={{ color: '#1B4332', fontSize: 22 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332', letterSpacing: '-0.02em' }}>
            DonorProof
          </Typography>
        </Box>

        {/* Nav */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {NAV.map((n) => (
            <Button
              key={n.path}
              onClick={() => navigate(n.path)}
              sx={{
                color: location.pathname.startsWith(n.path) ? '#1B4332' : '#6B7280',
                fontWeight: location.pathname.startsWith(n.path) ? 600 : 400,
                textTransform: 'none',
                fontSize: '0.9rem',
              }}
            >
              {n.label}
            </Button>
          ))}
        </Box>

        {/* Wallet */}
        {walletStatus === 'connected' ? (
          <Chip
            label={shortAddr}
            size="small"
            sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 600, fontSize: '0.78rem' }}
          />
        ) : (
          <Button
            variant="contained"
            size="small"
            onClick={connectWallet}
            sx={{ bgcolor: '#1B4332', textTransform: 'none', borderRadius: 2, px: 2 }}
          >
            Connect wallet
          </Button>
        )}
      </Box>
    </AppBar>
  );
};

export default Header;
export { Header };
