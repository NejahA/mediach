import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppVercel from './AppVercel.jsx'

function Root() {
  const [useVercel, setUseVercel] = useState(() => {
    return window.location.pathname === '/vercel' || window.location.search.includes('version=vercel');
  });

  useEffect(() => {
    const handlePopState = () => {
      setUseVercel(window.location.pathname === '/vercel' || window.location.search.includes('version=vercel'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSwitch = () => {
    const nextVal = !useVercel;
    setUseVercel(nextVal);
    if (nextVal) {
      window.history.pushState({}, '', '/vercel');
    } else {
      window.history.pushState({}, '', '/');
    }
  };

  return useVercel ? (
    <AppVercel onSwitch={handleSwitch} />
  ) : (
    <App onSwitch={handleSwitch} />
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
