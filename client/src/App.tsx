import { Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import Home from './pages/Home';
import Layout from './components/layout/Layout';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="videome-theme">
      <Toaster />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
