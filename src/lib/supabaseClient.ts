import { createClient } from '@supabase/supabase-js';

const readRuntimeConfig = () => {
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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || runtimeConfig.url;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || runtimeConfig.anonKey;
const adminEmailList = import.meta.env.VITE_ADMIN_EMAILS || runtimeConfig.adminEmails || '';

export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const adminEmails = adminEmailList
  .split(',')
  .map((value: string) => value.trim().toLowerCase())
  .filter(Boolean);

export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export const isAllowedAdminEmail = (email?: string | null) => {
  if (!email) {
    return false;
  }

  return adminEmails.includes(email.trim().toLowerCase());
};