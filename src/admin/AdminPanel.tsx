import { useMemo, useState } from 'react';
import { BarChart3, Box, LayoutDashboard, LogOut, PackageSearch, Settings, ShieldCheck } from 'lucide-react';
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { sizes } from '../data/products';
import type {
  AdminSession,
  ManagedProduct,
  OrderRecord,
  OrderStatus,
  ProductDraft,
} from '../lib/storeTypes';

type AdminLayoutProps = {
  session: AdminSession | null;
  onLogout: () => Promise<void> | void;
};

type AdminLoginPageProps = {
  session: AdminSession | null;
  authEnabled: boolean;
  onLogin: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
};

type AdminDashboardPageProps = {
  orders: OrderRecord[];
  products: ManagedProduct[];
};

type AdminOrdersPageProps = {
  orders: OrderRecord[];
  cloudEnabled: boolean;
  onStatusChange: (order: OrderRecord, status: OrderStatus) => Promise<void> | void;
};

type AdminProductsPageProps = {
  products: ManagedProduct[];
  onSaveProduct: (draft: ProductDraft, files: File[]) => Promise<{ success: boolean; message: string }>;
  onDeleteProduct: (slug: string) => Promise<void> | void;
};

type AdminSettingsPageProps = {
  authEnabled: boolean;
  cloudEnabled: boolean;
  adminEmailPreview: string;
};

const orderStatuses: OrderStatus[] = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const blankDraft: ProductDraft = {
  slug: '',
  name: '',
  price: 0,
  description: '',
  details: ['', '', ''],
  fabric: '',
  sizes: [...sizes],
  color: '',
  collection: '',
  images: [],
  featured: false,
  bestSeller: false,
};

export function RequireAdmin({ session, ready }: { session: AdminSession | null; ready: boolean }) {
  if (!ready) {
    return (
      <main className="admin-login-shell">
        <section className="admin-login-card fade-in">
          <div className="admin-login-badge">
            <ShieldCheck size={18} />
            Loading admin session
          </div>
          <h1>Checking access</h1>
          <p>Please wait while the admin session is being verified.</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

export function AdminLoginPage({ session, authEnabled, onLogin }: AdminLoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (session) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await onLogin(email, password);
    setMessage(result.message);
    setIsSubmitting(false);
  };

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card fade-in">
        <div className="admin-login-badge">
          <ShieldCheck size={18} />
          Secure Admin Access
        </div>
        <h1>Admin Login</h1>
        <p>
          Sign in with your approved admin email to manage orders, products, and storefront settings.
        </p>

        {!authEnabled && (
          <div className="admin-notice admin-notice-warning">
            Supabase admin auth is not configured yet. Add your Supabase URL, anon key, and allowed admin emails before using secure admin access.
          </div>
        )}

        <label className="field admin-field">
          <span>Email address</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="admin@ueman.studio" />
        </label>
        <label className="field admin-field">
          <span>Password</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Enter your password" />
        </label>

        {message && <div className="admin-notice">{message}</div>}

        <button className="primary-button admin-submit" type="button" onClick={handleSubmit} disabled={isSubmitting || !authEnabled}>
          {isSubmitting ? 'Signing in...' : 'Login to Admin'}
        </button>

        <Link className="ghost-button admin-back-link" to="/">
          Back to storefront
        </Link>
      </section>
    </main>
  );
}

export function AdminLayout({ session, onLogout }: AdminLayoutProps) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="brand-wordmark">ueman.studio</div>
          <p className="admin-sidebar-copy">Admin workspace for order control, catalog updates, and storefront operations.</p>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          <NavLink to="/admin" end>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          <NavLink to="/admin/orders">
            <PackageSearch size={18} />
            Orders
          </NavLink>
          <NavLink to="/admin/products">
            <Box size={18} />
            Products
          </NavLink>
          <NavLink to="/admin/settings">
            <Settings size={18} />
            Settings
          </NavLink>
        </nav>

        <div className="admin-session-card">
          <div className="eyebrow">Signed in as</div>
          <strong>{session?.email}</strong>
          <button className="ghost-button admin-logout" type="button" onClick={() => void onLogout()}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminDashboardPage({ orders, products }: AdminDashboardPageProps) {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter((order) => order.status === 'Pending').length;
  const latestOrders = orders.slice(0, 5);
  const featuredProducts = products.filter((product) => product.featured).length;

  return (
    <div className="admin-page-stack fade-in">
      <section className="admin-hero-card">
        <div>
          <div className="eyebrow">Overview</div>
          <h1>Admin Dashboard</h1>
          <p>Monitor revenue, track pending orders, and keep the catalog current without leaving your existing storefront.</p>
        </div>
      </section>

      <section className="admin-stat-grid">
        <article className="admin-stat-card">
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Revenue</span>
          <strong>PKR {totalRevenue.toLocaleString()}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Pending</span>
          <strong>{pendingOrders}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Featured Products</span>
          <strong>{featuredProducts}</strong>
        </article>
      </section>

      <section className="admin-content-grid">
        <article className="admin-panel-card">
          <div className="admin-panel-heading">
            <div>
              <div className="eyebrow">Recent Orders</div>
              <h2>Latest activity</h2>
            </div>
            <BarChart3 size={18} />
          </div>

          <div className="admin-list-stack">
            {latestOrders.map((order) => (
              <div key={order.orderNumber} className="admin-list-row">
                <div>
                  <strong>{order.fullName}</strong>
                  <p>{order.orderNumber}</p>
                </div>
                <div>
                  <strong>PKR {order.total.toLocaleString()}</strong>
                  <p>{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel-card">
          <div className="admin-panel-heading">
            <div>
              <div className="eyebrow">Catalog Health</div>
              <h2>Store snapshot</h2>
            </div>
          </div>

          <div className="admin-list-stack">
            {products.slice(0, 5).map((product) => (
              <div key={product.slug} className="admin-list-row">
                <div>
                  <strong>{product.name}</strong>
                  <p>{product.collection}</p>
                </div>
                <div>
                  <strong>PKR {product.price.toLocaleString()}</strong>
                  <p>{product.images.length} image(s)</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export function AdminOrdersPage({ orders, cloudEnabled, onStatusChange }: AdminOrdersPageProps) {
  const safeOrders = Array.isArray(orders) ? orders : [];

  const formatCurrency = (value: unknown) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount.toLocaleString() : '0';
  };

  const formatDate = (value: unknown) => {
    if (typeof value !== 'string' || !value.trim()) {
      return 'Unknown date';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleString();
  };

  return (
    <div className="admin-page-stack fade-in">
      <section className="admin-hero-card">
        <div>
          <div className="eyebrow">Orders</div>
          <h1>Manage customer orders</h1>
          <p>Review customer information, ordered products, order date, totals, and fulfillment progress from one place.</p>
        </div>
      </section>

      {!cloudEnabled && (
        <div className="admin-notice admin-notice-warning">
          Cloud order sync is not configured yet. Orders are visible only on the same device/browser where they were placed.
        </div>
      )}

      {cloudEnabled && (
        <div className="admin-notice">
          Cloud order sync is connected. New orders should appear here across devices after refresh.
        </div>
      )}

      {!safeOrders.length && (
        <article className="admin-panel-card">
          <div className="admin-panel-heading">
            <div>
              <h2>No orders found</h2>
              <p>
                {cloudEnabled
                  ? 'No cloud orders are available yet. Place a test order and refresh this page.'
                  : 'Place a test order from this same browser to verify local order capture.'}
              </p>
            </div>
          </div>
          <div className="hero-actions">
            <Link className="primary-button" to="/shop">
              Open storefront
            </Link>
          </div>
        </article>
      )}

      <div className="admin-card-grid">
        {safeOrders.map((order) => {
          const safeItems = Array.isArray(order.items) ? order.items : [];

          return (
          <article key={order.orderNumber} className="admin-panel-card">
            <div className="admin-panel-heading">
              <div>
                <h2>{order.orderNumber || 'Unknown order'}</h2>
                <p>{formatDate(order.placedAt)}</p>
              </div>
              <select
                className="admin-select"
                value={order.status ?? 'Pending'}
                onChange={(event) => void onStatusChange(order, event.target.value as OrderStatus)}
              >
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-detail-grid">
              <div>
                <div className="eyebrow">Customer</div>
                <p>{order.fullName}</p>
                <p>{order.email}</p>
                <p>{order.phone}</p>
              </div>
              <div>
                <div className="eyebrow">Shipping</div>
                <p>{order.apartment}</p>
                <p>{order.street}</p>
                <p>{order.city}, {order.state}</p>
                <p>{order.country}</p>
              </div>
            </div>

            <div className="admin-order-items">
              {safeItems.map((item) => (
                <div key={`${order.orderNumber}-${item.productId}-${item.size}`} className="admin-list-row">
                  <div>
                    <strong>{item.product?.name || 'Unknown product'}</strong>
                    <p>Size {item.size || '-'} x {item.quantity ?? 0}</p>
                  </div>
                  <strong>PKR {formatCurrency((item.product?.price ?? 0) * (item.quantity ?? 0))}</strong>
                </div>
              ))}
            </div>

            {!safeItems.length && (
              <div className="admin-notice admin-notice-warning">
                This order has no readable item list in its payload.
              </div>
            )}

            <div className="admin-total-row">
              <span>Total amount</span>
              <strong>PKR {formatCurrency(order.total)}</strong>
            </div>
          </article>
          );
        })}
      </div>
    </div>
  );
}

export function AdminProductsPage({ products, onSaveProduct, onDeleteProduct }: AdminProductsPageProps) {
  const [draft, setDraft] = useState<ProductDraft>(blankDraft);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [notice, setNotice] = useState('');

  const sortedProducts = useMemo(
    () => [...products].sort((left, right) => right.id - left.id),
    [products],
  );

  const resetDraft = () => {
    setDraft(blankDraft);
    setPendingFiles([]);
  };

  const handleSave = async () => {
    const result = await onSaveProduct(draft, pendingFiles);
    setNotice(result.message || (result.success ? 'Product saved successfully.' : 'Unable to save product.'));

    if (result.success) {
      resetDraft();
    }
  };

  const editProduct = (product: ManagedProduct) => {
    setDraft({
      ...product,
      details: [...product.details],
      sizes: [...product.sizes],
      images: [...product.images],
    });
    setPendingFiles([]);
    setNotice('Editing existing product. Save to apply your changes.');
  };

  return (
    <div className="admin-page-stack fade-in">
      <section className="admin-hero-card">
        <div>
          <div className="eyebrow">Products</div>
          <h1>Catalog management</h1>
          <p>Add, edit, delete, and upload product images without changing the storefront layout.</p>
        </div>
      </section>

      <section className="admin-products-layout">
        <article className="admin-panel-card admin-product-form-card">
          <div className="admin-panel-heading">
            <div>
              <h2>{draft.id ? 'Edit product' : 'Add product'}</h2>
              <p>Fill in the catalog details and upload one or more images.</p>
            </div>
          </div>

          <div className="admin-form-grid">
            <label className="field admin-field">
              <span>Product name</span>
              <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="field admin-field">
              <span>Slug</span>
              <input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} placeholder="blushstone-tailored-set" />
            </label>
            <label className="field admin-field">
              <span>Price (PKR)</span>
              <input type="number" value={draft.price} onChange={(event) => setDraft((current) => ({ ...current, price: Number(event.target.value) }))} />
            </label>
            <label className="field admin-field">
              <span>Collection</span>
              <input value={draft.collection} onChange={(event) => setDraft((current) => ({ ...current, collection: event.target.value }))} />
            </label>
            <label className="field admin-field">
              <span>Color</span>
              <input value={draft.color} onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))} />
            </label>
            <label className="field admin-field">
              <span>Fabric</span>
              <input value={draft.fabric} onChange={(event) => setDraft((current) => ({ ...current, fabric: event.target.value }))} />
            </label>
            <label className="field admin-field field-full">
              <span>Description</span>
              <textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} rows={4} />
            </label>
            <label className="field admin-field field-full">
              <span>Details</span>
              <textarea
                value={draft.details.join('\n')}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    details: event.target.value.split('\n').map((item) => item.trim()),
                  }))
                }
                rows={4}
                placeholder="One detail per line"
              />
            </label>
            <label className="field admin-field field-full">
              <span>Sizes</span>
              <input
                value={draft.sizes.join(', ')}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    sizes: event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                  }))
                }
                placeholder="XS, S, M, L, XL"
              />
            </label>
            <label className="field admin-field field-full">
              <span>Upload product images</span>
              <input type="file" multiple accept="image/*" onChange={(event) => setPendingFiles(Array.from(event.target.files ?? []))} />
            </label>
          </div>

          {!!draft.images.length && (
            <div className="admin-image-grid">
              {draft.images.map((image) => (
                <img key={image} src={image} alt="Product preview" />
              ))}
            </div>
          )}

          <div className="admin-toggle-row">
            <label>
              <input type="checkbox" checked={Boolean(draft.featured)} onChange={(event) => setDraft((current) => ({ ...current, featured: event.target.checked }))} />
              Featured
            </label>
            <label>
              <input type="checkbox" checked={Boolean(draft.bestSeller)} onChange={(event) => setDraft((current) => ({ ...current, bestSeller: event.target.checked }))} />
              Best seller
            </label>
          </div>

          {notice && <div className="admin-notice">{notice}</div>}

          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={handleSave}>
              {draft.id ? 'Update Product' : 'Add Product'}
            </button>
            <button className="ghost-button" type="button" onClick={resetDraft}>
              Clear form
            </button>
          </div>
        </article>

        <article className="admin-panel-card">
          <div className="admin-panel-heading">
            <div>
              <h2>Existing products</h2>
              <p>Edit or remove products already visible on the storefront.</p>
            </div>
          </div>

          <div className="admin-product-list">
            {sortedProducts.map((product) => (
              <div key={product.slug} className="admin-product-row">
                <img src={product.images[0]} alt={product.name} />
                <div>
                  <strong>{product.name}</strong>
                  <p>{product.collection} • PKR {product.price.toLocaleString()}</p>
                </div>
                <div className="admin-row-actions">
                  <button className="ghost-button" type="button" onClick={() => editProduct(product)}>
                    Edit
                  </button>
                  <button className="secondary-button" type="button" onClick={() => void onDeleteProduct(product.slug)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export function AdminSettingsPage({ authEnabled, cloudEnabled, adminEmailPreview }: AdminSettingsPageProps) {
  return (
    <div className="admin-page-stack fade-in">
      <section className="admin-hero-card">
        <div>
          <div className="eyebrow">Settings</div>
          <h1>Backend and deployment status</h1>
          <p>Review what is already connected and what should be configured next for a production-ready admin experience.</p>
        </div>
      </section>

      <section className="admin-content-grid">
        <article className="admin-panel-card">
          <div className="admin-panel-heading">
            <div>
              <h2>Security</h2>
              <p>Admin login uses Supabase Auth and email allow-listing.</p>
            </div>
          </div>

          <div className="admin-list-stack">
            <div className="admin-list-row">
              <span>Supabase Auth</span>
              <strong>{authEnabled ? 'Connected' : 'Needs setup'}</strong>
            </div>
            <div className="admin-list-row">
              <span>Allowed admin emails</span>
              <strong>{adminEmailPreview || 'Add VITE_ADMIN_EMAILS'}</strong>
            </div>
            {!authEnabled && (
              <div className="admin-notice admin-notice-warning">
                Missing build-time env. You can also set runtime keys in browser localStorage:
                <br />ueman.supabaseUrl
                <br />ueman.supabaseAnonKey
                <br />ueman.adminEmails
              </div>
            )}
          </div>
        </article>

        <article className="admin-panel-card">
          <div className="admin-panel-heading">
            <div>
              <h2>Data layer</h2>
              <p>Orders already support cloud sync. Products can also be cloud-managed through Supabase.</p>
            </div>
          </div>

          <div className="admin-list-stack">
            <div className="admin-list-row">
              <span>Cloud orders</span>
              <strong>{cloudEnabled ? 'Enabled' : 'Local only'}</strong>
            </div>
            <div className="admin-list-row">
              <span>Admin orders link</span>
              <strong>/admin/orders</strong>
            </div>
            <div className="admin-list-row">
              <span>Product image storage</span>
              <strong>Supabase Storage bucket: product-images</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}