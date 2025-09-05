import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useIdRock } from '../contexts/IdRockContext';
import './ProductCard.css';

function ProductCard({ product }) {
  const { addToCart, getItemQuantity } = useCart();
  const { trackEvent } = useIdRock();
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    
    try {
      // Track add to cart event
      await trackEvent('add_to_cart', {
        productId: product.id,
        productName: product.name,
        price: product.price,
        category: product.category
      });
      
      addToCart(product);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleProductClick = async () => {
    try {
      await trackEvent('product_view', {
        productId: product.id,
        productName: product.name,
        category: product.category
      });
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getDiscountPercentage = () => {
    if (!product.originalPrice) return null;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star full">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    
    return stars;
  };

  const quantityInCart = getItemQuantity(product.id);
  const discountPercent = getDiscountPercentage();

  return (
    <div className="product-card">
      <Link 
        to={`/product/${product.id}`} 
        className="product-link"
        onClick={handleProductClick}
      >
        {/* Product Image */}
        <div className="product-image-container">
          {!imageError ? (
            <img
              src={product.image}
              alt={product.name}
              className="product-image"
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="product-image-placeholder">
              <span className="placeholder-icon">📦</span>
              <span className="placeholder-text">Image not available</span>
            </div>
          )}
          
          {/* Sale Badge */}
          {discountPercent && (
            <div className="sale-badge">
              -{discountPercent}%
            </div>
          )}
          
          {/* Stock Status */}
          <div className={`stock-indicator ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
            {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
          </div>
        </div>

        {/* Product Info */}
        <div className="product-info">
          {/* Brand */}
          <div className="product-brand">{product.brand}</div>
          
          {/* Name */}
          <h3 className="product-name" title={product.name}>
            {product.name}
          </h3>
          
          {/* Rating */}
          <div className="product-rating">
            <div className="stars">
              {renderStars(product.rating)}
            </div>
            <span className="rating-text">
              {product.rating} ({product.reviews} reviews)
            </span>
          </div>
          
          {/* Price */}
          <div className="product-pricing">
            <div className="current-price">
              {formatPrice(product.price)}
            </div>
            {product.originalPrice && (
              <div className="original-price">
                {formatPrice(product.originalPrice)}
              </div>
            )}
          </div>
          
          {/* Key Features */}
          {product.features && product.features.length > 0 && (
            <div className="product-features">
              {product.features.slice(0, 2).map((feature, index) => (
                <span key={index} className="feature-tag">
                  {feature}
                </span>
              ))}
              {product.features.length > 2 && (
                <span className="feature-more">
                  +{product.features.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="product-actions">
        <button
          className={`add-to-cart-btn ${quantityInCart > 0 ? 'in-cart' : ''}`}
          onClick={handleAddToCart}
          disabled={!product.inStock || isLoading}
        >
          {isLoading ? (
            <span className="loading-spinner">⏳</span>
          ) : quantityInCart > 0 ? (
            <>
              <span className="cart-icon">✓</span>
              In Cart ({quantityInCart})
            </>
          ) : (
            <>
              <span className="cart-icon">🛒</span>
              Add to Cart
            </>
          )}
        </button>
        
        <Link 
          to={`/product/${product.id}`}
          className="view-details-btn"
          onClick={handleProductClick}
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

export default ProductCard;