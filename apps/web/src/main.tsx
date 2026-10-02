import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './navigation/AppRoutes.js';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@ari-erp/ui/tokens.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(<BrowserRouter><AppRoutes /></BrowserRouter>);
