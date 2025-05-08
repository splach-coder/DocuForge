import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import './App.css';

function App() {
  const [appReady, setAppReady] = useState(false);
  
  useEffect(() => {
    // Simulate a short loading time for a smoother entry animation
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Header />
      
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: appReady ? 1 : 0, y: appReady ? 0 : 20 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <HomePage />
      </motion.main>
      
      <Footer />
    </motion.div>
  );
}

export default App;