import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';

type Segment = { label: string; value: number; color: string };

type Props = { directAidPct: number; adminPct: number; height?: number };

const SpendBar: React.FC<Props> = ({ directAidPct, adminPct, height = 8 }) => {
  const logisticsPct = Math.max(0, 100 - directAidPct - adminPct);

  const segments: Segment[] = [
    { label: `Direct aid ${directAidPct}%`, value: directAidPct, color: '#40916C' },
    { label: `Logistics ${logisticsPct}%`, value: logisticsPct, color: '#93C5FD' },
    { label: `Admin ${adminPct}%`, value: adminPct, color: '#FCA5A5' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', borderRadius: 99, overflow: 'hidden', height, bgcolor: '#F3F4F6' }}>
        {segments.filter((s) => s.value > 0).map((seg) => (
          <Tooltip key={seg.label} title={seg.label} arrow>
            <Box sx={{ width: `${seg.value}%`, bgcolor: seg.color, transition: 'width 0.3s ease' }} />
          </Tooltip>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 0.75 }}>
        {segments.map((seg) => (
          <Box key={seg.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: seg.color }} />
            <Typography variant="caption">{seg.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SpendBar;
