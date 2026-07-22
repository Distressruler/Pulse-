import { supabase } from "@/lib/supabase";

const VOICE_BUCKET = "voice-messages";
const IMAGE_BUCKET = "message-images";

function createFileName(
  conversationId: string,
  extension: string
) {
  return `${conversationId}/${crypto.randomUUID()}.${extension}`;
}

export async function uploadVoiceMessage(
  conversationId: string,
  audioBlob: Blob
): Promise<string> {
  const path = createFileName(conversationId, "webm");

  const { error } = await supabase.storage
    .from(VOICE_BUCKET)
    .upload(path, audioBlob, {
      cacheControl: "3600",
      upsert: false,
      contentType: "audio/webm",
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from(VOICE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function uploadMessageImage(
  conversationId: string,
  file: File
): Promise<string> {
  const extension =
    file.name.split(".").pop() ?? "jpg";

  const path = createFileName(
    conversationId,
    extension
  );

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from(IMAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}