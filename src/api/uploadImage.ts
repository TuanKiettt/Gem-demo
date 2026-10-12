import { supabase } from "../lib/supabase";

interface UploadTarget {
  upload_url: string;
  url: string;
}

const isUploadTarget = (value: unknown): value is UploadTarget =>
  typeof value === "object" &&
  value !== null &&
  "upload_url" in value &&
  typeof value.upload_url === "string" &&
  "url" in value &&
  typeof value.url === "string";

export async function uploadImage(file: File): Promise<string> {
  const { data, error } = await supabase.functions.invoke<unknown>(
    "private/create_upload_url",
    { body: { content_type: file.type } },
  );

  if (error) {
    throw new Error(`Không thể tạo URL tải ảnh lên: ${error.message}`);
  }
  if (!isUploadTarget(data)) {
    throw new Error("API tải ảnh lên không trả về URL hợp lệ.");
  }

  const response = await fetch(data.upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Không thể tải ảnh lên Storage (${response.status}): ${details || response.statusText}`,
    );
  }

  return data.url;
}
