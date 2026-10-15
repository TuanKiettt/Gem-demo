import type { RegistrationData } from "../lib/registration";

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL as string | undefined;
const TIMEOUT_MS = 10000;

interface SheetResponse {
  success: boolean;
  message?: string;
}

export async function sendToGoogleSheet(data: RegistrationData): Promise<void> {
  if (!SCRIPT_URL) {
    throw new Error("! VITE_GOOGLE_SCRIPT_URL.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // Gửi dữ liệu user input lên Google Sheet qua Webhook
  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        gender: data.gender,
        experienceTime: data.experienceTime,
      }),
    });

    if (!response.ok) {
      throw new Error(`sheet ${response.status}.`);
    }

    const result = (await response.json()) as SheetResponse;
    if (!result.success) {
      throw new Error(result.message || "Tải lên shêt thất bại.");
    }
  } finally {
    clearTimeout(timer);
  }
}
