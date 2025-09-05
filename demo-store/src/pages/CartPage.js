import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useIdRock } from '../contexts/IdRockContext';
import './CartPage.css';

function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { trackEvent } = useIdRock();
  const navigate = useNavigate();

  // Track cart page view
  useEffect(() => {
    const trackPageView = async () => {
      try {
        await trackEvent('page_view', {
          page: 'cart',
          itemCount: cart.totalItems,
          totalAmount: cart.totalAmount
        });
      } catch (error) {
        console.error('Error tracking cart page view:', error);
      }
    };
    
    trackPageView();
  }, [trackEvent, cart.totalItems, cart.totalAmount]);

  const handleQuantityChange = async (productId, newQuantity) => {
    const item = cart.items.find(item => item.id === productId);
    if (!item) return;

    if (newQuantity === 0) {
      handleRemoveItem(productId);
      return;
    }

    try {
      await trackEvent('cart_quantity_change', {
        productId,
        productName: item.name,
        oldQuantity: item.quantity,
        newQuantity,
        priceDifference: (newQuantity - item.quantity) * item.price
      });
      
      updateQuantity(productId, newQuantity);
    } catch (error) {
      console.error('Error tracking quantity change:', error);
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = async (productId) => {
    const item = cart.items.find(item => item.id === productId);
    if (!item) return;

    try {
      await trackEvent('cart_item_remove', {
        productId,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        totalLoss: item.quantity * item.price
      });
      
      removeFromCart(productId);
    } catch (error) {
      console.error('Error tracking item removal:', error);
      removeFromCart(productId);
    }
  };

  const handleClearCart = async () => {
    if (cart.items.length === 0) return;

    try {
      await trackEvent('cart_clear', {
        itemCount: cart.totalItems,
        totalAmount: cart.totalAmount,
        items: cart.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      });
      
      clearCart();
    } catch (error) {
      console.error('Error tracking cart clear:', error);
      clearCart();
    }
  };

  const handleCheckout = async () => {
    try {
      await trackEvent('checkout_initiate', {
        itemCount: cart.totalItems,
        totalAmount: cart.totalAmount,
        items: cart.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      });
      
      navigate('/checkout');
    } catch (error) {
      console.error('Error tracking checkout initiation:', error);
      navigate('/checkout');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getItemTotal = (item) => {
    return item.price * item.quantity;
  };

  if (cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your Cart is Empty</h2>
            <p>Looks like you haven't added any items to your cart yet.</p>
            <Link to="/" className="continue-shopping-btn">
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* Cart Header */}
        <div className="cart-header">
          <h1 className="cart-title">Shopping Cart</h1>
          <div className="cart-summary">
            <span className="item-count">{cart.totalItems} items</span>
            <button 
              className="clear-cart-btn"
              onClick={handleClearCart}
              title="Clear all items from cart"
            >
              Clear Cart
            </button>
          </div>
        </div>

        <div className="cart-content">
          {/* Cart Items */}
          <div className="cart-items">
            <div className="cart-items-header">
              <div className="header-product">Product</div>
              <div className="header-price">Price</div>
              <div className="header-quantity">Quantity</div>
              <div className="header-total">Total</div>
              <div className="header-actions">Actions</div>
            </div>
            
            <div className="cart-items-list">
              {cart.items.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-product">
                    <Link to={`/product/${item.id}`} className="product-link">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="item-image"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiNGNUY1RjUiLz48dGV4dCB4PSI0MCIgeT0iNDUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OTk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                        }}
                      />
                    </Link>
                    <div className="product-details">
                      <Link to={`/product/${item.id}`} className="product-name">
                        {item.name}
                      </Link>
                      <div className="product-meta">
                        <span className="product-brand">{item.brand}</span>
                        {item.originalPrice && (
                          <span className="product-discount">
                            Save {formatPrice(item.originalPrice - item.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="item-price">
                    <div className="current-price">{formatPrice(item.price)}</div>
                    {item.originalPrice && (
                      <div className="original-price">{formatPrice(item.originalPrice)}</div>
                    )}
                  </div>
                  
                  <div className="item-quantity">
                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn decrease"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value) || 0;
                          if (newQuantity >= 0 && newQuantity <= 99) {
                            handleQuantityChange(item.id, newQuantity);
                          }
                        }}
                        className="quantity-input"
                        min="0"
                        max="99"
                      />
                      <button 
                        className="quantity-btn increase"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= 99}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div className="item-total">
                    <div className="total-price">{formatPrice(getItemTotal(item))}</div>
                    {item.originalPrice && (
                      <div className="total-savings">
                        Save {formatPrice((item.originalPrice - item.price) * item.quantity)}
                      </div>
                    )}
                  </div>
                  
                  <div className="item-actions">
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveItem(item.id)}
                      title="Remove item from cart"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="cart-sidebar">
            <div className="order-summary">
              <h3 className="summary-title">Order Summary</h3>
              
              <div className="summary-items">
                <div className="summary-row">
                  <span>Subtotal ({cart.totalItems} items)</span>
                  <span>{formatPrice(cart.totalAmount)}</span>
                </div>
                
                <div className="summary-row">
                  <span>Shipping</span>
                  <span className="free-shipping">Free</span>
                </div>
                
                <div className="summary-row">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </div>
                
                <div className="summary-divider"></div>
                
                <div className="summary-row total">
                  <span>Total</span>
                  <span>{formatPrice(cart.totalAmount)}</span>
                </div>
              </div>
              
              <button 
                className="checkout-btn"
                onClick={handleCheckout}
              >
                <span className="checkout-icon">🔒</span>
                Secure Checkout
              </button>
              
              <div className="security-note">
                <span className="security-icon">🛡️</span>
                <span>Protected by idRock fraud detection</span>
              </div>
            </div>
            
            <div className="continue-shopping">
              <Link to="/" className="continue-link">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;