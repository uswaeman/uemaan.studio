import { isSupabaseEnabled, supabase } from './supabaseClient';

type CloudOrderRow = {
  payload: unknown;
};

export const isCloudOrdersEnabled = isSupabaseEnabled;

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
