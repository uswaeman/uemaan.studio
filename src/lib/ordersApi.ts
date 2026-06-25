import { createClient } from '@supabase/supabase-js';

type CloudOrderRow = {
  payload: unknown;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isCloudOrdersEnabled = Boolean(supabaseUrl && supabaseAnonKey);

const supabase = isCloudOrdersEnabled
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export const fetchCloudOrders = async <T>(): Promise<T[] | null> => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('orders')
    .select('payload')
    .order('created_at', { ascending: false });

  if (error) {
    return null;
  }

  return (data as CloudOrderRow[])
    .map((row) => row.payload)
    .filter(Boolean) as T[];
};

export const saveCloudOrder = async <T extends { orderNumber: string }>(order: T) => {
  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from('orders')
    .upsert(
      {
        order_number: order.orderNumber,
        payload: order,
      },
      { onConflict: 'order_number' },
    );

  return !error;
};
