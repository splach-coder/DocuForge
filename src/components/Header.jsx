import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Header.module.css';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <img src="/document-icon.svg" alt="DocuForge Logo" className={styles.logoImage} />
          <span className={styles.logoText}>DocuForge</span>
        </div>
        
        <nav className={styles.nav}>
          <div className={styles.navLinks}>
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink
              }
              end
            >
              <i className="fas fa-file-excel"></i>
              Excel to PDF
            </NavLink>
            <NavLink 
              to="/pdf-merger" 
              className={({ isActive }) => 
                isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink
              }
            >
              <i className="fas fa-file-pdf"></i>
              PDF Merger
            </NavLink>
            <NavLink 
              to="/image-printer" 
              className={({ isActive }) => 
                isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink
              }
            >
              <i className="fas fa-images"></i>
              Image Printer
            </NavLink>
          </div>
          <a href="https://github.com/splach-coder" target="_blank" rel="noreferrer" className={styles.githubLink}>
            <i className="fab fa-github"></i>
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;