import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

type Props = { verified: boolean; size?: 'small' | 'medium' };

const ProofBadge: React.FC<Props> = ({ verified, size = 'small' }) =>
  verified ? (
    <Chip
      icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
      label="Verified"
      size={size}
      sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 700, border: 'none' }}
    />
  ) : (
    <Chip
      icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
      label="Proof pending"
      size={size}
      sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700, border: 'none' }}
    />
  );

export default ProofBadge;
