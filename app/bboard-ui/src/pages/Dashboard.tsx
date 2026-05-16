import React, { useState } from 'react';
import {
  Box, Container, Typography, Grid, Card, CardContent,
  Button, TextField, Alert, CircularProgress, Divider, Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VerifiedIcon from '@mui/icons-material/Verified';
import LockIcon from '@mui/icons-material/Lock';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useDonorProof } from '../contexts';
import ProofBadge from '../components/ProofBadge';
import SpendBar from '../components/SpendBar';

const StatCard: React.FC<{ label: string; value: string | number; sub?: string }> = ({ label, value, sub }) => (
  <Card>
    <CardContent sx={{ p: 3 }}>
      <Typography variant="caption" sx={{ color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</Typography>
      <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>{value}</Typography>
      {sub && <Typography variant="caption" sx={{ color: '#6B7280' }}>{sub}</Typography>}
    </CardContent>
  </Card>
);

const RegisterForm: React.FC = () => {
  const { deployNewCharity, walletStatus, connectWallet, txPending } = useDonorProof();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [minDirectAid, setMinDirectAid] = useState('85');
  const [maxAdmin, setMaxAdmin] = useState('10');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleDeploy = async () => {
    setErr(null);
    try {
      await deployNewCharity({ name, category, description }, Number(minDirectAid), Number(maxAdmin));
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Deployment failed');
    }
  };

  if (walletStatus !== 'connected') {
    return (
      <Card sx={{ maxWidth: 480, mx: 'auto', mt: 4 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 1 }}>Charity dashboard</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
            Connect your Midnight wallet. If your wallet address matches a registered campaign, the dashboard will unlock automatically.
          </Typography>
          <Button variant="contained" sx={{ bgcolor: '#1B4332' }} onClick={connectWallet}>
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (done) return null;

  return (
    <Card sx={{ maxWidth: 520, mx: 'auto', mt: 4 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 0.5 }}>Register your charity</Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
          Deploys a new DonorProof contract. Costs DUST for the transaction.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Charity name" fullWidth size="small" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Category" fullWidth size="small" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Humanitarian, Medical" />
          <TextField label="Description" fullWidth size="small" multiline rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Min direct aid %" type="number" size="small" value={minDirectAid} onChange={(e) => setMinDirectAid(e.target.value)} sx={{ flex: 1 }} />
            <TextField label="Max admin %" type="number" size="small" value={maxAdmin} onChange={(e) => setMaxAdmin(e.target.value)} sx={{ flex: 1 }} />
          </Box>
          {err && <Alert severity="error">{err}</Alert>}
          <Button
            variant="contained"
            sx={{ bgcolor: '#1B4332' }}
            onClick={handleDeploy}
            disabled={!name || !category || txPending}
            startIcon={txPending ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <AddIcon />}
          >
            {txPending ? 'Deploying…' : 'Deploy & register'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentCharity, isCharityOwner, walletStatus, walletAddress, releaseFunds, txPending, error } = useDonorProof();
  const state = currentCharity?.state;
  const [releaseError, setReleaseError] = React.useState<string | null>(null);
  const [released, setReleased] = React.useState(false);

  const handleRelease = async () => {
    setReleaseError(null);
    try {
      await releaseFunds();
      setReleased(true);
    } catch (e) {
      setReleaseError(e instanceof Error ? e.message : 'Release failed');
    }
  };

  if (!isCharityOwner || !currentCharity || !state) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>Dashboard</Typography>
        <RegisterForm />
      </Container>
    );
  }

  const shortAddress = walletAddress ? `${walletAddress.slice(0, 8)}…` : '';

  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h2" sx={{ mb: 0.25 }}>{currentCharity.info.name}</Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Wallet: {shortAddress} · Contract: {currentCharity.info.contractAddress.slice(0, 12)}…
            </Typography>
          </Box>
          <ProofBadge verified={state.isVerified} size="medium" />
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard label="Total spend" value={`${state.totalSpend.toLocaleString()}`} sub="units committed" />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard label="Direct aid" value={`${state.directAidPct}%`} sub={`threshold ≥ ${state.directAidThreshold}%`} />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard label="Admin" value={`${state.adminPct}%`} sub={`threshold ≤ ${state.adminThreshold}%`} />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatCard label="Expenses" value={state.expenseSequence} sub="committed on-chain" />
          </Grid>
        </Grid>

        {/* Spend bar */}
        {state.totalSpend > 0n && (
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Spend breakdown</Typography>
              <SpendBar directAidPct={state.directAidPct} adminPct={state.adminPct} height={12} />
            </CardContent>
          </Card>
        )}

        <Divider sx={{ mb: 4 }} />

        {/* Actions */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ cursor: 'pointer', '&:hover': { borderColor: '#1B4332' } }} onClick={() => navigate('/dashboard/expenses')}>
              <CardContent sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ p: 1.5, bgcolor: '#D1FAE5', borderRadius: 2 }}>
                  <ReceiptIcon sx={{ color: '#1B4332' }} />
                </Box>
                <Box>
                  <Typography variant="h6">Log expense</Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Commit a private expense on-chain. Amount and category stay private; only aggregate totals update.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ cursor: 'pointer', '&:hover': { borderColor: '#1B4332' } }} onClick={() => navigate('/dashboard/proof')}>
              <CardContent sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ p: 1.5, bgcolor: '#D1FAE5', borderRadius: 2 }}>
                  <VerifiedIcon sx={{ color: '#1B4332' }} />
                </Box>
                <Box>
                  <Typography variant="h6">Run compliance proof</Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Generate and submit a ZK proof that your spending meets the declared thresholds.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Card sx={{ cursor: 'pointer', '&:hover': { borderColor: '#6B7280' }, bgcolor: '#FAFAF8' }} onClick={() => navigate('/dashboard/ledger')}>
              <CardContent sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ p: 1.5, bgcolor: '#F3F4F6', borderRadius: 2 }}>
                  <LockIcon sx={{ color: '#6B7280' }} />
                </Box>
                <Box>
                  <Typography variant="h6">Private ledger</Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Full expense detail with amounts, categories, and on-chain commitment hashes. Visible only on this device — never published.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {state.isVerified && state.potHasCoin && (
            <Grid size={{ xs: 12 }}>
              <Card sx={{ bgcolor: '#F0FDF4', border: '1px solid #A7F3D0' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: '#D1FAE5', borderRadius: 2 }}>
                      <AccountBalanceWalletIcon sx={{ color: '#1B4332' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6">Release funds</Typography>
                        <Chip label="VERIFIED" size="small" sx={{ bgcolor: '#10B981', color: '#fff', fontWeight: 700, fontSize: '0.7rem' }} />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#065F46' }}>
                        Pot balance: {state.potValue.toLocaleString()} NIGHT units — compliance verified, funds available to withdraw.
                      </Typography>
                    </Box>
                  </Box>
                  {released && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>Funds released to your wallet.</Alert>}
                  {(releaseError || error) && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{releaseError ?? error}</Alert>}
                  <Button
                    variant="contained"
                    sx={{ bgcolor: '#1B4332' }}
                    onClick={handleRelease}
                    disabled={txPending || released}
                    startIcon={txPending ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
                  >
                    {txPending ? 'Releasing…' : released ? 'Released' : 'Release funds to wallet'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;
