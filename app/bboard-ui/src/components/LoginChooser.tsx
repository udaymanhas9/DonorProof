import React, { useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, CircularProgress, Alert,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerifiedIcon from '@mui/icons-material/Verified';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useDonorProof } from '../contexts';

const LoginChooser: React.FC = () => {
  const { connectAsDonor, connectAsCharity, connectWallet, walletStatus } = useDonorProof();
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const handleRealWallet = async () => {
    setWalletLoading(true);
    setWalletError(null);
    try {
      await connectWallet();
    } catch (e) {
      setWalletError(e instanceof Error ? e.message : 'Wallet connection failed');
    } finally {
      setWalletLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed', inset: 0,
        bgcolor: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 1300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 480, width: '100%', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <VerifiedIcon sx={{ color: '#1B4332', fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B4332' }}>DonorProof</Typography>
          </Box>

          <Typography variant="h4" sx={{ mb: 0.75 }}>Who are you?</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 3.5 }}>
            Choose how to explore the demo. No real funds or wallet required.
          </Typography>

          {/* Option 1 — Donor */}
          <Box
            onClick={connectAsDonor}
            sx={{
              border: '1.5px solid #E5E7EB', borderRadius: 2, p: 2.5, mb: 2,
              cursor: 'pointer', display: 'flex', gap: 2, alignItems: 'flex-start',
              transition: 'all 0.15s',
              '&:hover': { borderColor: '#40916C', bgcolor: '#F0FDF4' },
            }}
          >
            <Box sx={{ p: 1, bgcolor: '#DBEAFE', borderRadius: 1.5, mt: 0.25 }}>
              <VisibilityIcon sx={{ color: '#1D4ED8', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.25 }}>Browse as Donor</Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                View all charities, their ZK compliance proofs, and simulate a donation.
              </Typography>
            </Box>
          </Box>

          {/* Option 2 — Charity */}
          <Box
            onClick={connectAsCharity}
            sx={{
              border: '1.5px solid #E5E7EB', borderRadius: 2, p: 2.5, mb: 3,
              cursor: 'pointer', display: 'flex', gap: 2, alignItems: 'flex-start',
              transition: 'all 0.15s',
              '&:hover': { borderColor: '#1B4332', bgcolor: '#F0FDF4' },
            }}
          >
            <Box sx={{ p: 1, bgcolor: '#D1FAE5', borderRadius: 1.5, mt: 0.25 }}>
              <VerifiedIcon sx={{ color: '#1B4332', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.25 }}>
                Manage as Charity <Typography component="span" variant="caption" sx={{ ml: 1, px: 1, py: 0.25, bgcolor: '#FEF3C7', color: '#92400E', borderRadius: 1, fontWeight: 600 }}>demo</Typography>
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                Log private expenses and run a ZK compliance proof for Hope for Tomorrow.
              </Typography>
            </Box>
          </Box>

          {/* Divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#E5E7EB' }} />
            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>or use a real wallet</Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#E5E7EB' }} />
          </Box>

          {/* Option 3 — Lace */}
          {walletError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>{walletError}</Alert>}
          <Button
            variant="outlined"
            fullWidth
            onClick={handleRealWallet}
            disabled={walletLoading || walletStatus === 'connecting'}
            startIcon={walletLoading ? <CircularProgress size={16} /> : <AccountBalanceWalletIcon />}
            sx={{ borderColor: '#1B4332', color: '#1B4332', textTransform: 'none', borderRadius: 2, py: 1.25 }}
          >
            {walletLoading ? 'Connecting…' : 'Connect Lace Wallet'}
          </Button>
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1.5, color: '#9CA3AF' }}>
            Requires Lace browser extension · Network: undeployed
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginChooser;
