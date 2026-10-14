import { supabaseAdmin } from "@/lib/supabase";

export async function createSignedUploadUrl(path: string) {
  const { data, error } = await supabaseAdmin.storage
    .from("manuscripts")
    .createSignedUploadUrl(path);

  if (error) {
    throw new Error(`Gagal buat signed URL: ${error.message}`);
  }

  return data;
}