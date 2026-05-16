import React from 'react';
import { Box } from '@mui/material';

export const MainLayout: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Box sx={{ minHeight: '100vh', bgcolor: '#FAFAF8' }}>{children}</Box>
);
