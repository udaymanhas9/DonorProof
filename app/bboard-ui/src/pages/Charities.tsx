import React, { useState } from 'react';
import { Box, Container, Typography, TextField, Grid, InputAdornment, Alert } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useDonorProof } from '../contexts';
import CharityCard from '../components/CharityCard';

const CATEGORIES = ['All', 'Humanitarian', 'Medical', 'Housing', 'Education', 'Food Aid'];

const Charities: React.FC = () => {
  const { charities } = useDonorProof();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = charities.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || c.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h2" sx={{ mb: 1 }}>All charities</Typography>
        <Typography variant="body1" sx={{ color: '#6B7280', mb: 4 }}>
          Each campaign has an on-chain compliance proof. Verified campaigns have met their declared thresholds.
        </Typography>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search charities…"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 280 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#9CA3AF' }} /></InputAdornment> }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <Box
                key={cat}
                onClick={() => setCategory(cat)}
                sx={{
                  px: 2, py: 0.75, borderRadius: 99, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                  bgcolor: category === cat ? '#1B4332' : '#F3F4F6',
                  color: category === cat ? '#fff' : '#374151',
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: category === cat ? '#1B4332' : '#E5E7EB' },
                }}
              >
                {cat}
              </Box>
            ))}
          </Box>
        </Box>

        {charities.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No charities registered yet. Charities can register by connecting their wallet and deploying a campaign from the dashboard.
          </Alert>
        ) : filtered.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>No charities match your search.</Alert>
        ) : (
          <Grid container spacing={3}>
            {filtered.map((c) => (
              <Grid key={c.contractAddress} size={{ xs: 12, sm: 6, md: 4 }}>
                <CharityCard charity={c} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Charities;
