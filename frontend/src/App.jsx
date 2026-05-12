import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function App() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error(`failed to load (${res.status})`);
      setProducts(await res.json());
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addProduct = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('name is required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          price: price === '' ? undefined : Number(price),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `failed (${res.status})`);
      setName('');
      setPrice('');
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Products</h1>

      <form onSubmit={addProduct} className="form">
        <input
          type="text"
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add product'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      <ul className="list">
        {products.length === 0 && <li className="empty">No products yet.</li>}
        {products.map((p) => (
          <li key={p.name}>
            <span>{p.name}</span>
            <span>{p.price ?? '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
