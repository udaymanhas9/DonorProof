import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Card, CardContent,
  RadioGroup, FormControlLabel, Radio, TextField, Button,
  CircularProgress, Alert, Divider, Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useDonorProof } from '../contexts';
import { type DeployedDonorProofAPI, type DonorProofState } from '../../../api/src/index.js';
import ProofBadge from '../components/ProofBadge';
import SpendBar from '../components/SpendBar';

const StatRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F3F4F6' }}>
    <Typography variant="body2" sx={{ color: '#6B7280' }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
  </Box>
);

const CampaignPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { charities, joinCharity, walletStatus, connectWallet, donorDeposit, txPending, error } = useDonorProof();

  const charity = charities.find((c) => c.contractAddress === address);
  const [api, setApi] = useState<DeployedDonorProofAPI | null>(null);
  const [state, setState] = useState<DonorProofState | null>(null);
  const [loading, setLoading] = useState(true);
  const [explainerOpen, setExplainerOpen] = useState(false);

  // Donation form
  const [donationAmount, setDonationAmount] = useState('');
  const [restriction, setRestriction] = useState<'unrestricted' | 'food' | 'medical' | 'housing'>('unrestricted');
  const [donationLogged, setDonationLogged] = useState(false);
  const [donationError, setDonationError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    joinCharity(address)
      .then((a) => {
        setApi(a);
        const sub = a.state$.subscribe((s) => { setState(s); setLoading(false); });
        return () => sub.unsubscribe();
      })
      .catch(() => setLoading(false));
  }, [address, joinCharity]);

  const restrictionByte: Record<string, number> = { unrestricted: 0, food: 1, medical: 2, housing: 3 };

  const handleDonate = async () => {
    if (!donationAmount || !address) return;
    setDonationError(null);
    try {
      await donorDeposit(address, BigInt(Math.round(Number(donationAmount))), restrictionByte[restriction] ?? 0);
      setDonationLogged(true);
      setTimeout(() => setDonationLogged(false), 4000);
      setDonationAmount('');
    } catch (e) {
      setDonationError(e instanceof Error ? e.message : 'Donation failed');
    }
  };

  if (!charity) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Campaign not found</Typography>
        <Button onClick={() => navigate('/charities')} sx={{ color: '#1B4332' }}>← Back to charities</Button>
      </Container>
    );
  }

  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="lg">
        <Button onClick={() => navigate('/charities')} sx={{ color: '#6B7280', mb: 3, pl: 0 }}>← All charities</Button>

        <Grid container spacing={4}>
          {/* Left — proof status */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="h3">{charity.name}</Typography>
              {!loading && state && <ProofBadge verified={state.isVerified} size="medium" />}
            </Box>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 4 }}>{charity.category}</Typography>

            {charity.description && (
              <Typography variant="body1" sx={{ mb: 4, color: '#4B5563' }}>{charity.description}</Typography>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#1B4332' }} />
              </Box>
            ) : state ? (
              <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ mb: 3 }}>Spend breakdown</Typography>

                  {state.totalSpend > 0n ? (
                    <>
                      <SpendBar directAidPct={state.directAidPct} adminPct={state.adminPct} height={12} />
                      <Box sx={{ mt: 3 }}>
                        <StatRow label="Total spend committed" value={`${state.totalSpend.toLocaleString()} units`} />
                        <StatRow label="Direct aid" value={`${state.directAidPct}% (threshold ≥ ${state.directAidThreshold}%)`} />
                        <StatRow label="Admin" value={`${state.adminPct}% (threshold ≤ ${state.adminThreshold}%)`} />
                        <StatRow label="Expenses committed" value={state.expenseSequence} />
                        <StatRow label="Restricted funds" value={state.isVerified ? 'Compliant ✓' : 'Proof pending'} />
                        <StatRow label="Beneficiary data" value="Private — never exposed" />
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                      No expenses committed yet. The charity will log expenses privately before running a compliance proof.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Alert severity="warning">Could not load contract state.</Alert>
            )}

            {/* ZK proof record — shown when verified */}
            {!loading && state?.isVerified && (
              <Card sx={{ mb: 3, bgcolor: '#F0FDF4', border: '1px solid #A7F3D0' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#065F46' }}>On-chain ZK proof record</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 2, mb: 2.5 }}>
                    {[
                      { label: 'Direct aid proven', value: `${state.directAidPct}%` },
                      { label: 'Admin proven', value: `${state.adminPct}%` },
                      { label: 'Commitments verified', value: `${state.expenseSequence}` },
                      { label: 'Threshold (direct aid)', value: `≥ ${state.directAidThreshold}%` },
                    ].map(({ label, value }) => (
                      <Box key={label}>
                        <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 600, display: 'block' }}>{label}</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#1B4332' }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ bgcolor: '#D1FAE5', borderRadius: 1.5, p: 2 }}>
                    <Typography variant="caption" sx={{ color: '#065F46', lineHeight: 1.7 }}>
                      This proof was verified on the Midnight blockchain. It guarantees — with cryptographic certainty — that the {state.expenseSequence} private expense commitments sum to the percentages shown above, without revealing any individual expense. You can independently verify the proof using the contract address and Midnight's public verifier keys.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* ZK explainer */}
            <Card sx={{ cursor: 'pointer' }} onClick={() => setExplainerOpen((o) => !o)}>
              <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>What is a ZK proof?</Typography>
                <ExpandMoreIcon sx={{ transform: explainerOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', color: '#6B7280' }} />
              </CardContent>
              <Collapse in={explainerOpen}>
                <Divider />
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="body2" sx={{ color: '#4B5563', lineHeight: 1.7 }}>
                    A zero-knowledge proof lets the charity prove a statement is true — "87% of funds went to direct aid" — without revealing the underlying data that proves it. No beneficiary names, no supplier details, no payment references are ever published. The Midnight blockchain verifies the proof mathematically. You don't need to trust the charity's word.
                  </Typography>
                </CardContent>
              </Collapse>
            </Card>
          </Grid>

          {/* Right — donate panel */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ position: 'sticky', top: 80 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ mb: 0.5 }}>Donate</Typography>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
                  Lock shielded NIGHT tokens into the campaign pot with a spending restriction.
                </Typography>

                {state?.potHasCoin && (
                  <Box sx={{ bgcolor: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 1.5, px: 2, py: 1, mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 600 }}>
                      Pot balance: {state.potValue.toLocaleString()} units
                    </Typography>
                  </Box>
                )}

                {donationLogged && (
                  <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                    Donation locked on-chain with restriction: {restriction}
                  </Alert>
                )}

                {(donationError || error) && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {donationError ?? error}
                  </Alert>
                )}

                <TextField
                  label="Amount (NIGHT units)"
                  type="number"
                  fullWidth
                  size="small"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  sx={{ mb: 3 }}
                />

                <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Spending restriction</Typography>
                <RadioGroup value={restriction} onChange={(e) => setRestriction(e.target.value as typeof restriction)}>
                  {[
                    { value: 'unrestricted', label: 'Unrestricted' },
                    { value: 'food', label: 'Food aid only' },
                    { value: 'medical', label: 'Medical only' },
                    { value: 'housing', label: 'Housing only' },
                  ].map((opt) => (
                    <FormControlLabel
                      key={opt.value}
                      value={opt.value}
                      control={<Radio size="small" sx={{ color: '#1B4332', '&.Mui-checked': { color: '#1B4332' } }} />}
                      label={<Typography variant="body2">{opt.label}</Typography>}
                    />
                  ))}
                </RadioGroup>

                {walletStatus === 'connected' ? (
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ bgcolor: '#1B4332', mt: 3 }}
                    disabled={!donationAmount || txPending}
                    onClick={handleDonate}
                    startIcon={txPending ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
                  >
                    {txPending ? 'Processing…' : 'Donate'}
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ borderColor: '#1B4332', color: '#1B4332', mt: 3 }}
                    onClick={connectWallet}
                  >
                    Connect wallet to donate
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CampaignPage;
