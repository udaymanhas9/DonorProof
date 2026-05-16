import React, { useState } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Button,
  TextField, Alert, CircularProgress, Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import { useDonorProof } from '../contexts';

type Category = { value: string; label: string; isDirectAid: boolean; isAdmin: boolean; color: string };

const CATEGORIES: Category[] = [
  { value: 'food', label: 'Food aid', isDirectAid: true, isAdmin: false, color: '#D1FAE5' },
  { value: 'medical', label: 'Medical', isDirectAid: true, isAdmin: false, color: '#D1FAE5' },
  { value: 'housing', label: 'Housing', isDirectAid: true, isAdmin: false, color: '#D1FAE5' },
  { value: 'logistics', label: 'Logistics', isDirectAid: false, isAdmin: false, color: '#DBEAFE' },
  { value: 'admin', label: 'Admin', isDirectAid: false, isAdmin: true, color: '#FEE2E2' },
];

type LoggedExpense = { id: string; label: string; timestamp: string; status: 'committed' };

const Expenses: React.FC = () => {
  const navigate = useNavigate();
  const { commitExpense, currentCharity, txPending, error, isCharityOwner } = useDonorProof();

  const [amount, setAmount] = useState('');
  const [selected, setSelected] = useState<Category | null>(null);
  const [history, setHistory] = useState<LoggedExpense[]>([]);
  const [success, setSuccess] = useState(false);

  if (!isCharityOwner) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Access restricted</Typography>
        <Button onClick={() => navigate('/dashboard')} sx={{ color: '#1B4332' }}>Go to dashboard</Button>
      </Container>
    );
  }

  const handleSubmit = async () => {
    if (!amount || !selected) return;
    setSuccess(false);
    try {
      await commitExpense(BigInt(Math.round(Number(amount))), selected.isDirectAid, selected.isAdmin, selected.label);
      setHistory((prev) => [
        {
          id: `E-${String(prev.length + 1).padStart(3, '0')}`,
          label: `${selected.label}`,
          timestamp: new Date().toLocaleTimeString(),
          status: 'committed',
        },
        ...prev,
      ]);
      setAmount('');
      setSelected(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      // error shown via context
    }
  };

  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="lg">
        <Button onClick={() => navigate('/dashboard')} sx={{ color: '#6B7280', mb: 3, pl: 0 }}>← Dashboard</Button>
        <Typography variant="h2" sx={{ mb: 1 }}>Log private expense</Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mb: 4 }}>
          Amount and category are private witness inputs — only aggregate totals update on-chain.
        </Typography>

        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {/* Form */}
          <Card sx={{ flex: '1 1 360px' }}>
            <CardContent sx={{ p: 3 }}>
              <TextField
                label="Amount"
                type="number"
                fullWidth
                size="small"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: '#9CA3AF' }}>£</Typography> }}
              />

              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1.5, display: 'block' }}>Category</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {CATEGORIES.map((cat) => (
                  <Box
                    key={cat.value}
                    onClick={() => setSelected(cat)}
                    sx={{
                      px: 2, py: 1, borderRadius: 2, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                      bgcolor: selected?.value === cat.value ? cat.color : '#F9FAFB',
                      border: `1.5px solid ${selected?.value === cat.value ? '#1B4332' : '#E5E7EB'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    {cat.label}
                    {cat.isDirectAid && (
                      <Typography component="span" variant="caption" sx={{ ml: 0.75, color: '#065F46' }}>(direct aid)</Typography>
                    )}
                    {cat.isAdmin && (
                      <Typography component="span" variant="caption" sx={{ ml: 0.75, color: '#991B1B' }}>(admin)</Typography>
                    )}
                  </Box>
                ))}
              </Box>

              {/* Privacy note */}
              <Box sx={{ bgcolor: '#F9FAFB', borderRadius: 2, p: 2, mb: 3, display: 'flex', gap: 1 }}>
                <LockIcon sx={{ color: '#1B4332', fontSize: 16, mt: 0.25 }} />
                <Typography variant="caption" sx={{ color: '#4B5563', lineHeight: 1.6 }}>
                  Private: amount, category, supplier, receipt, beneficiary<br />
                  Public: aggregate totals only · Cost: ~0.002 DUST
                </Typography>
              </Box>

              {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>Expense committed on-chain</Alert>}
              {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

              <Button
                variant="contained"
                fullWidth
                sx={{ bgcolor: '#1B4332' }}
                disabled={!amount || !selected || txPending}
                onClick={handleSubmit}
                startIcon={txPending ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : null}
              >
                {txPending ? 'Committing…' : 'Commit expense →'}
              </Button>
            </CardContent>
          </Card>

          {/* History */}
          <Box sx={{ flex: '1 1 280px' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>This session</Typography>
            {history.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#9CA3AF' }}>No expenses logged yet.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {history.map((e) => (
                  <Box
                    key={e.id}
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff', border: '1px solid #E5E7EB', borderRadius: 2 }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.id}</Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>{e.label} · {e.timestamp}</Typography>
                    </Box>
                    <Chip label="on-chain" size="small" sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 600 }} />
                  </Box>
                ))}
              </Box>
            )}
            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#9CA3AF' }}>
              Amounts hidden even in local history — keeps the privacy model consistent.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Expenses;
