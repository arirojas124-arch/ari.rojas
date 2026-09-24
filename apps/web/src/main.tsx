import { AppRegistry } from 'react-native';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './styles.css';

AppRegistry.registerComponent('ErpMultigestión', () => App);

createRoot(document.getElementById('root')!).render(<App />);
