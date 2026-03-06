import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../lib/api';
import { isAdmin, isAuthenticated } from '../lib/session';

const CHART_COLORS = ['#ff5d2e', '#17c9a3', '#a78bfa', '#fbbf24', '#60a5fa', '#f472b6'];

const defaultProduct = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  category: '',
  image_url: '',
};

const defaultOffer = {
  title: '',
  description: '',
  fecha_inicio: '',
  fecha_fin: '',
  active: true,
};

function formatMoney(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('es-ES');
}

export default function AdminPanel() {
  const [tab, setTab] = useState<'overview' | 'products' | 'orders' | 'users' | 'offers'>('overview');
  const [overview, setOverview] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [productForm, setProductForm] = useState(defaultProduct);
  const [offerForm, setOfferForm] = useState(defaultOffer);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const loadAdminData = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!isAdmin()) {
      navigate('/');
      return;
    }

    try {
      const [overviewRes, productsRes, ordersRes, usersRes, offersRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/products'),
        api.get('/admin/orders'),
        api.get('/admin/users'),
        api.get('/admin/flash'),
      ]);

      setOverview(overviewRes.data);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
      setUsers(usersRes.data);
      setOffers(offersRes.data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo cargar el panel de administración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const updateProductField = (field, value) => {
    setProductForm((current) => ({ ...current, [field]: value }));
  };

  const updateOfferField = (field, value) => {
    setOfferForm((current) => ({ ...current, [field]: value }));
  };

  const resetProductForm = () => {
    setProductForm(defaultProduct);
    setEditingProductId(null);
  };

  const resetOfferForm = () => {
    setOfferForm(defaultOffer);
    setEditingOfferId(null);
  };

  const saveProduct = async (event) => {
    event.preventDefault();

    try {
      if (editingProductId) {
        await api.put(`/admin/products/${editingProductId}`, productForm);
        setMessage('Producto actualizado');
      } else {
        await api.post('/admin/products', productForm);
        setMessage('Producto creado');
      }
      resetProductForm();
      loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo guardar el producto');
    }
  };

  const editProduct = (product) => {
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      stock: product.stock || 0,
      category: product.category || '',
      image_url: product.image_url || '',
    });
    setEditingProductId(product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = async (productId) => {
    try {
      await api.delete(`/admin/products/${productId}`);
      setMessage('Producto eliminado');
      if (editingProductId === productId) resetProductForm();
      loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo eliminar el producto');
    }
  };

  const updateOrderStatus = async (orderId, estado) => {
    try {
      await api.patch(`/admin/orders/${orderId}`, { estado });
      setMessage(`Pedido #${orderId} actualizado`);
      loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo actualizar el pedido');
    }
  };

  const saveUser = async (user) => {
    try {
      await api.patch(`/admin/users/${user.id}`, {
        name: user.name,
        email: user.email,
        role: user.role,
        puntos: Number(user.puntos) || 0,
      });
      setMessage(`Cuenta #${user.id} actualizada`);
      loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo actualizar la cuenta');
    }
  };

  const deleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setMessage('Cuenta eliminada');
      loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo eliminar la cuenta');
    }
  };

  const updateEditableUser = (userId, field, value) => {
    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, [field]: value } : user)));
  };

  const saveOffer = async (event) => {
    event.preventDefault();

    try {
      if (editingOfferId) {
        await api.put(`/admin/flash/${editingOfferId}`, offerForm);
        setMessage('Oferta actualizada');
      } else {
        await api.post('/admin/flash', offerForm);
        setMessage('Oferta creada');
      }
      resetOfferForm();
      loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo guardar la oferta');
    }
  };

  const editOffer = (offer) => {
    setOfferForm({
      title: offer.title || '',
      description: offer.description || '',
      fecha_inicio: offer.fecha_inicio || '',
      fecha_fin: offer.fecha_fin || '',
      active: Boolean(offer.active),
    });
    setEditingOfferId(offer.id);
  };

  const deleteOffer = async (offerId) => {
    try {
      await api.delete(`/admin/flash/${offerId}`);
      setMessage('Oferta eliminada');
      if (editingOfferId === offerId) resetOfferForm();
      loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo eliminar la oferta');
    }
  };

  if (loading) {
    return <p>Cargando panel de admin...</p>;
  }

  const tabs = [
    { key: 'overview', label: 'Resumen' },
    { key: 'products', label: `Productos (${products.length})` },
    { key: 'orders', label: `Pedidos (${orders.length})` },
    { key: 'users', label: `Clientes (${users.length})` },
    { key: 'offers', label: `Ofertas flash (${offers.length})` },
  ] as const;

  return (
    <section className="content-stack">
      <section className="panel admin-hero">
        <p className="kicker">Backoffice</p>
        <h1>Panel de administración</h1>
        <p>Gestiona catálogo, pedidos, clientes, cuentas administrativas y ofertas flash desde una sola vista.</p>
      </section>

      {message && <p className="alert">{message}</p>}

      <nav className="admin-tabs">
        {tabs.map(({ key, label }) => (
          <button
            className={`admin-tab${tab === key ? ' admin-tab--active' : ''}`}
            key={key}
            onClick={() => setTab(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && overview && (() => {
        const ordersByStatus = ['paid', 'processing', 'shipped', 'delivered', 'cancelled'].map((s, i) => ({
          name: s,
          value: orders.filter((o: any) => o.estado === s).length,
          fill: CHART_COLORS[i % CHART_COLORS.length],
        })).filter((d) => d.value > 0);

        const stockByCategory: Record<string, number> = {};
        for (const p of products as any[]) {
          const cat = p.category || 'Sin categoría';
          stockByCategory[cat] = (stockByCategory[cat] || 0) + p.stock;
        }
        const stockData = Object.entries(stockByCategory).map(([name, stock]) => ({ name, stock }));

        const recentOrdersData = [...overview.recentOrders].reverse().map((o: any) => ({
          name: `#${o.id}`,
          total: o.total,
        }));

        return (
          <>
            <section className="grid admin-stats">
              <article className="card admin-stat">
                <span>Facturación</span>
                <strong>{formatMoney(overview.stats.revenue)}</strong>
              </article>
              <article className="card admin-stat">
                <span>Productos</span>
                <strong>{overview.stats.products}</strong>
              </article>
              <article className="card admin-stat">
                <span>Pedidos</span>
                <strong>{overview.stats.orders}</strong>
              </article>
              <article className="card admin-stat">
                <span>Pedidos activos</span>
                <strong>{overview.stats.pendingOrders}</strong>
              </article>
              <article className="card admin-stat">
                <span>Usuarios</span>
                <strong>{overview.stats.users}</strong>
              </article>
              <article className="card admin-stat">
                <span>Admins</span>
                <strong>{overview.stats.admins}</strong>
              </article>
            </section>

            <section className="admin-charts">
              {recentOrdersData.length > 0 && (
                <div className="panel admin-section">
                  <h2>Últimos pedidos — importe</h2>
                  <ResponsiveContainer height={220} width="100%">
                    <BarChart data={recentOrdersData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#98a7bf" tick={{ fill: '#98a7bf', fontSize: 12 }} />
                      <YAxis stroke="#98a7bf" tick={{ fill: '#98a7bf', fontSize: 12 }} tickFormatter={(v) => `${v}€`} />
                      <Tooltip
                        contentStyle={{ background: '#16233d', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10 }}
                        formatter={(v: number) => [formatMoney(v), 'Total']}
                        labelStyle={{ color: '#f3f7ff' }}
                      />
                      <Bar dataKey="total" fill="#ff5d2e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {ordersByStatus.length > 0 && (
                <div className="panel admin-section">
                  <h2>Pedidos por estado</h2>
                  <ResponsiveContainer height={220} width="100%">
                    <PieChart>
                      <Pie cx="50%" cy="50%" data={ordersByStatus} dataKey="value" innerRadius={55} nameKey="name" outerRadius={90} />
                      <Tooltip
                        contentStyle={{ background: '#16233d', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10 }}
                        labelStyle={{ color: '#f3f7ff' }}
                      />
                      <Legend formatter={(v) => <span style={{ color: '#98a7bf', fontSize: 12 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {stockData.length > 0 && (
                <div className="panel admin-section">
                  <h2>Stock por categoría</h2>
                  <ResponsiveContainer height={220} width="100%">
                    <BarChart data={stockData} layout="vertical">
                      <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" />
                      <XAxis stroke="#98a7bf" tick={{ fill: '#98a7bf', fontSize: 12 }} type="number" />
                      <YAxis dataKey="name" stroke="#98a7bf" tick={{ fill: '#98a7bf', fontSize: 12 }} type="category" width={100} />
                      <Tooltip
                        contentStyle={{ background: '#16233d', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10 }}
                        formatter={(v: number) => [v, 'Unidades']}
                        labelStyle={{ color: '#f3f7ff' }}
                      />
                      <Bar dataKey="stock" fill="#17c9a3" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </>
        );
      })()}

      {tab === 'products' && (
        <>
          <section className="admin-layout">
            <div className="panel admin-section">
              <div className="panel__header">
                <h2>{editingProductId ? 'Editar producto' : 'Nuevo producto'}</h2>
                {editingProductId && (
                  <button className="btn btn--ghost" onClick={resetProductForm} type="button">
                    Cancelar
                  </button>
                )}
              </div>
              <form className="form admin-form" onSubmit={saveProduct}>
                <input onChange={(event) => updateProductField('name', event.target.value)} placeholder="Nombre" required value={productForm.name} />
                <textarea
                  className="admin-textarea"
                  onChange={(event) => updateProductField('description', event.target.value)}
                  placeholder="Descripción"
                  rows={4}
                  value={productForm.description}
                />
                <div className="admin-form-grid">
                  <input onChange={(event) => updateProductField('price', Number(event.target.value))} placeholder="Precio" required step="0.01" type="number" value={productForm.price} />
                  <input onChange={(event) => updateProductField('stock', Number(event.target.value))} placeholder="Stock" required type="number" value={productForm.stock} />
                </div>
                <input onChange={(event) => updateProductField('category', event.target.value)} placeholder="Categoría" value={productForm.category} />
                <input onChange={(event) => updateProductField('image_url', event.target.value)} placeholder="URL de imagen" value={productForm.image_url} />
                <button className="btn" type="submit">
                  {editingProductId ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </form>
            </div>
          </section>

          <section className="panel admin-section">
            <div className="panel__header">
              <h2>Inventario y catálogo</h2>
              <span className="pill">{products.length} productos</span>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>
                        <strong>{product.name}</strong>
                        <small>{product.description || 'Sin descripción'}</small>
                      </td>
                      <td>{product.category || '-'}</td>
                      <td>{formatMoney(product.price)}</td>
                      <td>{product.stock}</td>
                      <td className="admin-actions-cell">
                        <button className="btn btn--secondary" onClick={() => editProduct(product)} type="button">
                          Editar
                        </button>
                        <button className="btn btn--danger" onClick={() => deleteProduct(product.id)} type="button">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {tab === 'orders' && (
        <section className="panel admin-section">
          <div className="panel__header">
            <h2>Pedidos</h2>
            <span className="pill">{orders.length} pedidos</span>
          </div>
          <div className="admin-cards">
            {orders.map((order) => (
              <article className="card admin-order-card" key={order.id}>
                <div className="admin-order-head">
                  <div>
                    <h3>Pedido #{order.id}</h3>
                    <p>
                      {order.customer_name} · {order.customer_email}
                    </p>
                  </div>
                  <div className="admin-order-meta">
                    <strong>{formatMoney(order.total)}</strong>
                    <small>{formatDate(order.fecha)}</small>
                  </div>
                </div>
                <div className="admin-order-items">
                  {order.items.map((item: any) => (
                    <p key={`${order.id}-${item.product_id}`}>
                      {item.product_name || `Producto #${item.product_id}`} x{item.quantity} · {formatMoney(item.price)}
                    </p>
                  ))}
                </div>
                <div className="actions">
                  {['paid', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                    <button
                      className={`btn ${order.estado === status ? 'btn--secondary' : 'btn--ghost'}`}
                      key={status}
                      onClick={() => updateOrderStatus(order.id, status)}
                      type="button"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'users' && (
        <section className="panel admin-section">
          <div className="panel__header">
            <h2>Clientes y cuentas</h2>
            <span className="pill">{users.length} cuentas</span>
          </div>
          <div className="admin-user-list">
            {users.map((user) => (
              <article className="card admin-user-card" key={user.id}>
                <div className="admin-user-grid">
                  <input onChange={(event) => updateEditableUser(user.id, 'name', event.target.value)} value={user.name} />
                  <input onChange={(event) => updateEditableUser(user.id, 'email', event.target.value)} value={user.email} />
                  <select className="select" onChange={(event) => updateEditableUser(user.id, 'role', event.target.value)} value={user.role}>
                    <option value="customer">Cliente</option>
                    <option value="admin">Admin</option>
                  </select>
                  <input onChange={(event) => updateEditableUser(user.id, 'puntos', event.target.value)} type="number" value={user.puntos} />
                </div>
                <div className="admin-user-meta">
                  <span>Pedidos: {user.orders_count}</span>
                  <span>Gastado: {formatMoney(user.total_spent)}</span>
                  <span>Alta: {formatDate(user.fecha_registro)}</span>
                </div>
                <div className="actions">
                  <button className="btn btn--secondary" onClick={() => saveUser(user)} type="button">
                    Guardar cuenta
                  </button>
                  <button className="btn btn--danger" onClick={() => deleteUser(user.id)} type="button">
                    Eliminar cuenta
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'offers' && (
        <>
          <section className="admin-layout">
            <div className="panel admin-section">
              <div className="panel__header">
                <h2>{editingOfferId ? 'Editar oferta flash' : 'Nueva oferta flash'}</h2>
                {editingOfferId && (
                  <button className="btn btn--ghost" onClick={resetOfferForm} type="button">
                    Cancelar
                  </button>
                )}
              </div>
              <form className="form admin-form" onSubmit={saveOffer}>
                <input onChange={(event) => updateOfferField('title', event.target.value)} placeholder="Título" required value={offerForm.title} />
                <textarea
                  className="admin-textarea"
                  onChange={(event) => updateOfferField('description', event.target.value)}
                  placeholder="Descripción"
                  rows={4}
                  value={offerForm.description}
                />
                <input onChange={(event) => updateOfferField('fecha_inicio', event.target.value)} placeholder="2026-03-06 09:00:00" required value={offerForm.fecha_inicio} />
                <input onChange={(event) => updateOfferField('fecha_fin', event.target.value)} placeholder="2026-03-10 23:59:59" required value={offerForm.fecha_fin} />
                <label className="terms-check">
                  <input checked={offerForm.active} onChange={(event) => updateOfferField('active', event.target.checked)} type="checkbox" />
                  <span>Oferta activa</span>
                </label>
                <button className="btn" type="submit">
                  {editingOfferId ? 'Guardar oferta' : 'Crear oferta'}
                </button>
              </form>
            </div>
          </section>

          <section className="panel admin-section">
            <div className="panel__header">
              <h2>Ofertas flash</h2>
              <span className="pill">{offers.length} ofertas</span>
            </div>
            <div className="admin-cards">
              {offers.map((offer) => (
                <article className="card" key={offer.id}>
                  <h3>{offer.title}</h3>
                  <p>{offer.description || 'Sin descripción'}</p>
                  <p>
                    {offer.fecha_inicio} - {offer.fecha_fin}
                  </p>
                  <span className={`deal-chip ${offer.active ? 'deal-chip--hot' : ''}`}>{offer.active ? 'Activa' : 'Inactiva'}</span>
                  <div className="actions">
                    <button className="btn btn--secondary" onClick={() => editOffer(offer)} type="button">
                      Editar
                    </button>
                    <button className="btn btn--danger" onClick={() => deleteOffer(offer.id)} type="button">
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
