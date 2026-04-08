import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing in .env!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit'  // 關鍵點：改為隱含式流程，避開 4/0A 換碼錯誤
  }
});

// 資料庫操作常數
export enum OperationType {
  GET = 'GET',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

// 錯誤處理工具
export const handleSupabaseError = (error: any, operation: OperationType, path: string) => {
  console.error(`Supabase ${operation} Error at ${path}:`, error.message || error);
  // 可根據需求加入通知邏輯
};
