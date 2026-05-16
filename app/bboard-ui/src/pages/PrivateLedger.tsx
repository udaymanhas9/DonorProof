import React from 'react';
import {
  Box, Container, Typography, Card, CardContent, Button,
  Chip, Divider, Alert, Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useDonorProof } from '../contexts';

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  'Food aid':   { bg: '#D1FAE5', color: '#065F46' },
  'Medical':    { bg: '#DBEAFE', color: '#1D4ED8' },
  'Housing':    { bg: '#E0E7FF', color: '#3730A3' },
  'Logistics':  { bg: '#FEF3C7', color: '#92400E' },
  'Admin':      { bg: '#FEE2E2', color: '#991B1B' },
};

const HashCell: React.FC<{ hash: string }> = ({ hash }) => {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#6B7280', fontSize: '0.72rem' }}>
        {hash.slice(0, 18)}…
      </Typography>
      <Tooltip title={copied ? 'Copied!' : 'Copy full hash'}>
        <ContentCopyIcon
          onClick={copy}
          sx={{ fontSize: 13, color: '#9CA3AF', cursor: 'pointer', '&:hover': { color: '#1B4332' } }}
        />
      </Tooltip>
    </Box>
  );
};

const PrivateLedger: React.FC = () => {
  const navigate = useNavigate();
  const { expenseLog, proofRecord, currentCharity, isCharityOwner } = useDonorProof();

  if (!isCharityOwner || !currentCharity) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Access restricted</Typography>
        <Button onClick={() => navigate('/dashboard')} sx={{ color: '#1B4332' }}>Go to dashboard</Button>
      </Container>
    );
  }

  const state = currentCharity.state;
  const totalSpendNum = state ? Number(state.totalSpend) : 0;

  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="lg">
        <Button onClick={() => navigate('/dashboard')} sx={{ color: '#6B7280', mb: 3, pl: 0 }}>← Dashboard</Button>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Private ledger</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            Full expense detail visible only on this device. Commitment hashes are the only data that reaches the blockchain.
          </Typography>
        </Box>

        {/* Privacy model explainer */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <Card sx={{ flex: '1 1 240px', bgcolor: '#F0FDF4', border: '1px solid #A7F3D0' }}>
            <CardContent sx={{ p: 2.5, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <LockIcon sx={{ color: '#1B4332', mt: 0.25, fontSize: 18 }} />
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#065F46', display: 'block', mb: 0.5 }}>Private (this device only)</Typography>
                <Typography variant="caption" sx={{ color: '#065F46', lineHeight: 1.6 }}>
                  Amount · Category · Supplier · Beneficiary · Receipt reference
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card sx={{ flex: '1 1 240px', bgcolor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <CardContent sx={{ p: 2.5, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <PublicIcon sx={{ color: '#6B7280', mt: 0.25, fontSize: 18 }} />
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', display: 'block', mb: 0.5 }}>Public (on-chain)</Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', lineHeight: 1.6 }}>
                  Commitment hash · Aggregate totals · ZK compliance proof
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Proof record */}
        {proofRecord && (
          <Card sx={{ mb: 4, bgcolor: '#D1FAE5', border: '1px solid #6EE7B7' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 20 }} />
                <Typography variant="h6">ZK proof recorded on-chain</Typography>
                <Chip label="VERIFIED" size="small" sx={{ bgcolor: '#10B981', color: '#fff', fontWeight: 700, fontSize: '0.7rem' }} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 600 }}>Proved at</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{proofRecord.timestamp}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 600 }}>Direct aid proven</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{proofRecord.directAidPct}%</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 600 }}>Admin proven</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{proofRecord.adminPct}%</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 600 }}>Expenses covered</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{proofRecord.expenseSequence}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 600 }}>Tx hash:</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#065F46', fontSize: '0.72rem' }}>
                  {proofRecord.txHash.slice(0, 24)}…
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Expense log */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Expense commitments</Typography>
              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                {expenseLog.length} recorded this session
              </Typography>
            </Box>

            {expenseLog.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No expenses logged this session. Go to <strong>Log expense</strong> to commit one.
              </Alert>
            ) : (
              <>
                {/* Column headers */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '80px 100px 1fr 80px 180px', gap: 1, px: 1.5, py: 1, bgcolor: '#F9FAFB', borderRadius: 1, mb: 1 }}>
                  {['ID', 'Amount', 'Category', 'Type', 'Commitment hash (on-chain)'].map(h => (
                    <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.68rem' }}>{h}</Typography>
                  ))}
                </Box>

                {expenseLog.map((e, i) => {
                  const colors = CATEGORY_COLORS[e.category] ?? { bg: '#F3F4F6', color: '#374151' };
                  const type = e.isDirectAid ? 'Direct aid' : e.isAdmin ? 'Admin' : 'Logistics';
                  const typeColor = e.isDirectAid ? '#065F46' : e.isAdmin ? '#991B1B' : '#92400E';
                  const pct = totalSpendNum > 0 ? ((Number(e.amount) / totalSpendNum) * 100).toFixed(1) : '—';
                  return (
                    <Box key={e.id}>
                      {i > 0 && <Divider sx={{ my: 0.5 }} />}
                      <Box sx={{ display: 'grid', gridTemplateColumns: '80px 100px 1fr 80px 180px', gap: 1, px: 1.5, py: 1.25, alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{e.id}</Typography>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>£{Number(e.amount).toLocaleString()}</Typography>
                          <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{pct}% of total</Typography>
                        </Box>
                        <Chip label={e.category} size="small" sx={{ bgcolor: colors.bg, color: colors.color, fontWeight: 600, width: 'fit-content', fontSize: '0.75rem' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: typeColor }}>{type}</Typography>
                        <HashCell hash={e.commitmentHash} />
                      </Box>
                    </Box>
                  );
                })}

                {/* Totals row */}
                <Divider sx={{ mt: 1.5, mb: 1 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '80px 100px 1fr 80px 180px', gap: 1, px: 1.5, py: 1, bgcolor: '#F9FAFB', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151' }}>TOTAL</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    £{expenseLog.reduce((s, e) => s + Number(e.amount), 0).toLocaleString()}
                  </Typography>
                  <Box />
                  <Box />
                  <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.7rem' }}>
                    {expenseLog.length} commitment{expenseLog.length !== 1 ? 's' : ''} on-chain
                  </Typography>
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <Card sx={{ mt: 3, bgcolor: '#FAFAF8' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>How the ZK commitment chain works</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                ['1. You log an expense privately', 'Amount, category, and supplier never leave your browser. A commitment hash — cryptographic fingerprint — is computed locally.'],
                ['2. The commitment goes on-chain', 'Only the hash is submitted. Aggregate running totals (totalSpend, directAidSpend) update atomically. No individual amounts are visible.'],
                ['3. You run verifyCompliance()', 'A ZK proof is generated that proves: "the sum of all committed expenses satisfies the declared thresholds" — without revealing which expense is which.'],
                ['4. Donors verify the proof', 'Anyone can check that the on-chain proof is valid using public verifier keys. They know the percentages are correct without knowing individual expenses.'],
              ].map(([title, desc]) => (
                <Box key={title} sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ width: 6, bgcolor: '#1B4332', borderRadius: 1, flexShrink: 0, mt: 0.5 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>{title}</Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', lineHeight: 1.6 }}>{desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default PrivateLedger;
