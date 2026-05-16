import { createTheme } from '@mui/material';

export const theme = createTheme({
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    allVariants: { color: '#111827' },
    h1: { fontWeight: 700, fontSize: '2.5rem', letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.015em' },
    h3: { fontWeight: 600, fontSize: '1.5rem', letterSpacing: '-0.01em' },
    h4: { fontWeight: 600, fontSize: '1.25rem' },
    h5: { fontWeight: 600, fontSize: '1.125rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5, color: '#6B7280' },
    caption: { fontSize: '0.75rem', fontWeight: 500, color: '#6B7280' },
  },
  palette: {
    primary: { main: '#1B4332', light: '#40916C', dark: '#0d2b1f', contrastText: '#ffffff' },
    secondary: { main: '#40916C', contrastText: '#ffffff' },
    background: { default: '#FAFAF8', paper: '#FFFFFF' },
    success: { main: '#10B981', light: '#D1FAE5' },
    warning: { main: '#F59E0B', light: '#FEF3C7' },
    error: { main: '#EF4444' },
    text: { primary: '#111827', secondary: '#6B7280' },
    divider: '#E5E7EB',
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          minHeight: 44,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          '&:hover': { backgroundColor: '#0d2b1f' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E5E7EB',
          boxShadow: 'none',
          borderRadius: 12,
          transition: 'box-shadow 0.15s ease',
          '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&.Mui-focused fieldset': { borderColor: '#1B4332' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#1B4332' },
        },
      },
    },
  },
});
