import { useState, useEffect } from 'react';
import ProductCard from './components/ProductCard';
import { getProducts } from './services/productApi';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12; 

  const [cart, setCart] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('All');


  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const skip = (page - 1) * limit;

    getProducts(limit, skip, keyword, category)
      .then(data => {
        setProducts(data.products);
        setTotal(data.total); 
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [page, keyword, category]); 

  useEffect(() => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.title = totalItems > 0 ? `Cart (${totalItems})` : 'Shop';
  }, [cart]);

  const addToCart = (product) => {
    setCart(prevCart => {
      const exists = prevCart.find(item => item.id === product.id);
      if (exists) {
        return prevCart.map(item =>
          item.id === product.id ? {...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, {...product, quantity: 1}];
    });
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };


  const handleShowDetail = (product) => {
    setSelectedProduct(product);
  };


  const closeModal = () => {
    setSelectedProduct(null);
  };

  const handleSearch = (e) => {
    setKeyword(e.target.value);
    setCategory('All'); 
    setPage(1); 
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setKeyword(''); 
    setPage(1);
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="shop-layout" style={{ position: 'relative' }}>
      
      <div className="main-content">
        <h1 style={{ color: '#4a4a8c' }}>Products (DummyJSON)</h1>

        <div className="filters" style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Search products by name..." 
            value={keyword}
            onChange={handleSearch}
          />
          <select value={category} onChange={handleCategoryChange}>
            <option value="All">All Categories</option>
            <option value="beauty">Beauty</option>
            <option value="fragrances">Fragrances</option>
            <option value="furniture">Furniture</option>
            <option value="groceries">Groceries</option>
            <option value="laptops">Laptops</option>
            <option value="smartphones">Smartphones</option>
          </select>
        </div>

        {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Lỗi mạng: {error}</p>}

        {loading ? (
          <h2>Loading... ⏳</h2>
        ) : (
          <>
            <div className="products-container">
              {products.map(p => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  onAddToCart={addToCart} 
                  onShowDetail={handleShowDetail}
                />
              ))}
            </div>

            <div style={{ marginTop: '30px', display: 'flex', gap: '15px', alignItems: 'center' }}>
              <button 
                onClick={() => setPage(page - 1)} 
                disabled={page === 1}
                style={{ padding: '8px 16px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              
              <span style={{ fontWeight: 'bold' }}>
                Page {page} of {totalPages === 0 ? 1 : totalPages}
              </span>
              
              <button 
                onClick={() => setPage(page + 1)} 
                disabled={page >= totalPages}
                style={{ padding: '8px 16px', cursor: (page >= totalPages) ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <div className="sidebar-cart">
        <h2>Cart</h2>
        {cart.length === 0 ? <p>Your cart is empty.</p> : (
          <>
            <ul className="cart-list">
              {cart.map(item => (
                <li key={item.id}>
                  <span>{item.title} x <strong>{item.quantity}</strong></span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{(item.price * item.quantity).toFixed(2)} USD</span>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
            <h3 className="cart-total">Total: {totalPrice.toFixed(2)} USD</h3>
          </>
        )}
      </div>

      {selectedProduct && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>X</button>
            
            <img src={selectedProduct.thumbnail || "https://placehold.co/500x250?text=No+Image"} alt={selectedProduct.title} />
            
            <h2 style={{ marginTop: 0 }}>{selectedProduct.title}</h2>
            <p style={{ color: '#ff4d4f', fontSize: '20px', fontWeight: 'bold' }}>
              ${selectedProduct.price}
            </p>
            
            <div style={{ display: 'flex', gap: '15px', color: '#666', marginBottom: '15px' }}>
              <span>⭐ Rating: {selectedProduct.rating}/5</span>
              <span>📦 Kho: {selectedProduct.stock} cái</span>
            </div>
            
            <p style={{ lineHeight: '1.6' }}>{selectedProduct.description}</p>
            
            <button 
                className="add-to-cart-btn"
                disabled={selectedProduct.stock === 0}
                onClick={() => {
                  addToCart(selectedProduct);
                  closeModal();
                }}
            >
                Add to cart
            </button>
          </div>
        </div>
      )}

    </div>
  );
}