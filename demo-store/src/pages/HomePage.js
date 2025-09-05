import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { products, categories, getFeaturedProducts, getProductsByCategory, searchProducts } from '../data/products';
import { useIdRock } from '../contexts/IdRockContext';
import './HomePage.css';

function HomePage() {
  const [searchParams] = useSearchParams();
  const { trackEvent } = useIdRock();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [isLoading, setIsLoading] = useState(false);

  const searchQuery = searchParams.get('search') || '';

  // Track page view
  useEffect(() => {
    const trackPageView = async () => {
      try {
        await trackEvent('page_view', {
          page: 'home',
          searchQuery: searchQuery || null,
          category: selectedCategory
        });
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };
    
    trackPageView();
  }, [trackEvent, searchQuery, selectedCategory]);

  // Get filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = products;

    // Apply search filter
    if (searchQuery) {
      result = searchProducts(searchQuery);
    }
    // Apply category filter
    else if (selectedCategory !== 'all') {
      result = getProductsByCategory(selectedCategory);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result = [...result].sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'featured':
      default:
        if (!searchQuery && selectedCategory === 'all') {
          result = getFeaturedProducts(result.length);
        }
        break;
    }

    return result;
  }, [searchQuery, selectedCategory, sortBy]);

  const handleCategoryChange = async (category) => {
    setIsLoading(true);
    setSelectedCategory(category);
    
    try {
      await trackEvent('category_filter', {
        category,
        previousCategory: selectedCategory
      });
    } catch (error) {
      console.error('Error tracking category change:', error);
    }
    
    // Simulate loading delay for better UX
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleSortChange = async (sort) => {
    setSortBy(sort);
    
    try {
      await trackEvent('sort_change', {
        sortBy: sort,
        category: selectedCategory,
        productCount: filteredProducts.length
      });
    } catch (error) {
      console.error('Error tracking sort change:', error);
    }
  };

  const getPageTitle = () => {
    if (searchQuery) {
      return `Search results for "${searchQuery}"`;
    }
    if (selectedCategory === 'all') {
      return 'Featured Products';
    }
    const category = categories.find(cat => cat.id === selectedCategory);
    return category ? `${category.name} Products` : 'Products';
  };

  const getResultsCount = () => {
    return `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`;
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      {!searchQuery && selectedCategory === 'all' && (
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Welcome to <span className="brand-highlight">NexShop</span>
              </h1>
              <p className="hero-subtitle">
                Experience secure shopping with advanced fraud protection powered by idRock technology
              </p>
              <div className="hero-features">
                <div className="feature">
                  <span className="feature-icon">🔒</span>
                  <span>Real-time Fraud Detection</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">⚡</span>
                  <span>Fast & Secure Checkout</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🛡️</span>
                  <span>Advanced Security</span>
                </div>
              </div>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-number">{products.length}+</div>
                <div className="stat-label">Products</div>
              </div>
              <div className="stat">
                <div className="stat-number">{categories.length}</div>
                <div className="stat-label">Categories</div>
              </div>
              <div className="stat">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Uptime</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filters and Search Results */}
      <section className="products-section">
        <div className="products-container">
          {/* Page Header */}
          <div className="page-header">
            <div className="page-title-section">
              <h2 className="page-title">{getPageTitle()}</h2>
              <p className="results-count">{getResultsCount()}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            {/* Category Filter */}
            <div className="category-filter">
              <h3 className="filter-title">Categories</h3>
              <div className="category-buttons">
                <button
                  className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => handleCategoryChange('all')}
                >
                  <span className="category-icon">🛍️</span>
                  All Products
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    <span className="category-icon">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div className="sort-filter">
              <label htmlFor="sort-select" className="filter-title">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="sort-select"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="products-grid-container">
            {isLoading ? (
              <div className="loading-section">
                <div className="loading-spinner-large">
                  <div className="spinner"></div>
                  <p>Loading products...</p>
                </div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="products-grid">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="no-products">
                <div className="no-products-icon">🔍</div>
                <h3>No products found</h3>
                <p>
                  {searchQuery 
                    ? `No products match your search "${searchQuery}"`
                    : 'No products available in this category'
                  }
                </p>
                <button
                  className="clear-filters-btn"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSortBy('featured');
                  }}
                >
                  Show All Products
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;