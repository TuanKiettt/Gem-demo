export type Gender = "NAM" | "NỮ";

export interface RegistrationData {
  fullName: string;
  phone: string;
  email: string;
  gender: Gender;
  experienceTime: string;
}

const REGISTRATION_STORAGE_KEY = "gem-demo.registration.v1";

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  return /^84\d{9}$/.test(digits) ? `0${digits.slice(2)}` : digits;
}

export function isValidPhone(phone: string): boolean {
  return /^0\d{9}$/.test(phone);
}

export function saveRegistrationData(data: RegistrationData): void {
  localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(data));
}

export function readRegistrationData(): RegistrationData | null {
  const stored = localStorage.getItem(REGISTRATION_STORAGE_KEY);
  if (!stored) return null;

  try {
    const value: unknown = JSON.parse(stored);
    if (
      typeof value === "object" &&
      value !== null &&
      "fullName" in value &&
      typeof value.fullName === "string" &&
      "phone" in value &&
      typeof value.phone === "string" &&
      "email" in value &&
      typeof value.email === "string" &&
      "gender" in value &&
      (value.gender === "NAM" || value.gender === "NỮ") &&
      "experienceTime" in value &&
      typeof value.experienceTime === "string"
    ) {
      return {
        fullName: value.fullName,
        phone: value.phone,
        email: value.email,
        gender: value.gender,
        experienceTime: value.experienceTime,
      };
    }
  } catch (error) {
    console.error("Không thể đọc thông tin đăng ký đã lưu:", error);
    throw new Error(
      "Không thể đọc thông tin đăng ký đã lưu trên trình duyệt.",
      { cause: error },
    );
  }

  throw new Error("Thông tin đăng ký đã lưu trên trình duyệt không hợp lệ.");
}
