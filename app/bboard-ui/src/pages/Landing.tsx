import React from 'react';
import { Box, Typography, Button, Container, Grid, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedIcon from '@mui/icons-material/Verified';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useDonorProof } from '../contexts';
import CharityCard from '../components/CharityCard';

const HowItWorksStep: React.FC<{ n: number; title: string; body: string }> = ({ n, title, body }) => (
  <Box sx={{ display: 'flex', gap: 2 }}>
    <Box sx={{
      width: 36, height: 36, borderRadius: '50%', bgcolor: '#1B4332', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontWeight: 700, fontSize: 14,
    }}>
      {n}
    </Box>
    <Box>
      <Typography variant="h6" sx={{ mb: 0.5 }}>{title}</Typography>
      <Typography variant="body2">{body}</Typography>
    </Box>
  </Box>
);

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { charities } = useDonorProof();
  const preview = charities.slice(0, 3);

  return (
    <Box>
      {/* Hero */}
      <Box sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', py: { xs: 8, md: 14 } }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h1" sx={{ mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}>
            Private compliance.<br />Publicly verifiable.
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: '#6B7280', maxWidth: 560, mx: 'auto', fontSize: '1.125rem' }}>
            Charities prove restricted funds were used correctly. Donors verify — without seeing beneficiary data, supplier names, or payment records.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" size="large" sx={{ bgcolor: '#1B4332' }} onClick={() => navigate('/charities')}>
              Browse charities
            </Button>
            <Button variant="outlined" size="large" sx={{ borderColor: '#1B4332', color: '#1B4332' }} onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
              How it works
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Trust strip */}
      <Box sx={{ py: 4, borderBottom: '1px solid #E5E7EB', bgcolor: '#FAFAF8' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 4, md: 8 }, flexWrap: 'wrap' }}>
            {[
              { icon: <LockIcon sx={{ color: '#1B4332' }} />, label: 'Beneficiary data never exposed' },
              { icon: <VerifiedIcon sx={{ color: '#1B4332' }} />, label: 'ZK proof, not a trust claim' },
              { icon: <VisibilityOffIcon sx={{ color: '#1B4332' }} />, label: 'Supplier names stay private' },
            ].map(({ icon, label }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {icon}
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Charity preview */}
      {preview.length > 0 && (
        <Box sx={{ py: 8, bgcolor: '#FAFAF8' }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h3">Active campaigns</Typography>
              <Button sx={{ color: '#1B4332', fontWeight: 600 }} onClick={() => navigate('/charities')}>
                View all →
              </Button>
            </Box>
            <Grid container spacing={3}>
              {preview.map((c) => (
                <Grid key={c.contractAddress} size={{ xs: 12, md: 4 }}>
                  <CharityCard charity={c} />
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      {/* How it works */}
      <Box id="how-it-works" sx={{ py: 8, bgcolor: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
        <Container maxWidth="sm">
          <Typography variant="h3" sx={{ mb: 6, textAlign: 'center' }}>How it works</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <HowItWorksStep n={1} title="Charity records expenses privately" body="Each time a payment is made, the charity commits a hash of the expense on-chain. The amount and category are private — only aggregate totals update publicly." />
            <Divider />
            <HowItWorksStep n={2} title="A ZK proof is generated" body="When ready, the charity runs a zero-knowledge proof. It verifies that private expenses meet the declared thresholds — without revealing individual transactions." />
            <Divider />
            <HowItWorksStep n={3} title="Donors verify the result" body="The proof result is public. Anyone can confirm compliance — no auditor required, no sensitive data exposed." />
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
