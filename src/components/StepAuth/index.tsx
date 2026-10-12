import { useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";
import {
  isValidPhone,
  normalizePhone,
  saveRegistrationData,
  type Gender,
  type RegistrationData,
} from "../../lib/registration";

interface SignupAvailability {
  email_taken: boolean;
  phone_taken: boolean;
}

const isSignupAvailability = (value: unknown): value is SignupAvailability =>
  typeof value === "object" &&
  value !== null &&
  "email_taken" in value &&
  typeof value.email_taken === "boolean" &&
  "phone_taken" in value &&
  typeof value.phone_taken === "boolean";

interface StepAuthProps {
  btnClass?: string;
  onNext: () => void;
}

export function StepAuth({ onNext }: StepAuthProps) {
  const [gender, setGender] = useState<Gender | "">("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = normalizePhone(String(formData.get("phone") ?? ""));
    const email = String(formData.get("email") ?? "").trim().toLowerCase();

    if (!gender || !time) {
      setError("Vui lòng chọn giới tính và khung giờ trải nghiệm.");
      return;
    }
    if (!fullName) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }
    if (!isValidPhone(phone)) {
      setError("Số điện thoại không hợp lệ (ví dụ: 0912345678).");
      return;
    }

    setLoading(true);
    try {
      const { data: availabilityData, error: availabilityError } = await supabase
        .rpc("check_signup_available", { p_email: email, p_phone: phone })
        .single();

      if (availabilityError) throw availabilityError;
      if (!isSignupAvailability(availabilityData)) {
        throw new Error("Không nhận được kết quả kiểm tra thông tin đăng ký.");
      }

      const taken: string[] = [];
      if (availabilityData.email_taken) taken.push("Email đã được sử dụng");
      if (availabilityData.phone_taken) {
        taken.push("Số điện thoại đã được sử dụng");
      }
      if (taken.length) {
        setError(`${taken.join(". ")}. Vui lòng kiểm tra lại.`);
        return;
      }

      const password = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      const registration: RegistrationData = {
        fullName,
        phone,
        email,
        gender,
        experienceTime: time,
      };

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            gender,
            experience_time: time,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("Database error saving new user")) {
          throw new Error("Email hoặc số điện thoại đã được sử dụng.");
        }
        throw signUpError;
      }
      if (data.user?.identities?.length === 0) {
        throw new Error("Email đã được sử dụng. Vui lòng kiểm tra lại.");
      }
      if (!data.user) {
        throw new Error("Supabase không trả về tài khoản sau khi đăng ký.");
      }

      if (!data.session) {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          throw new Error(
            "Tài khoản đã được tạo nhưng chưa thể đăng nhập tự động. Hãy tắt yêu cầu xác nhận email trong Supabase Auth rồi thử lại.",
          );
        }
      }

      saveRegistrationData(registration);
      onNext();
    } catch (registrationError) {
      console.error("Không thể đăng ký người tham dự:", registrationError);
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "Không thể đăng ký. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `
    h-12 w-full rounded-xl border border-[#8D705E]/80
    bg-[#111B36]/95 px-3 text-sm text-white
    placeholder:text-[#B5BDD0]
    outline-none transition
    focus:border-[#DEBD99]
    focus:ring-1 focus:ring-[#DEBD99]/40
  `;

  const labelClass =
    "mb-2 block text-left text-xs font-bold tracking-wide text-[#DEBD99]";

  const optionClass = (active: boolean) =>
    `min-h-10 rounded-xl border px-5 py-2 text-xs font-bold
    transition-colors duration-200
    ${
      active
        ? "border-[#F0CDA7] bg-[#B98A66]/30 text-[#FFE4C8]"
        : "border-[#B98A66] bg-[#111B36]/70 text-white hover:bg-white/10"
    }`;

  return (
    <main
      className="
        relative isolate min-h-dvh w-full overflow-x-hidden
        bg-linear-to-b from-[#0C1636] to-[#23409C]
        text-white
      "
    >
      {/* Background artwork */}
      <img
        src="/02-1.png"
        alt=""
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0 -z-10
          h-full w-full object-cover object-center opacity-20
        "
      />

      {/* Blue overlay */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0 -z-10
          bg-linear-to-b from-[#0C1636]/35 via-[#12234F]/25
          to-[#23409C]/35
        "
      />

      {/* Form container */}
      <section
        className="
          relative mx-auto flex min-h-dvh w-full max-w-lg
          flex-col justify-center px-6
          py-8
          [@media(max-height:720px)]:py-5
        "
      >
        {/* Heading */}
        <header className="mb-5 text-center [@media(max-height:720px)]:mb-3">
          <h1
            className="
              font-serif text-3xl font-normal tracking-wide
              text-[#FFF5E9] sm:text-4xl
            "
          >
            THÔNG TIN
          </h1>

          <p className="mt-2 text-xs leading-5 text-[#C4CCDF] sm:text-sm">
            Cá nhân hóa trải nghiệm đặc biệt dành riêng cho bạn
          </p>
        </header>

        {/* Form */}
        <form
          className="flex flex-col gap-4 [@media(max-height:720px)]:gap-3"
          onSubmit={handleRegister}
        >
          {/* Full name */}
          <div>
            <label htmlFor="fullName" className={labelClass}>
              HỌ VÀ TÊN
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Nhập họ và tên"
              className={inputClass}
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className={labelClass}>
              SỐ ĐIỆN THOẠI
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="Nhập số điện thoại"
              className={inputClass}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className={labelClass}>
              EMAIL
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              className={inputClass}
              required
            />
          </div>

          {/* Gender */}
          <fieldset>
            <legend className={labelClass}>GIỚI TÍNH</legend>

            <div className="flex gap-4">
              {(["NAM", "NỮ"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={gender === item}
                  onClick={() => setGender(item)}
                  className={`${optionClass(gender === item)} w-22.25`}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Experience time */}
          <fieldset>
            <legend className={labelClass}>
              KHUNG GIỜ TRẢI NGHIỆM
            </legend>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {["09:00 - 11:30", "11:30 - 13:30", "13:30 - 16:00"].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={time === item}
                    onClick={() => setTime(item)}
                    className={`
                      whitespace-nowrap rounded-xl border
                      px-1 py-3 text-[11px] transition
                      sm:text-xs
                      ${
                        time === item
                          ? "border-[#F0CDA7] bg-[#B98A66]/30 text-[#FFE4C8]"
                          : "border-[#B98A66] bg-[#111B36]/70 text-white hover:bg-white/10"
                      }
                    `}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </fieldset>

          {/* Validation message */}
          {error && (
            <p
              role="alert"
              className="text-left text-xs leading-4 text-[#E9A6A6]"
            >
              {error}
            </p>
          )}

          {/* Continue button */}
          <button
            type="submit"
            disabled={!gender || !time || loading}
            className={`
              mx-auto mt-0 w-[min(100%,280px)]
              rounded-full border border-[#FFF5EA]/80
              px-5 py-3 text-sm font-bold tracking-wide
              text-[#160D08] shadow-lg
              transition duration-200
              hover:brightness-110 active:scale-[0.98]
              disabled:cursor-not-allowed disabled:opacity-50
            `}
            style={{
              background:
                "linear-gradient(180deg, #FFF0D9 0%, #D8B18D 25%, #A66D49 75%, #E7C5A2 100%)",
            }}
          >
            {loading ? "ĐANG ĐĂNG KÝ..." : "ĐĂNG KÝ"}
          </button>
        </form>
      </section>
    </main>
  );
}
