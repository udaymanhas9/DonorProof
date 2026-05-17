import React, { useState } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Button,
  Alert, CircularProgress, Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useDonorProof } from '../contexts';

const ThresholdRow: React.FC<{
  label: string;
  value: number;
  threshold: number;
  operator: '>=' | '<=';
}> = ({ label, value, threshold, operator }) => {
  const passes = operator === '>=' ? value >= threshold : value <= threshold;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid #F3F4F6' }}>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
        <Typography variant="caption" sx={{ color: '#6B7280' }}>
          Required: {operator} {threshold}%
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 700 }}>{value}%</Typography>
        {passes
          ? <CheckCircleIcon sx={{ color: '#10B981', fontSize: 20 }} />
          : <ErrorIcon sx={{ color: '#EF4444', fontSize: 20 }} />}
      </Box>
    </Box>
  );
};

const RunProof: React.FC = () => {
  const navigate = useNavigate();
  const { verifyCompliance, currentCharity, txPending, error, isCharityOwner } = useDonorProof();
  const [done, setDone] = useState(false);

  const state = currentCharity?.state;

  if (!isCharityOwner || !state) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Access restricted</Typography>
        <Button onClick={() => navigate('/dashboard')} sx={{ color: '#1B4332' }}>Go to dashboard</Button>
      </Container>
    );
  }

  const directAidPasses = state.directAidPct >= state.directAidThreshold;
  const adminPasses = state.adminPct <= state.adminThreshold;
  const canProve = directAidPasses && adminPasses && state.totalSpend > 0n;

  const handleProve = async () => {
    setDone(false);
    try {
      await verifyCompliance();
      setDone(true);
    } catch {
      // error shown via context
    }
  };

  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="sm">
        <Button onClick={() => navigate('/dashboard')} sx={{ color: '#6B7280', mb: 3, pl: 0 }}>← Dashboard</Button>
        <Typography variant="h2" sx={{ mb: 1 }}>Run compliance proof</Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mb: 4 }}>
          Preview the result before spending DUST on proof generation.
        </Typography>

        {done && (
          <Card sx={{ bgcolor: '#D1FAE5', border: '1px solid #6EE7B7', mb: 3 }}>
            <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircleIcon sx={{ fontSize: 32, color: '#10B981', flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ mb: 0.5 }}>Campaign verified</Typography>
                <Typography variant="body2" sx={{ color: '#065F46' }}>
                  ZK proof on-chain. Donors can verify compliance on your campaign page.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                sx={{ borderColor: '#1B4332', color: '#1B4332', flexShrink: 0 }}
                onClick={() => navigate(`/charity/${currentCharity.info.contractAddress}`)}
              >
                View page
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Current snapshot</Typography>

            {state.totalSpend === 0n ? (
              <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }}>
                No expenses committed yet. Log expenses before running a proof.
              </Alert>
            ) : (
              <>
                <ThresholdRow label="Direct aid spend" value={state.directAidPct} threshold={state.directAidThreshold} operator=">=" />
                <ThresholdRow label="Admin spend" value={state.adminPct} threshold={state.adminThreshold} operator="<=" />
              </>
            )}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ bgcolor: '#F9FAFB', borderRadius: 2, p: 2, mb: 3 }}>
              <Typography variant="caption" sx={{ color: '#6B7280', lineHeight: 1.7, display: 'block' }}>
                Estimated cost: ~0.008 DUST · Proof generation takes 20–60 seconds · Result is permanent on-chain
              </Typography>
            </Box>

            {!canProve && state.totalSpend > 0n && (
              <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                Thresholds not met. Log more compliant expenses before generating the proof — a failing proof still costs DUST.
              </Alert>
            )}

            {error && <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>{error}</Alert>}

            <Button
              variant="contained"
              fullWidth
              size="large"
              sx={{ bgcolor: '#1B4332' }}
              disabled={!canProve || txPending}
              onClick={handleProve}
              startIcon={txPending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : null}
            >
              {txPending ? 'Generating proof…' : state.isVerified ? 'Re-generate proof →' : 'Generate & submit proof →'}
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default RunProof;
