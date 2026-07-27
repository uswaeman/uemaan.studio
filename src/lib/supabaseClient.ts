import { createClient } from '@supabase/supabase-js';

type RuntimeConfig = {
  url: string;
  anonKey: string;
  adminEmails: string;
};

type EnvShape = Record<string, string | undefined>;

const env = import.meta.env as unknown as EnvShape;

const readRuntimeConfig = (): RuntimeConfig => {
  if (typeof window === 'undefined') {
    return {
      url: '',
      anonKey: '',
      adminEmails: '',
    };
  }

  return {
    url: window.localStorage.getItem('ueman.supabaseUrl') ?? '',
    anonKey: window.localStorage.getItem('ueman.supabaseAnonKey') ?? '',
    adminEmails: window.localStorage.getItem('ueman.adminEmails') ?? '',
  };
};

const runtimeConfig = readRuntimeConfig();

const pickEnv = (...keys: string[]) => keys.map((key) => env[key]?.trim()).find(Boolean) ?? '';

const normalizeSupabaseUrl = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch {
    return '';
  }
};

const supabaseUrl = normalizeSupabaseUrl(
  pickEnv('VITE_SUPABASE_URL', 'SUPABASE_URL') || runtimeConfig.url,
);
const supabaseAnonKey = pickEnv(
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY',
) || runtimeConfig.anonKey;
const adminEmailList =
  pickEnv('VITE_ADMIN_EMAILS', 'ADMIN_EMAILS') || runtimeConfig.adminEmails || '';

export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const adminEmails = adminEmailList
  .split(',')
  .map((value: string) => value.trim().toLowerCase())
  .filter(Boolean);

export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isAllowedAdminEmail = (email?: string | null) => {
  if (!email) {
    return false;
  }

  return adminEmails.includes(email.trim().toLowerCase());
};