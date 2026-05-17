import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Button, Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ProofBadge from './ProofBadge';
import SpendBar from './SpendBar';
import { useDonorProof } from '../contexts';
import { type DonorProofState } from '../../../api/src/index.js';
import { type CharityInfo } from '../../../api/src/common-types.js';

type Props = { charity: CharityInfo };

const CharityCard: React.FC<Props> = ({ charity }) => {
  const navigate = useNavigate();
  const { joinCharity } = useDonorProof();
  const [state, setState] = useState<DonorProofState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    joinCharity(charity.contractAddress)
      .then((api) => {
        const sub = api.state$.subscribe((s) => {
          if (!cancelled) setState(s);
          setLoading(false);
        });
        return () => sub.unsubscribe();
      })
      .catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [charity.contractAddress, joinCharity]);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 0.25 }}>{charity.name}</Typography>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>{charity.category}</Typography>
          </Box>
          {loading ? <Skeleton width={80} height={24} /> : state && <ProofBadge verified={state.isVerified} />}
        </Box>

        {charity.description && (
          <Typography variant="body2" sx={{ mb: 2, color: '#4B5563' }}>{charity.description}</Typography>
        )}

        {loading ? (
          <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 99, mb: 1 }} />
        ) : state && state.totalSpend > 0n ? (
          <Box sx={{ mb: 2 }}>
            <SpendBar directAidPct={state.directAidPct} adminPct={state.adminPct} />
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#6B7280' }}>
              {state.expenseSequence} expense{state.expenseSequence !== 1 ? 's' : ''} committed
            </Typography>
          </Box>
        ) : (
          <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', mb: 2 }}>
            No expenses recorded yet
          </Typography>
        )}
      </CardContent>

      <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          fullWidth
          sx={{ borderColor: '#1B4332', color: '#1B4332' }}
          onClick={() => navigate(`/charity/${charity.contractAddress}`)}
        >
          View campaign
        </Button>
        <Button
          variant="contained"
          size="small"
          fullWidth
          sx={{ bgcolor: '#1B4332' }}
          onClick={() => navigate(`/charity/${charity.contractAddress}`)}
        >
          Donate
        </Button>
      </Box>
    </Card>
  );
};

export default CharityCard;
