import { products as seedProducts } from '../data/products';
import type {
  AdminSession,
  ManagedProduct,
  OrderRecord,
  OrderStatus,
  ProductDraft,
} from './storeTypes';
import { isAllowedAdminEmail, isSupabaseEnabled, supabase } from './supabaseClient';

type PayloadRow<T> = {
  payload: T;
};

const PRODUCT_STORAGE_KEY = 'ueman.adminProducts';
const ORDER_STATUS_DEFAULT: OrderStatus = 'Pending';

export const isAdminAuthEnabled = isSupabaseEnabled;
export const isCloudProductAdminEnabled = isSupabaseEnabled;

const normalizeOrderStatus = (order: OrderRecord): OrderRecord => ({
  ...order,
  status: order.status ?? ORDER_STATUS_DEFAULT,
});

const readLocalProducts = (): ManagedProduct[] => {
  try {
    const stored = localStorage.getItem(PRODUCT_STORAGE_KEY);

    if (!stored) {
      return [...seedProducts];
    }

    const parsed = JSON.parse(stored) as ManagedProduct[];
    return Array.isArray(parsed) && parsed.length ? parsed : [...seedProducts];
  } catch {
    return [...seedProducts];
  }
};

const writeLocalProducts = (catalog: ManagedProduct[]) => {
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(catalog));
};

export const getNextProductId = (catalog: ManagedProduct[]) =>
  catalog.reduce((highest, product) => Math.max(highest, product.id), 0) + 1;

export const slugifyProductName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const fetchAdminSession = async (): Promise<AdminSession | null> => {
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  const email = data.session?.user.email?.toLowerCase();

  if (!email || !isAllowedAdminEmail(email)) {
    return null;
  }

  return { email };
};

export const signInAdmin = async (email: string, password: string) => {
  if (!supabase) {
    return { success: false, message: 'Supabase admin auth is not configured yet.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, message: error.message };
  }

  const signedInEmail = data.user?.email?.toLowerCase();

  if (!signedInEmail || !isAllowedAdminEmail(signedInEmail)) {
    await supabase.auth.signOut();
    return {
      success: false,
      message: 'This account is not allowed to access the admin panel.',
    };
  }

  return { success: true, message: '', session: { email: signedInEmail } satisfies AdminSession };
};

export const requestAdminPasswordReset = async (email: string) => {
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase admin auth is not configured yet.',
    };
  }

  const redirectTo = `${window.location.origin}/admin/recover`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: 'Password reset email sent. Use the link in your inbox to set a new password.',
  };
};

export const updateAdminPassword = async (password: string) => {
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase admin auth is not configured yet.',
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: 'Password updated successfully. You can now sign in with the new password.',
  };
};

export const signOutAdmin = async () => {
  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
};

export const subscribeToAdminSession = (callback: (session: AdminSession | null) => void) => {
  if (!supabase) {
    return () => undefined;
  }

  const subscription = supabase.auth.onAuthStateChange((_event, session) => {
    const email = session?.user.email?.toLowerCase();
    callback(email && isAllowedAdminEmail(email) ? { email } : null);
  });

  return () => {
    subscription.data.subscription.unsubscribe();
  };
};

export const fetchManagedProducts = async (): Promise<ManagedProduct[]> => {
  if (!supabase) {
    return readLocalProducts();
  }

  const { data, error } = await supabase
    .from('products')
    .select('payload')
    .order('created_at', { ascending: true });

  if (error) {
    return readLocalProducts();
  }

  const catalog = (data as PayloadRow<ManagedProduct>[])
    .map((row) => row.payload)
    .filter(Boolean);

  if (!catalog.length) {
    const localCatalog = readLocalProducts();
    return localCatalog;
  }

  writeLocalProducts(catalog);
  return catalog;
};

export const saveManagedProduct = async (product: ManagedProduct) => {
  const localCatalog = readLocalProducts();
  const updatedCatalog = localCatalog.some((item) => item.slug === product.slug)
    ? localCatalog.map((item) => (item.slug === product.slug ? product : item))
    : [...localCatalog, product];

  writeLocalProducts(updatedCatalog);

  if (!supabase) {
    return true;
  }

  const { error } = await supabase
    .from('products')
    .upsert(
      {
        slug: product.slug,
        payload: product,
      },
      { onConflict: 'slug' },
    );

  return !error;
};

export const deleteManagedProduct = async (slug: string) => {
  const updatedCatalog = readLocalProducts().filter((product) => product.slug !== slug);
  writeLocalProducts(updatedCatalog);

  if (!supabase) {
    return true;
  }

  const { error } = await supabase.from('products').delete().eq('slug', slug);
  return !error;
};

export const uploadProductImages = async (slug: string, files: File[]) => {
  if (!files.length) {
    return [] as string[];
  }

  if (!supabase) {
    const results = await Promise.all(files.map(readFileAsDataUrl));
    return results;
  }

  const uploadedUrls: string[] = [];

  for (const file of files) {
    const extension = file.name.split('.').pop() ?? 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const filePath = `products/${slug}/${fileName}`;
    const { error } = await supabase.storage.from('product-images').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (!error) {
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      uploadedUrls.push(data.publicUrl);
    }
  }

  return uploadedUrls;
};

export const buildManagedProduct = (draft: ProductDraft, catalog: ManagedProduct[]): ManagedProduct => {
  const normalizedSlug = slugifyProductName(draft.slug || draft.name);

  return {
    id: draft.id ?? getNextProductId(catalog),
    slug: normalizedSlug,
    name: draft.name.trim(),
    price: Number(draft.price),
    description: draft.description.trim(),
    details: draft.details.filter(Boolean),
    fabric: draft.fabric.trim(),
    sizes: draft.sizes.length ? draft.sizes : ['XS', 'S', 'M', 'L', 'XL'],
    color: draft.color.trim(),
    collection: draft.collection.trim(),
    images: draft.images.filter(Boolean),
    featured: Boolean(draft.featured),
    bestSeller: Boolean(draft.bestSeller),
  };
};

export const updateOrderStatus = async (order: OrderRecord, status: OrderStatus) => {
  const nextOrder = normalizeOrderStatus({ ...order, status });

  if (!supabase) {
    return nextOrder;
  }

  const { error } = await supabase
    .from('orders')
    .upsert(
      {
        order_number: nextOrder.orderNumber,
        payload: nextOrder,
      },
      { onConflict: 'order_number' },
    );

  return error ? null : nextOrder;
};

export const normalizeOrders = (orders: OrderRecord[]) => orders.map(normalizeOrderStatus);

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });