/**
 * Downloads an image from an external URL and uploads it to Supabase Storage.
 * This is meant to be called from the server to bypass CORS issues.
 */
export async function transferImageToStorage(url: string, bucket: string = "artwork-previews", folder: string = "imported"): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const blob = await response.blob();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    
    // Try to determine extension from URL or content type
    let ext = "jpg";
    if (url.includes(".")) {
      const urlExt = url.split(".").pop()?.split(/[#?]/)[0].toLowerCase();
      if (urlExt && ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(urlExt)) {
        ext = urlExt;
      }
    } else if (contentType.includes("/")) {
      const typeExt = contentType.split("/")[1];
      if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(typeExt)) {
        ext = typeExt === "jpeg" ? "jpg" : typeExt;
      }
    }

    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `${folder}/${fileName}`;

    // Using supabaseAdmin to bypass RLS for this operation
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType,
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error("Error transferring image:", error);
    throw error;
  }
}
