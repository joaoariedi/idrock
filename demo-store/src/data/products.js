// Product data for the NexShop demo store
export const categories = [
  { id: 'electronics', name: 'Electronics', icon: '📱' },
  { id: 'clothing', name: 'Clothing', icon: '👕' },
  { id: 'books', name: 'Books', icon: '📚' },
  { id: 'home', name: 'Home & Garden', icon: '🏠' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'beauty', name: 'Beauty', icon: '💄' }
];

export const products = [
  // Electronics
  {
    id: 'elect-001',
    name: 'Smartphone XPro 12',
    price: 1299.99,
    originalPrice: 1499.99,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    description: 'Latest smartphone with advanced camera system and 5G connectivity.',
    features: ['6.7" OLED Display', '128GB Storage', '48MP Triple Camera', '5G Ready'],
    rating: 4.8,
    reviews: 324,
    inStock: true,
    stockCount: 45,
    brand: 'TechPro'
  },
  {
    id: 'elect-002', 
    name: 'Wireless Bluetooth Headphones',
    price: 299.99,
    originalPrice: 399.99,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    description: 'Premium wireless headphones with noise cancellation and 30-hour battery life.',
    features: ['Active Noise Cancellation', '30h Battery Life', 'Quick Charge', 'Premium Audio'],
    rating: 4.7,
    reviews: 156,
    inStock: true,
    stockCount: 23,
    brand: 'AudioMax'
  },
  {
    id: 'elect-003',
    name: 'Gaming Laptop Pro',
    price: 2499.99,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
    description: 'High-performance gaming laptop with RTX graphics and mechanical keyboard.',
    features: ['RTX 4070 Graphics', '32GB RAM', '1TB NVMe SSD', '144Hz Display'],
    rating: 4.9,
    reviews: 89,
    inStock: true,
    stockCount: 12,
    brand: 'GameForce'
  },

  // Clothing
  {
    id: 'cloth-001',
    name: 'Premium Cotton T-Shirt',
    price: 29.99,
    originalPrice: 39.99,
    category: 'clothing',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    description: 'Comfortable premium cotton t-shirt in various colors and sizes.',
    features: ['100% Organic Cotton', 'Pre-shrunk', 'Machine Washable', 'Available in 8 Colors'],
    rating: 4.5,
    reviews: 267,
    inStock: true,
    stockCount: 89,
    brand: 'ComfortWear'
  },
  {
    id: 'cloth-002',
    name: 'Designer Denim Jeans',
    price: 89.99,
    category: 'clothing', 
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    description: 'Classic designer denim jeans with perfect fit and premium quality.',
    features: ['Stretch Denim', 'Slim Fit', 'Premium Quality', 'Multiple Sizes'],
    rating: 4.6,
    reviews: 143,
    inStock: true,
    stockCount: 34,
    brand: 'DenimCraft'
  },
  {
    id: 'cloth-003',
    name: 'Luxury Winter Jacket',
    price: 199.99,
    originalPrice: 249.99,
    category: 'clothing',
    image: 'https://images.unsplash.com/photo-1544966503-7cc536f6179a?w=400',
    description: 'Waterproof winter jacket with premium insulation and modern design.',
    features: ['Waterproof', 'Insulated', 'Multiple Pockets', 'Wind Resistant'],
    rating: 4.8,
    reviews: 98,
    inStock: true,
    stockCount: 67,
    brand: 'WinterGuard'
  },

  // Books
  {
    id: 'book-001',
    name: 'The Art of Programming',
    price: 49.99,
    category: 'books',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    description: 'Comprehensive guide to modern programming techniques and best practices.',
    features: ['500+ Pages', 'Code Examples', 'Expert Tips', 'Updated Edition'],
    rating: 4.9,
    reviews: 423,
    inStock: true,
    stockCount: 156,
    brand: 'TechBooks'
  },
  {
    id: 'book-002',
    name: 'Digital Marketing Mastery',
    price: 34.99,
    originalPrice: 44.99,
    category: 'books',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
    description: 'Master digital marketing strategies for the modern business landscape.',
    features: ['Real Case Studies', 'Practical Strategies', '12 Chapters', 'Bonus Resources'],
    rating: 4.7,
    reviews: 234,
    inStock: true,
    stockCount: 78,
    brand: 'BusinessPress'
  },

  // Home & Garden
  {
    id: 'home-001',
    name: 'Smart Home Security Camera',
    price: 159.99,
    originalPrice: 199.99,
    category: 'home',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    description: 'Wi-Fi enabled security camera with night vision and mobile app control.',
    features: ['1080p HD Video', 'Night Vision', 'Motion Detection', 'Mobile App'],
    rating: 4.6,
    reviews: 189,
    inStock: true,
    stockCount: 45,
    brand: 'SecureHome'
  },
  {
    id: 'home-002',
    name: 'Aromatherapy Essential Oil Set',
    price: 39.99,
    category: 'home',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
    description: 'Premium essential oil set with 6 different scents for relaxation and wellness.',
    features: ['6 Essential Oils', '100% Pure', 'Gift Box Included', 'Therapeutic Grade'],
    rating: 4.8,
    reviews: 276,
    inStock: true,
    stockCount: 123,
    brand: 'NatureScent'
  },

  // Sports
  {
    id: 'sport-001',
    name: 'Professional Yoga Mat',
    price: 69.99,
    originalPrice: 89.99,
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    description: 'Extra thick yoga mat with superior grip and comfort for all practice levels.',
    features: ['6mm Thick', 'Non-Slip Surface', 'Eco-Friendly', 'Carrying Strap'],
    rating: 4.7,
    reviews: 167,
    inStock: true,
    stockCount: 89,
    brand: 'ZenFit'
  },
  {
    id: 'sport-002',
    name: 'Adjustable Dumbbell Set',
    price: 299.99,
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    description: 'Space-saving adjustable dumbbells for complete home workout solution.',
    features: ['5-50 lbs Range', 'Space Saving', 'Quick Adjust', 'Rubber Coated'],
    rating: 4.8,
    reviews: 134,
    inStock: true,
    stockCount: 23,
    brand: 'FitnessPro'
  },

  // Beauty
  {
    id: 'beauty-001',
    name: 'Luxury Skincare Set',
    price: 129.99,
    originalPrice: 159.99,
    category: 'beauty',
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
    description: 'Complete skincare routine with cleanser, serum, moisturizer, and SPF.',
    features: ['4-Step Routine', 'Anti-Aging Formula', 'All Skin Types', 'Dermatologist Tested'],
    rating: 4.9,
    reviews: 298,
    inStock: true,
    stockCount: 67,
    brand: 'LuxeBeauty'
  },
  {
    id: 'beauty-002',
    name: 'Professional Makeup Brush Set',
    price: 79.99,
    category: 'beauty',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400',
    description: 'Professional-grade makeup brush set with premium synthetic bristles.',
    features: ['20 Brushes', 'Synthetic Bristles', 'Travel Case', 'Professional Quality'],
    rating: 4.6,
    reviews: 187,
    inStock: true,
    stockCount: 45,
    brand: 'ProMakeup'
  }
];

// Helper functions
export const getProductById = (id) => {
  return products.find(product => product.id === id);
};

export const getProductsByCategory = (categoryId) => {
  return products.filter(product => product.category === categoryId);
};

export const getFeaturedProducts = (limit = 8) => {
  return products
    .filter(product => product.rating >= 4.7)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
};

export const getProductsOnSale = () => {
  return products.filter(product => product.originalPrice);
};

export const searchProducts = (query) => {
  const searchQuery = query.toLowerCase();
  return products.filter(product =>
    product.name.toLowerCase().includes(searchQuery) ||
    product.description.toLowerCase().includes(searchQuery) ||
    product.brand.toLowerCase().includes(searchQuery) ||
    product.features.some(feature => feature.toLowerCase().includes(searchQuery))
  );
};

export default products;