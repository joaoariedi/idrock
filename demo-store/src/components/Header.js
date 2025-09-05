import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useIdRock } from '../contexts/IdRockContext';
import './Header.css';

function Header() {
  const { cart } = useCart();
  const { sessionId, isInitialized } = useIdRock();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const query = formData.get('search');
    if (query.trim()) {
      navigate(`/?search=${encodeURIComponent(query)}`);
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo and Brand */}
        <div className="header-brand">
          <Link to="/" className="brand-link">
            <div className="brand-logo">
              <span className="brand-icon">🛒</span>
              <span className="brand-name">NexShop</span>
            </div>
          </Link>
          <span className="brand-tagline">Powered by idRock</span>
        </div>

        {/* Search Bar */}
        <div className="header-search">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              name="search"
              placeholder="Search products..."
              className="search-input"
            />
            <button type="submit" className="search-button">
              <span className="search-icon">🔍</span>
            </button>
          </form>
        </div>

        {/* Navigation */}
        <nav className="header-nav">
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/risk-dashboard" className="nav-link">
              Security Dashboard
            </Link>
          </div>

          {/* Cart */}
          <Link to="/cart" className="cart-link">
            <div className="cart-icon-container">
              <span className="cart-icon">🛍️</span>
              {cart.totalItems > 0 && (
                <span className="cart-badge">{cart.totalItems}</span>
              )}
            </div>
            <span className="cart-text">Cart</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
        <div className="mobile-search">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              name="search"
              placeholder="Search products..."
              className="search-input"
            />
            <button type="submit" className="search-button">Search</button>
          </form>
        </div>
        
        <div className="mobile-nav-links">
          <Link to="/" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          <Link to="/risk-dashboard" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
            Security Dashboard
          </Link>
          <Link to="/cart" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
            Cart ({cart.totalItems})
          </Link>
        </div>
      </div>

      {/* Security Status Bar */}
      <div className="security-status-bar">
        <div className="security-status-container">
          <div className="security-status">
            <span className="security-icon">🔒</span>
            <span className="security-text">
              idRock Fraud Protection: {isInitialized ? 'Active' : 'Initializing...'}
            </span>
            {sessionId && (
              <span className="session-info">Session: {sessionId.slice(-8)}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;