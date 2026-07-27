import { createClient } from '@supabase/supabase-js';

type RuntimeConfig = {
  url: string;
  anonKey: string;
  adminEmails: string;
};

type ResolvedConfigValue = {
  value: string;
  source: string;
};

export type SupabaseConfigStatus = {
  enabled: boolean;
  url: {
    loaded: boolean;
    valid: boolean;
    source: string;
  };
  anonKey: {
    loaded: boolean;
    source: string;
  };
  adminEmails: {
    loaded: boolean;
    source: string;
  };
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

const pickEnv = (...keys: string[]): ResolvedConfigValue => {
  for (const key of keys) {
    const value = env[key]?.trim();

    if (value) {
      return { value, source: `env:${key}` };
    }
  }

  return { value: '', source: 'missing' };
};

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

const resolvedUrl = pickEnv('VITE_SUPABASE_URL', 'SUPABASE_URL');
const resolvedAnonKey = pickEnv(
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY',
);
const resolvedAdminEmails = pickEnv('VITE_ADMIN_EMAILS', 'ADMIN_EMAILS');

const runtimeUrl = runtimeConfig.url
  ? { value: runtimeConfig.url, source: 'localStorage:ueman.supabaseUrl' }
  : { value: '', source: 'missing' };
const runtimeAnonKey = runtimeConfig.anonKey
  ? { value: runtimeConfig.anonKey, source: 'localStorage:ueman.supabaseAnonKey' }
  : { value: '', source: 'missing' };
const runtimeAdminEmails = runtimeConfig.adminEmails
  ? { value: runtimeConfig.adminEmails, source: 'localStorage:ueman.adminEmails' }
  : { value: '', source: 'missing' };

const chosenUrl = resolvedUrl.value || runtimeUrl.value;
const chosenAnonKey = resolvedAnonKey.value || runtimeAnonKey.value;
const chosenAdminEmails = resolvedAdminEmails.value || runtimeAdminEmails.value;

const supabaseUrl = normalizeSupabaseUrl(chosenUrl);
const supabaseAnonKey = chosenAnonKey;
const adminEmailList = chosenAdminEmails;

export const supabaseConfigStatus: SupabaseConfigStatus = {
  enabled: Boolean(supabaseUrl && supabaseAnonKey),
  url: {
    loaded: Boolean(chosenUrl),
    valid: Boolean(supabaseUrl),
    source: resolvedUrl.value ? resolvedUrl.source : runtimeUrl.source,
  },
  anonKey: {
    loaded: Boolean(chosenAnonKey),
    source: resolvedAnonKey.value ? resolvedAnonKey.source : runtimeAnonKey.source,
  },
  adminEmails: {
    loaded: Boolean(adminEmailList),
    source: resolvedAdminEmails.value ? resolvedAdminEmails.source : runtimeAdminEmails.source,
  },
};

export const isSupabaseEnabled = supabaseConfigStatus.enabled;

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