import { z } from "zod";
import { normalizePhone } from "../lib/registration";

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự.")
    .max(100, "Họ tên chỉ được tối đa 100 ký tự.")
    .regex(
      /^[a-zA-ZÀ-ỹĂăĐđÊêÎîÔôƠơƯư\s]+$/,
      "Họ tên không được chứa số hoặc ký tự đặc biệt.",
    ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Email không hợp lệ.")),
  phone: z
    .string()
    .transform(normalizePhone)
    .pipe(z.string().regex(/^0\d{9}$/, "Số điện thoại không hợp lệ (ví dụ: 0912345678).")),
  gender: z.enum(["NAM", "NỮ"], {
    error: "Vui lòng chọn giới tính.",
  }),
  experienceTime: z.enum(
    ["09:00 - 11:30", "11:30 - 13:30", "13:30 - 16:00"],
    { error: "Vui lòng chọn khung giờ trải nghiệm." },
  ),
});

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export type RegisterFormInput = z.input<typeof registerSchema>;
export type RegisterFormData = z.output<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
