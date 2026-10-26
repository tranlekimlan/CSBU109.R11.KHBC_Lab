export default function ProductCard({ product, onAddToCart, onShowDetail }) {
    
    const image = product.thumbnail || "https://placehold.co/150x150/e2e8f0/8e8e8e?text=No+image";

    return (
        <div className="card">
            {product.price < 20 && <span className="badge">Low price!</span>}

            <img 
                src={image} 
                alt={product.title} 
                onClick={() => onShowDetail(product)} 
                style={{ cursor: 'pointer' }}
            />

            <h3 
                onClick={() => onShowDetail(product)} 
                style={{ cursor: 'pointer', color: '#1890ff' }}
            >
                {product.title}
            </h3>
            
            <p>{product.price.toLocaleString()} USD</p>
            
            {product.stock > 0 ? (
                <span className="stock in">In stock ({product.stock})</span>
            ) : (
                <span className="stock out">Sold out</span>
            )}

            <button 
                className="add-to-cart-btn"
                disabled={product.stock === 0}
                onClick={() => onAddToCart(product)}
            >
                Add to cart
            </button>
        </div>
    );
}