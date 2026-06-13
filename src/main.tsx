import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './styles/uiTokens.css';
import './components/common/commonUi.css';
import './components/Header.css';
import './components/ui/ButtonSystem.css';
import './components/pages/AdminCms.css';
import './styles/productionPolish.css';
import './styles/formCardPolish.css';
import './styles/seatsOptionsPolish.css';
import './styles/adminTablePolish.css';
import './styles/targetedProductionPass.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(<App />);
}
