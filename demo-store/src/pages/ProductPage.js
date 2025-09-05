import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useIdRock } from '../contexts/IdRockContext';
import { getProductById, products } from '../data/products';
import { toast } from 'react-toastify';
import './ProductPage.css';

function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, getItemQuantity } = useCart();
  const { trackEvent } = useIdRock();
  
  const [product, setProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Load product data
  useEffect(() => {
    const productData = getProductById(id);
    if (productData) {
      setProduct(productData);
    } else {
      toast.error('Product not found');
      navigate('/');
    }
  }, [id, navigate]);

  // Track page view
  useEffect(() => {
    if (product) {
      const trackPageView = async () => {
        try {
          await trackEvent('product_view', {
            productId: product.id,
            productName: product.name,
            price: product.price,
            category: product.category,
            brand: product.brand
          });
        } catch (error) {
          console.error('Error tracking product view:', error);
        }
      };
      
      trackPageView();
    }
  }, [product, trackEvent]);

  const handleAddToCart = async () => {
    if (!product) return;

    setIsLoading(true);
    
    try {
      await trackEvent('add_to_cart', {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: selectedQuantity,
        category: product.category
      });
      
      addToCart(product, selectedQuantity);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getDiscountPercentage = () => {
    if (!product?.originalPrice) return null;
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

  const getRelatedProducts = () => {
    if (!product) return [];
    return products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  };

  if (!product) {
    return (
      <div className="product-page">
        <div className="product-container">
          <div className="loading-product">
            <div className="spinner"></div>
            <p>Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  const quantityInCart = getItemQuantity(product.id);
  const discountPercent = getDiscountPercentage();
  const relatedProducts = getRelatedProducts();

  return (
    <div className="product-page">
      <div className="product-container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        {/* Product Details */}
        <div className="product-details">
          {/* Product Image */}
          <div className="product-image-section">
            {!imageError ? (
              <img
                src={product.image}
                alt={product.name}
                className="product-image-large"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="product-image-placeholder-large">
                <span className="placeholder-icon">📦</span>
                <span className="placeholder-text">Image not available</span>
              </div>
            )}
            
            {/* Sale Badge */}
            {discountPercent && (
              <div className="sale-badge-large">
                -{discountPercent}% OFF
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info-section">
            {/* Brand */}
            <div className="product-brand-large">{product.brand}</div>
            
            {/* Name */}
            <h1 className="product-name-large">{product.name}</h1>
            
            {/* Rating */}
            <div className="product-rating-large">
              <div className="stars-large">
                {renderStars(product.rating)}
              </div>
              <span className="rating-text-large">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="product-pricing-large">
              <div className="current-price-large">
                {formatPrice(product.price)}
              </div>
              {product.originalPrice && (
                <div className="original-price-large">
                  {formatPrice(product.originalPrice)}
                </div>
              )}
              {discountPercent && (
                <div className="savings-amount">
                  You save {formatPrice(product.originalPrice - product.price)}
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div className="stock-status">
              <span className={`stock-indicator-large ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                {product.inStock ? (
                  <>
                    <span className="stock-icon">✓</span>
                    In Stock ({product.stockCount} available)
                  </>
                ) : (
                  <>
                    <span className="stock-icon">✗</span>
                    Out of Stock
                  </>
                )}
              </span>
            </div>

            {/* Description */}
            <div className="product-description">
              <p>{product.description}</p>
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="product-features-large">
                <h3>Key Features</h3>
                <ul className="features-list">
                  {product.features.map((feature, index) => (
                    <li key={index} className="feature-item">
                      <span className="feature-check">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="quantity-section">
              <label htmlFor="quantity">Quantity:</label>
              <div className="quantity-controls-large">
                <button
                  className="quantity-btn-large decrease"
                  onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                  disabled={selectedQuantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  id="quantity"
                  value={selectedQuantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setSelectedQuantity(Math.min(Math.max(1, value), product.stockCount));
                  }}
                  className="quantity-input-large"
                  min="1"
                  max={product.stockCount}
                />
                <button
                  className="quantity-btn-large increase"
                  onClick={() => setSelectedQuantity(Math.min(product.stockCount, selectedQuantity + 1))}
                  disabled={selectedQuantity >= product.stockCount}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="product-actions-large">
              <button
                className={`add-to-cart-btn-large ${quantityInCart > 0 ? 'in-cart' : ''}`}
                onClick={handleAddToCart}
                disabled={!product.inStock || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner">⏳</span>
                    Adding to Cart...
                  </>
                ) : quantityInCart > 0 ? (
                  <>
                    <span className="cart-icon">✓</span>
                    Added to Cart ({quantityInCart})
                  </>
                ) : (
                  <>
                    <span className="cart-icon">🛒</span>
                    Add to Cart
                  </>
                )}
              </button>
              
              <button
                className="buy-now-btn"
                onClick={handleBuyNow}
                disabled={!product.inStock || isLoading}
              >
                <span className="buy-icon">⚡</span>
                Buy Now
              </button>
            </div>

            {/* Security Notice */}
            <div className="security-notice">
              <span className="security-icon">🛡️</span>
              <div className="security-text">
                <strong>Secure Shopping Guaranteed</strong>
                <p>Protected by idRock fraud detection technology</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="related-products-section">
            <h2 className="related-title">Related Products</h2>
            <div className="related-products-grid">
              {relatedProducts.map(relatedProduct => (
                <Link
                  key={relatedProduct.id}
                  to={`/product/${relatedProduct.id}`}
                  className="related-product-card"
                  onClick={() => {
                    trackEvent('related_product_click', {
                      fromProduct: product.id,
                      toProduct: relatedProduct.id,
                      category: relatedProduct.category
                    }).catch(console.error);
                  }}
                >
                  <img
                    src={relatedProduct.image}
                    alt={relatedProduct.name}
                    className="related-product-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="related-product-placeholder" style={{display: 'none'}}>
                    📦
                  </div>
                  <div className="related-product-info">
                    <div className="related-product-name">{relatedProduct.name}</div>
                    <div className="related-product-price">
                      {formatPrice(relatedProduct.price)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductPage;