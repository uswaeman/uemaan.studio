import { useEffect, useMemo, useState } from 'react';
import {
  Heart,
  Mail,
  Menu,
  Phone,
  Search,
  ShoppingBag,
  Star,
  Truck,
  X,
} from 'lucide-react';
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { getProductBySlug, products, sizes, type Product } from './data/products';
import { fetchCloudOrders, isCloudOrdersEnabled, saveCloudOrder } from './lib/ordersApi';

type CartItem = {
  productId: number;
  size: string;
  quantity: number;
};

type CheckoutForm = {
  fullName: string;
  email: string;
  phone: string;
  apartment: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  paymentMethod: 'COD' | 'EasyPaisa' | 'Bank Transfer';
  paymentScreenshot: string;
};

type OrderRecord = CheckoutForm & {
  orderNumber: string;
  placedAt: string;
  items: Array<CartItem & { product: Product }>;
  total: number;
};

const defaultCheckoutForm: CheckoutForm = {
  fullName: '',
  email: '',
  phone: '',
  apartment: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Pakistan',
  paymentMethod: 'COD',
  paymentScreenshot: '',
};

const DELIVERY_CHARGE = 250;
const ORDER_STORAGE_KEY = 'ueman.orderHistory';

const reviews = [
  {
    name: 'Hira A.',
    text: 'The finishing feels considered and expensive. The fit was graceful without needing any alteration.',
  },
  {
    name: 'Minal S.',
    text: 'Beautiful neutrals, clean tailoring, and packaging that felt very premium. Exactly the kind of quiet luxury I wanted.',
  },
  {
    name: 'Ayesha K.',
    text: 'The fabric drapes so well in person. ueman.studio feels thoughtful, polished, and easy to trust.',
  },
];

const faqItems = [
  {
    title: 'How long does delivery take?',
    text: 'Orders are usually dispatched within 2 to 4 working days. Delivery timelines vary by city and will be confirmed at checkout.',
  },
  {
    title: 'Do you offer size exchange?',
    text: 'Yes. Unworn pieces with original tags can be exchanged for size within 7 days of delivery, subject to stock availability.',
  },
  {
    title: 'How do I pay via EasyPaisa?',
    text: 'Select EasyPaisa during checkout, transfer the amount to the provided account, and upload your payment screenshot before placing the order.',
  },
  {
    title: 'Do colors vary slightly from images?',
    text: 'We style and photograph garments as accurately as possible. Minor variation can occur due to lighting and device display settings.',
  },
];

function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastOrder, setLastOrder] = useState<OrderRecord | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderRecord[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [quickAddSize, setQuickAddSize] = useState('M');
  const [quickAddQuantity, setQuickAddQuantity] = useState(1);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;

    try {
      const savedOrders = localStorage.getItem(ORDER_STORAGE_KEY);

      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders) as OrderRecord[];
        setOrderHistory(Array.isArray(parsedOrders) ? parsedOrders : []);
      }
    } catch {
      setOrderHistory([]);
    }

    const syncCloudOrders = async () => {
      const cloudOrders = await fetchCloudOrders<OrderRecord>();

      if (!mounted || !cloudOrders?.length) {
        return;
      }

      setOrderHistory(cloudOrders);
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(cloudOrders));
    };

    void syncCloudOrders();

    return () => {
      mounted = false;
    };
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const enrichedCart = useMemo(
    () =>
      cart
        .map((item) => ({
          ...item,
          product: products.find((product) => product.id === item.productId),
        }))
        .filter((item): item is CartItem & { product: Product } => Boolean(item.product)),
    [cart],
  );

  const subtotal = enrichedCart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const deliveryCharge = enrichedCart.length ? DELIVERY_CHARGE : 0;
  const total = subtotal + deliveryCharge;

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const haystack = [
        product.name,
        product.description,
        product.collection,
        product.color,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [searchTerm]);

  const addToCart = (productId: number, size: string, quantity = 1) => {
    setCart((current) => {
      const existing = current.find(
        (item) => item.productId === productId && item.size === size,
      );

      if (existing) {
        return current.map((item) =>
          item.productId === productId && item.size === size
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [...current, { productId, size, quantity }];
    });
  };

  const updateCartQuantity = (productId: number, size: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.productId === productId && item.size === size
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const toggleWishlist = (productId: number) => {
    setWishlist((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  };

  const openQuickAdd = (productId: number) => {
    const product = products.find((item) => item.id === productId);

    if (!product) {
      return;
    }

    setQuickAddProduct(product);
    setQuickAddSize(product.sizes[0] ?? 'M');
    setQuickAddQuantity(1);
  };

  const confirmQuickAdd = () => {
    if (!quickAddProduct) {
      return;
    }

    addToCart(quickAddProduct.id, quickAddSize, quickAddQuantity);
    setQuickAddProduct(null);
    navigate('/cart');
  };

  const closeQuickAdd = () => {
    setQuickAddProduct(null);
  };

  const handleCheckoutSubmit = async (form: CheckoutForm) => {
    const orderNumber = `UM-${Math.floor(100000 + Math.random() * 900000)}`;
    const order: OrderRecord = {
      ...form,
      orderNumber,
      placedAt: new Date().toISOString(),
      items: enrichedCart,
      total,
    };

    setLastOrder(order);
    setOrderHistory((current) => {
      const updatedOrders = [order, ...current];
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(updatedOrders));
      return updatedOrders;
    });
    void saveCloudOrder(order);
    setCart([]);
    navigate('/confirmation');
  };

  return (
    <div className="app-shell">
      <Header
        cartCount={cartCount}
        orderCount={orderHistory.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              wishlist={wishlist}
              onToggleWishlist={toggleWishlist}
              onAddToCart={addToCart}
              onQuickAdd={openQuickAdd}
            />
          }
        />
        <Route
          path="/shop"
          element={
            <ShopPage
              products={filteredProducts}
              wishlist={wishlist}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onToggleWishlist={toggleWishlist}
              onAddToCart={addToCart}
              onQuickAdd={openQuickAdd}
            />
          }
        />
        <Route
          path="/product/:slug"
          element={
            <ProductPage
              wishlist={wishlist}
              onToggleWishlist={toggleWishlist}
              onAddToCart={addToCart}
            />
          }
        />
        <Route
          path="/cart"
          element={
            <CartPage
              items={enrichedCart}
              subtotal={subtotal}
              deliveryCharge={deliveryCharge}
              total={total}
              onUpdateQuantity={updateCartQuantity}
            />
          }
        />
        <Route
          path="/checkout"
          element={
            <CheckoutPage
              items={enrichedCart}
              subtotal={subtotal}
              deliveryCharge={deliveryCharge}
              total={total}
              onSubmit={handleCheckoutSubmit}
            />
          }
        />
        <Route
          path="/confirmation"
          element={<ConfirmationPage order={lastOrder} />}
        />
        <Route
          path="/orders"
          element={<OrdersPage orders={orderHistory} cloudEnabled={isCloudOrdersEnabled} />}
        />
        <Route
          path="/about"
          element={
            <SimpleContentPage title="About ueman.studio" intro="A modern clothing label shaped around restraint, softness, and elevated everyday dressing.">
              <div className="value-grid">
                <article className="info-card fade-in">
                  <h3>Design Language</h3>
                  <p>
                    We focus on clean lines, tonal palettes, and silhouettes that feel polished without excess. Every piece is meant to feel considered, wearable, and quietly luxurious.
                  </p>
                </article>
                <article className="info-card fade-in stagger-1">
                  <h3>Material Story</h3>
                  <p>
                    Our collections lean into breathable fabrics, fluid structure, and tactile details that support both comfort and elevated presentation.
                  </p>
                </article>
                <article className="info-card fade-in stagger-2">
                  <h3>Brand Promise</h3>
                  <p>
                    ueman.studio is designed for women who prefer sophistication over noise, with a wardrobe that transitions effortlessly from everyday moments to intimate occasions.
                  </p>
                </article>
              </div>
            </SimpleContentPage>
          }
        />
        <Route
          path="/faq"
          element={
            <SimpleContentPage title="Frequently Asked Questions" intro="Everything you need to shop with confidence.">
              <div className="faq-grid">
                {faqItems.map((item, index) => (
                  <article key={item.title} className={`info-card fade-in stagger-${Math.min(index, 3)}`}>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>
            </SimpleContentPage>
          }
        />
        <Route
          path="/contact"
          element={
            <SimpleContentPage title="Contact" intro="We are available for product questions, order support, and sizing guidance.">
              <div className="contact-grid">
                <article className="info-card fade-in">
                  <h3>Studio Contact</h3>
                  <p>Email: uswaemaan877@gmail.com</p>
                  <p>Phone: 03441059787</p>
                  <p>Instagram: @ueman.studio</p>
                </article>
                <article className="info-card fade-in stagger-1">
                  <h3>Customer Care</h3>
                  <p>Monday to Saturday</p>
                  <p>11:00 AM to 7:00 PM</p>
                  <p>We respond to most messages within one business day.</p>
                </article>
                <article className="info-card fade-in stagger-2">
                  <h3>Shipping Region</h3>
                  <p>Pakistan-wide delivery available.</p>
                  <p>International delivery can be arranged on request through direct support.</p>
                </article>
              </div>
            </SimpleContentPage>
          }
        />
        <Route
          path="/privacy"
          element={
            <SimpleContentPage title="Privacy Policy" intro="Your trust matters. We collect only the information required to process orders and provide support.">
              <article className="content-card fade-in">
                <ul className="policy-list">
                  <li>Customer information is used only for order fulfillment, delivery coordination, and support communication.</li>
                  <li>Payment screenshots submitted for EasyPaisa verification are reviewed only for order confirmation purposes.</li>
                  <li>We do not sell or distribute customer data to third parties for marketing purposes.</li>
                  <li>By placing an order, you consent to being contacted regarding shipping updates and service support.</li>
                </ul>
              </article>
            </SimpleContentPage>
          }
        />
      </Routes>

      <Footer />

      {quickAddProduct && (
        <QuickAddModal
          product={quickAddProduct}
          selectedSize={quickAddSize}
          quantity={quickAddQuantity}
          onClose={closeQuickAdd}
          onSelectSize={setQuickAddSize}
          onDecreaseQuantity={() => setQuickAddQuantity((value) => Math.max(1, value - 1))}
          onIncreaseQuantity={() => setQuickAddQuantity((value) => value + 1)}
          onConfirm={confirmQuickAdd}
        />
      )}
    </div>
  );
}

function Header({
  cartCount,
  orderCount,
  searchTerm,
  onSearchChange,
  mobileOpen,
  setMobileOpen,
}: {
  cartCount: number;
  orderCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}) {
  const navigate = useNavigate();

  const handleSearchFocus = () => {
    navigate('/shop');
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand-mark" to="/">
          <img src="/assets/logo.jpg" alt="ueman.studio logo" />
          <div className="brand-copy">
            <strong>ueman.studio</strong>
            <span>By Uswa Eman</span>
          </div>
        </Link>

        <label className="search-shell" aria-label="Search products">
          <Search size={18} />
          <input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={handleSearchFocus}
            placeholder="Search silhouettes, colors, or collections"
          />
        </label>

        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/faq">FAQ</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>

        <div className="utility-links">
          <NavLink to="/privacy">Privacy</NavLink>
          <NavLink to="/orders">Orders ({orderCount})</NavLink>
          <NavLink to="/cart">Bag ({cartCount})</NavLink>
        </div>

        <button
          className="mobile-toggle"
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="container mobile-panel">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/orders">Orders ({orderCount})</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/faq">FAQ</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          <NavLink to="/privacy">Privacy Policy</NavLink>
          <NavLink to="/cart">Bag ({cartCount})</NavLink>
        </div>
      )}
    </header>
  );
}

function HomePage({
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onQuickAdd,
}: {
  wishlist: number[];
  onToggleWishlist: (productId: number) => void;
  onAddToCart: (productId: number, size: string, quantity?: number) => void;
  onQuickAdd: (productId: number) => void;
}) {
  const featured = products.filter((product) => product.featured);
  const bestSellers = products.filter((product) => product.bestSeller);

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy fade-in">
            <div className="eyebrow">Contemporary luxury wardrobe</div>
            <h1>ueman.studio</h1>
            <p>
              Soft neutrals, fluid tailoring, and thoughtful silhouettes for women who prefer elegance without excess.
            </p>
            <div className="hero-actions">
              <Link className="primary-button" to="/shop">
                Shop Now
              </Link>
              <Link className="secondary-button" to="/about">
                Discover the brand
              </Link>
            </div>
          </div>

          <div className="hero-visual fade-in stagger-1">
            <img src="/assets/product-2.jpeg" alt="Model wearing ueman.studio outfit" />
            <div className="hero-note">
              <strong>Premium day-to-evening dressing</strong>
              <p className="muted">Designed in a neutral palette with quiet confidence and effortless polish.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Featured collection</div>
              <h2>Curated for refined dressing</h2>
            </div>
            <p>Pieces selected for fluid shape, elevated texture, and a premium, modern finish.</p>
          </div>

          <div className="collection-grid">
            {featured.map((product, index) => (
              <article key={product.id} className={`soft-panel collection-tile fade-in stagger-${Math.min(index, 3)}`}>
                <img src={product.images[0]} alt={product.name} />
                <div className="tile-copy">
                  <div className="eyebrow">{product.collection}</div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <Link className="ghost-button" to={`/product/${product.slug}`}>
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Best sellers</div>
              <h2>Most loved right now</h2>
            </div>
            <Link className="ghost-button" to="/shop">
              View all products
            </Link>
          </div>

          <div className="product-grid">
            {bestSellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                liked={wishlist.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onQuickAdd={onQuickAdd}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Client notes</div>
              <h2>What customers are saying</h2>
            </div>
          </div>
          <div className="review-grid">
            {reviews.map((review, index) => (
              <article key={review.name} className={`review-card fade-in stagger-${Math.min(index, 3)}`}>
                <Star size={18} fill="currentColor" />
                <p>{review.text}</p>
                <h3>{review.name}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Instagram gallery</div>
              <h2>Styled in soft light</h2>
            </div>
            <a className="ghost-button" href="https://instagram.com" target="_blank" rel="noreferrer">
              Follow @ueman.studio
            </a>
          </div>
          <div className="instagram-grid">
            {['/assets/product-2.jpeg', '/assets/product-1.jpeg', '/assets/product-5.jpeg', '/assets/product-6.jpeg'].map(
              (image, index) => (
                <article key={image} className={`instagram-card fade-in stagger-${Math.min(index, 3)}`}>
                  <img src={image} alt="ueman.studio editorial moment" />
                  <span>@ueman.studio</span>
                </article>
              ),
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function ShopPage({
  products,
  wishlist,
  searchTerm,
  setSearchTerm,
  onToggleWishlist,
  onAddToCart,
  onQuickAdd,
}: {
  products: Product[];
  wishlist: number[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onToggleWishlist: (productId: number) => void;
  onAddToCart: (productId: number, size: string, quantity?: number) => void;
  onQuickAdd: (productId: number) => void;
}) {
  const [selectedCollection, setSelectedCollection] = useState<string>('All');

  const collectionOptions = ['All', ...new Set(products.map((product) => product.collection))];

  const visibleProducts = products.filter((product) => {
    const collectionMatch =
      selectedCollection === 'All' || product.collection === selectedCollection;

    return collectionMatch;
  });

  return (
    <main className="page-section page-hero">
      <div className="container page-stack">
        <div>
          <div className="eyebrow">Shop</div>
          <h1 className="page-title">Premium wardrobe essentials</h1>
          <p className="page-intro">
            Explore refined separates, occasionwear, and soft neutral edits designed for effortless sophistication.
          </p>
        </div>

        <div className="shop-toolbar">
          <div className="search-shell">
            <Search size={18} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search product names, colors, and collections"
            />
          </div>

          <div className="filter-panel">
            {collectionOptions.map((option) => (
              <button
                key={option}
                className={`filter-chip ${selectedCollection === option ? 'active' : ''}`}
                type="button"
                onClick={() => setSelectedCollection(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              liked={wishlist.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
              onAddToCart={onAddToCart}
              onQuickAdd={onQuickAdd}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function ProductPage({
  wishlist,
  onToggleWishlist,
  onAddToCart,
}: {
  wishlist: number[];
  onToggleWishlist: (productId: number) => void;
  onAddToCart: (productId: number, size: string, quantity?: number) => void;
}) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const product = getProductBySlug(slug);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSelectedImage(0);
    setSelectedSize('M');
    setQuantity(1);
  }, [slug]);

  if (!product) {
    return (
      <main className="page-section">
        <div className="container">
          <article className="content-card">
            <h1>Product not found</h1>
            <p>The requested item could not be located. Return to the shop to continue browsing.</p>
            <Link className="primary-button" to="/shop">
              Back to shop
            </Link>
          </article>
        </div>
      </main>
    );
  }

  const relatedProducts = products
    .filter((item) => item.id !== product.id && item.collection === product.collection)
    .slice(0, 3);

  return (
    <main className="page-section page-hero">
      <div className="container page-stack">
        <div className="product-layout">
          <div className="fade-in">
            <div className="gallery-main">
              <img src={product.images[selectedImage]} alt={product.name} />
            </div>
            <div className="gallery-strip">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={`gallery-thumb ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image} alt={`${product.name} view ${index + 1}`} />
                </button>
              ))}
            </div>
          </div>

          <article className="product-detail-panel fade-in stagger-1">
            <div className="eyebrow">{product.collection}</div>
            <div className="price-line">
              <h1 className="product-title">{product.name}</h1>
              <button
                className={`icon-button ${wishlist.includes(product.id) ? 'active' : ''}`}
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                aria-label="Toggle wishlist"
              >
                <Heart size={18} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="product-price">PKR {product.price.toLocaleString()}</div>
            <p className="product-description">{product.description}</p>

            <div className="product-meta">
              <div className="summary-row">
                <span>Color</span>
                <strong>{product.color}</strong>
              </div>
              <div className="summary-row">
                <span>Fabric</span>
                <strong>{product.fabric}</strong>
              </div>
            </div>

            <div className="eyebrow">Select size</div>
            <div className="eyebrow">Quantity</div>
            <div className="quantity-row">
              <div className="quantity-selector">
                <button
                  className="quantity-button"
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                >
                  -
                </button>
                <span>{quantity}</span>
                <button
                  className="quantity-button"
                  type="button"
                  onClick={() => setQuantity((value) => value + 1)}
                >
                  +
                </button>
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={() => addProductAndGoToCart(product.id, selectedSize, quantity, onAddToCart, navigate)}
              >
                Add to Cart
              </button>
            </div>

            <div className="page-stack">
              <div>
                <div className="eyebrow">Product details</div>
                <ul className="product-bullets">
                  {product.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="eyebrow">Size guide</div>
                <p className="muted">
                  XS fits petite frames, S and M offer a balanced classic fit, while L and XL provide relaxed ease through the torso and trouser line.
                </p>
              </div>
            </div>
          </article>
        </div>

        <section>
          <div className="section-heading">
            <div>
              <div className="eyebrow">Related products</div>
              <h2>Complete the wardrobe edit</h2>
            </div>
          </div>
          <div className="related-grid">
            {relatedProducts.map((related) => (
              <article key={related.id} className="related-card soft-panel fade-in">
                <img src={related.images[0]} alt={related.name} />
                <div>
                  <h3>{related.name}</h3>
                  <p>{related.description}</p>
                </div>
                <Link className="ghost-button" to={`/product/${related.slug}`}>
                  View product
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function CartPage({
  items,
  subtotal,
  deliveryCharge,
  total,
  onUpdateQuantity,
}: {
  items: Array<CartItem & { product: Product }>;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  onUpdateQuantity: (productId: number, size: string, delta: number) => void;
}) {
  if (!items.length) {
    return (
      <main className="page-section page-hero">
        <div className="container">
          <article className="content-card fade-in">
            <div className="eyebrow">Cart</div>
            <h1>Your cart is empty</h1>
            <p>Start with the shop page to add your favorite pieces.</p>
            <Link className="primary-button" to="/shop">
              Browse collection
            </Link>
          </article>
        </div>
      </main>
    );
  }

  return (
    <main className="page-section page-hero">
      <div className="container cart-layout">
        <section className="cart-items">
          {items.map((item) => (
            <article key={`${item.productId}-${item.size}`} className="cart-card fade-in">
              <div className="cart-item">
                <img src={item.product.images[0]} alt={item.product.name} />
                <div className="cart-copy">
                  <div className="eyebrow">{item.product.collection}</div>
                  <h3>{item.product.name}</h3>
                  <p>{item.product.description}</p>
                  <div className="cart-meta">
                    <span>Size: {item.size}</span>
                    <strong>PKR {item.product.price.toLocaleString()}</strong>
                  </div>
                  <div className="cart-meta">
                    <div className="cart-qty">
                      <button type="button" onClick={() => onUpdateQuantity(item.productId, item.size, -1)}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => onUpdateQuantity(item.productId, item.size, 1)}>
                        +
                      </button>
                    </div>
                    <strong>
                      PKR {(item.product.price * item.quantity).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="summary-box fade-in stagger-1">
          <h3>Order summary</h3>
          {items.map((item) => (
            <div key={`${item.productId}-${item.size}`} className="summary-row">
              <span>
                {item.product.name} x {item.quantity}
              </span>
              <strong>PKR {(item.product.price * item.quantity).toLocaleString()}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>Cart subtotal</span>
            <strong>PKR {subtotal.toLocaleString()}</strong>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <strong>PKR {deliveryCharge.toLocaleString()}</strong>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>PKR {total.toLocaleString()}</strong>
          </div>
          <Link className="primary-button" to="/checkout">
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </main>
  );
}

function CheckoutPage({
  items,
  subtotal,
  deliveryCharge,
  total,
  onSubmit,
}: {
  items: Array<CartItem & { product: Product }>;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  onSubmit: (form: CheckoutForm) => void;
}) {
  const [form, setForm] = useState<CheckoutForm>(defaultCheckoutForm);

  if (!items.length) {
    return (
      <main className="page-section page-hero">
        <div className="container">
          <article className="content-card fade-in">
            <h1>Checkout unavailable</h1>
            <p>Add an item to your cart before proceeding to checkout.</p>
            <Link className="primary-button" to="/shop">
              Continue shopping
            </Link>
          </article>
        </div>
      </main>
    );
  }

  const updateField = <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="page-section page-hero">
      <div className="container checkout-layout">
        <section className="checkout-card fade-in">
          <div className="eyebrow">Checkout</div>
          <h1 className="page-title">Complete your order</h1>
          <div className="page-stack">
            <div>
              <div className="eyebrow">Customer information</div>
              <div className="form-grid">
                <label className="field">
                  <span>Full Name</span>
                  <input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} />
                </label>
                <label className="field">
                  <span>Email Address</span>
                  <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
                </label>
                <label className="field field-full">
                  <span>Phone Number</span>
                  <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
                </label>
              </div>
            </div>

            <div>
              <div className="eyebrow">Shipping address</div>
              <div className="form-grid">
                <label className="field">
                  <span>House / Apartment Number</span>
                  <input value={form.apartment} onChange={(event) => updateField('apartment', event.target.value)} />
                </label>
                <label className="field">
                  <span>Street Address</span>
                  <input value={form.street} onChange={(event) => updateField('street', event.target.value)} />
                </label>
                <label className="field">
                  <span>City</span>
                  <input value={form.city} onChange={(event) => updateField('city', event.target.value)} />
                </label>
                <label className="field">
                  <span>Province / State</span>
                  <input value={form.state} onChange={(event) => updateField('state', event.target.value)} />
                </label>
                <label className="field">
                  <span>Postal Code</span>
                  <input value={form.postalCode} onChange={(event) => updateField('postalCode', event.target.value)} />
                </label>
                <label className="field">
                  <span>Country</span>
                  <input value={form.country} onChange={(event) => updateField('country', event.target.value)} />
                </label>
              </div>
            </div>

            <div>
              <div className="eyebrow">Payment options</div>
              <div className="notice-box payment-note">
                <strong>Online payment reminder</strong>
                <p>
                  If you choose EasyPaisa or Bank Transfer, please share your payment screenshot in DM after placing the order.
                </p>
              </div>
              <div className="payment-group">
                {(['COD', 'EasyPaisa', 'Bank Transfer'] as CheckoutForm['paymentMethod'][]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={`payment-choice ${form.paymentMethod === method ? 'active' : ''}`}
                    onClick={() => updateField('paymentMethod', method)}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {form.paymentMethod === 'EasyPaisa' && (
                <div className="page-stack">
                  <div className="notice-box">
                    <strong>EasyPaisa details</strong>
                    <p>Account title: ueman.studio</p>
                    <p>Account number: 0300-1234567</p>
                    <p>Transfer the total amount and upload your payment screenshot below.</p>
                  </div>
                  <label className="upload-box">
                    <span>Upload payment screenshot</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        updateField(
                          'paymentScreenshot',
                          event.target.files?.[0]?.name ?? '',
                        )
                      }
                    />
                    {form.paymentScreenshot && <span>{form.paymentScreenshot}</span>}
                  </label>
                </div>
              )}
            </div>

            <button className="primary-button" type="button" onClick={() => onSubmit(form)}>
              Place order
            </button>
          </div>
        </section>

        <aside className="summary-box fade-in stagger-1">
          <h3>Order Summary</h3>
          {items.map((item) => (
            <div key={`${item.productId}-${item.size}`} className="summary-row">
              <span>
                {item.product.name} x {item.quantity}
              </span>
              <strong>PKR {(item.product.price * item.quantity).toLocaleString()}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>Total Amount</span>
            <strong>PKR {subtotal.toLocaleString()}</strong>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <strong>PKR {deliveryCharge.toLocaleString()}</strong>
          </div>
          <div className="summary-total">
            <span>Grand Total</span>
            <strong>PKR {total.toLocaleString()}</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}

function ConfirmationPage({ order }: { order: OrderRecord | null }) {
  if (!order) {
    return (
      <main className="page-section page-hero">
        <div className="container">
          <article className="content-card fade-in">
            <h1>No recent order</h1>
            <p>Your confirmation details will appear here after checkout.</p>
            <Link className="primary-button" to="/shop">
              Return to shop
            </Link>
          </article>
        </div>
      </main>
    );
  }

  return (
    <main className="page-section page-hero">
      <div className="container">
        <article className="content-card confirmation-hero fade-in">
          <div className="eyebrow">Thank you</div>
          <h1>Order confirmed</h1>
          <p>
            Thank you, {order.fullName}. Your order has been received and our team will contact you with shipping updates shortly.
          </p>
          <div className="page-stack">
            <div className="summary-row">
              <span>Order Number</span>
              <strong>{order.orderNumber}</strong>
            </div>
            <div className="summary-row">
              <span>Payment Method</span>
              <strong>{order.paymentMethod}</strong>
            </div>
            {order.items.map((item) => (
              <div key={`${item.productId}-${item.size}`} className="summary-row">
                <span>
                  {item.product.name} x {item.quantity}
                </span>
                <strong>PKR {(item.product.price * item.quantity).toLocaleString()}</strong>
              </div>
            ))}
            <div className="summary-total">
              <span>Total</span>
              <strong>PKR {order.total.toLocaleString()}</strong>
            </div>
          {order.paymentMethod !== 'COD' && (
            <div className="notice-box payment-note">
              <strong>Payment screenshot</strong>
              <p>
                If you paid online, please share the screenshot in DM for verification.
                {order.paymentScreenshot ? ` Uploaded file: ${order.paymentScreenshot}.` : ''}
              </p>
            </div>
          )}
          </div>
        </article>
      </div>
    </main>
  );
}

function OrdersPage({
  orders,
  cloudEnabled,
}: {
  orders: OrderRecord[];
  cloudEnabled: boolean;
}) {
  if (!orders.length) {
    return (
      <main className="page-section page-hero">
        <div className="container">
          <article className="content-card fade-in">
            <div className="eyebrow">Orders</div>
            <h1>No orders yet</h1>
            <p>Placed orders from this device will appear here.</p>
            <p className="muted">
              {cloudEnabled
                ? 'Cloud sync is enabled. New orders will be visible across devices.'
                : 'Cloud sync is not configured yet. Orders are currently stored on this device only.'}
            </p>
            <Link className="primary-button" to="/shop">
              Start shopping
            </Link>
          </article>
        </div>
      </main>
    );
  }

  return (
    <main className="page-section page-hero">
      <div className="container page-stack">
        <article className="content-card fade-in">
          <div className="eyebrow">Orders</div>
          <h1>Placed orders</h1>
          <p>
            {cloudEnabled
              ? 'Order history is synced from cloud storage.'
              : 'Order history is visible on this device. Add Supabase keys to enable cross-device sync.'}
          </p>
        </article>

        {orders.map((order) => (
          <article key={order.orderNumber} className="content-card fade-in">
            <div className="summary-row">
              <span>Order Number</span>
              <strong>{order.orderNumber}</strong>
            </div>
            <div className="summary-row">
              <span>Placed At</span>
              <strong>{new Date(order.placedAt).toLocaleString()}</strong>
            </div>
            <div className="summary-row">
              <span>Customer</span>
              <strong>{order.fullName}</strong>
            </div>
            <div className="summary-row">
              <span>Payment Method</span>
              <strong>{order.paymentMethod}</strong>
            </div>
            {order.items.map((item) => (
              <div key={`${order.orderNumber}-${item.productId}-${item.size}`} className="summary-row">
                <span>
                  {item.product.name} ({item.size}) x {item.quantity}
                </span>
                <strong>PKR {(item.product.price * item.quantity).toLocaleString()}</strong>
              </div>
            ))}
            <div className="summary-total">
              <span>Total</span>
              <strong>PKR {order.total.toLocaleString()}</strong>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function SimpleContentPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="page-section page-hero">
      <div className="container page-stack">
        <article className="content-card fade-in">
          <div className="eyebrow">ueman.studio</div>
          <h1>{title}</h1>
          <p>{intro}</p>
        </article>
        {children}
      </div>
    </main>
  );
}

function ProductCard({
  product,
  liked,
  onToggleWishlist,
  onAddToCart,
  onQuickAdd,
}: {
  product: Product;
  liked: boolean;
  onToggleWishlist: (productId: number) => void;
  onAddToCart: (productId: number, size: string, quantity?: number) => void;
  onQuickAdd: (productId: number) => void;
}) {
  return (
    <article className="product-card fade-in">
      <div className="product-card-media">
        <span className="product-tag">{product.collection}</span>
        <button
          className={`icon-button product-like ${liked ? 'active' : ''}`}
          type="button"
          onClick={() => onToggleWishlist(product.id)}
          aria-label="Toggle wishlist"
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
        </button>
        <Link to={`/product/${product.slug}`}>
          <img src={product.images[0]} alt={product.name} />
        </Link>
      </div>
      <div className="product-copy">
        <div className="price-line">
          <h3>{product.name}</h3>
          <strong>PKR {product.price.toLocaleString()}</strong>
        </div>
        <p>{product.description}</p>
        <div className="size-row">
          {product.sizes.map((size) => (
            <span key={size} className="size-pill">
              {size}
            </span>
          ))}
        </div>
        <div className="product-actions">
          <button className="primary-button" type="button" onClick={() => onQuickAdd(product.id)}>
            Quick Add
          </button>
          <Link className="secondary-button" to={`/product/${product.slug}`}>
            View
          </Link>
        </div>
      </div>
    </article>
  );
}

function QuickAddModal({
  product,
  selectedSize,
  quantity,
  onClose,
  onSelectSize,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onConfirm,
}: {
  product: Product;
  selectedSize: string;
  quantity: number;
  onClose: () => void;
  onSelectSize: (size: string) => void;
  onDecreaseQuantity: () => void;
  onIncreaseQuantity: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <article className="modal-card" role="dialog" aria-modal="true" aria-label="Select size and add to cart" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close size picker">
          ×
        </button>
        <img src={product.images[0]} alt={product.name} className="modal-image" />
        <div className="page-stack">
          <div>
            <div className="eyebrow">Select size</div>
            <h3>{product.name}</h3>
            <p className="muted">Choose a size before adding this item to your cart.</p>
          </div>
          <div className="size-row">
            {product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                className={`size-pill ${selectedSize === size ? 'active' : ''}`}
                onClick={() => onSelectSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
          <div className="quantity-row">
            <div className="quantity-selector">
              <button className="quantity-button" type="button" onClick={onDecreaseQuantity}>
                -
              </button>
              <span>{quantity}</span>
              <button className="quantity-button" type="button" onClick={onIncreaseQuantity}>
                +
              </button>
            </div>
            <button className="primary-button" type="button" onClick={onConfirm}>
              Add and go to cart
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-card">
        <div className="footer-grid">
          <div>
            <div className="brand-wordmark">ueman.studio</div>
            <p>Premium contemporary clothing designed in soft neutrals for elevated daily and occasion dressing.</p>
          </div>
          <div>
            <div className="eyebrow">Contact</div>
            <p>
              <Mail size={16} /> uswaemaan877@gmail.com
            </p>
            <p>
              <Phone size={16} /> 03441059787
            </p>
            <p>
              @ueman.studio
            </p>
          </div>
          <div>
            <div className="eyebrow">Services</div>
            <p>
              <Truck size={16} /> Nationwide delivery
            </p>
            <p>
              <ShoppingBag size={16} /> Secure checkout flow
            </p>
            <p>Cash on Delivery, EasyPaisa, and Bank Transfer available.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function addProductAndGoToCart(
  productId: number,
  size: string,
  quantity: number,
  onAddToCart: (productId: number, size: string, quantity?: number) => void,
  navigate: ReturnType<typeof useNavigate>,
) {
  onAddToCart(productId, size, quantity);
  navigate('/cart');
}

export default App;
