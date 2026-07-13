import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { AppRoutes } from './routes';
import { resumeSession } from './hooks/useAuth';
import { APP_CONFIG } from './config/app-config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function App() {
  useEffect(() => {
    void resumeSession();
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: APP_CONFIG.primaryColor,
          borderRadius: 8,
          fontFamily: "'DM Sans', -apple-system, sans-serif",
          colorBgLayout: '#f8fafc',
          colorBorderSecondary: '#e5e7eb',
          colorTextBase: '#1e293b',
          controlHeight: 38,
          colorLinkActive: '#4f46e5',
        },
        components: {
          Layout: {
            siderBg: '#ffffff',
            headerBg: '#ffffff',
            bodyBg: '#f8fafc',
          },
          Menu: {
            itemBg: 'transparent',
            itemColor: '#475569',
            itemHoverBg: '#f1f5f9',
            itemHoverColor: '#1e293b',
            itemSelectedBg: '#eef2ff',
            itemSelectedColor: '#4f46e5',
            subMenuItemBg: 'transparent',
            itemHeight: 42,
          },
          Card: {
            boxShadowTertiary: 'none',
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#64748b',
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  );
}

export default App;
