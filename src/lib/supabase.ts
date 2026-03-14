import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET = "pitch-decks";

/**
 * Upload a file directly to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadDeckFile(
  projectId: string,
  file: File
): Promise<string> {
  // Sanitize filename: keep extension, replace spaces
  const safeName = file.name.replace(/\s+/g, "_");
  const path = `${projectId}/${safeName}`;

  // Upsert so re-uploads replace the old file
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteDeckFile(
  projectId: string,
  fileName: string
): Promise<void> {
  const safeName = fileName.replace(/\s+/g, "_");
  const path = `${projectId}/${safeName}`;

  await supabase.storage.from(BUCKET).remove([path]);
}
