import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from '@/utils/store';
import { ThemeProvider } from '@/utils/theme';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Insights from '@/pages/Insights';
import ModelPerformance from '@/pages/ModelPerformance';
import HowAIWorks from '@/pages/HowAIWorks';

export default function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/model" element={<ModelPerformance />} />
              <Route path="/how" element={<HowAIWorks />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </StoreProvider>
    </ThemeProvider>
  );
}
