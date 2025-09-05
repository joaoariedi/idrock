import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section brand-section">
            <div className="footer-brand">
              <div className="brand-logo">
                <span className="brand-icon">🛒</span>
                <span className="brand-name">NexShop</span>
              </div>
              <p className="brand-description">
                Your trusted e-commerce platform powered by advanced fraud detection technology.
              </p>
              <div className="powered-by">
                <span className="powered-text">Powered by</span>
                <span className="idrock-brand">idRock</span>
                <span className="security-icon">🛡️</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="section-title">Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/cart">Shopping Cart</Link></li>
              <li><Link to="/risk-dashboard">Security Dashboard</Link></li>
              <li><a href="#help">Help & Support</a></li>
            </ul>
          </div>

          {/* Security & Trust */}
          <div className="footer-section">
            <h3 className="section-title">Security & Trust</h3>
            <ul className="footer-links">
              <li><a href="#fraud-protection">Fraud Protection</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#security">Security Center</a></li>
            </ul>
          </div>

          {/* Academic Project */}
          <div className="footer-section">
            <h3 className="section-title">Academic Project</h3>
            <div className="academic-info">
              <p className="project-description">
                This is an educational demonstration of fraud detection systems
                developed as part of a cybersecurity academic project.
              </p>
              <div className="team-info">
                <p><strong>Development Team:</strong></p>
                <ul className="team-list">
                  <li>João Carlos Ariedi Filho</li>
                  <li>Raphael Hideyuki Uematsu</li>
                  <li>Tiago Elusardo Marques</li>
                  <li>Lucas Mazzaferro Dias</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Security Badges */}
        <div className="security-section">
          <div className="security-badges">
            <div className="security-badge">
              <span className="badge-icon">🔒</span>
              <div className="badge-info">
                <div className="badge-title">SSL Encrypted</div>
                <div className="badge-subtitle">256-bit Encryption</div>
              </div>
            </div>
            
            <div className="security-badge">
              <span className="badge-icon">🛡️</span>
              <div className="badge-info">
                <div className="badge-title">idRock Protected</div>
                <div className="badge-subtitle">Real-time Fraud Detection</div>
              </div>
            </div>
            
            <div className="security-badge">
              <span className="badge-icon">✅</span>
              <div className="badge-info">
                <div className="badge-title">Secure Payments</div>
                <div className="badge-subtitle">PCI DSS Compliant</div>
              </div>
            </div>
            
            <div className="security-badge">
              <span className="badge-icon">🔍</span>
              <div className="badge-info">
                <div className="badge-title">Transaction Monitoring</div>
                <div className="badge-subtitle">24/7 Protection</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="bottom-content">
            <div className="copyright">
              <p>&copy; {currentYear} NexShop Demo Store. All rights reserved.</p>
              <p className="academic-notice">
                This is an academic demonstration project for educational purposes only.
              </p>
            </div>
            
            <div className="tech-stack">
              <span className="tech-label">Built with:</span>
              <div className="tech-icons">
                <span className="tech-item" title="React">⚛️</span>
                <span className="tech-item" title="Node.js">🟢</span>
                <span className="tech-item" title="Docker">🐳</span>
                <span className="tech-item" title="JavaScript">🟨</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;