import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../lib/supabase";
import {
  saveRegistrationData,
  type RegistrationData,
} from "../../lib/registration";
import {
  registerSchema,
  type RegisterFormData,
  type RegisterFormInput,
} from "../../schema/authSchema";

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
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput, unknown, RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
    },
  });
  const gender = useWatch({ control, name: "gender" });
  const time = useWatch({ control, name: "experienceTime" });
  const [registrationError, setRegistrationError] = useState("");

  const handleRegister = async ({
    fullName,
    phone,
    email,
    gender,
    experienceTime,
  }: RegisterFormData) => {
    setRegistrationError("");

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
        setRegistrationError(`${taken.join(". ")}. Vui lòng kiểm tra lại.`);
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
        experienceTime,
      };

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            gender,
            experience_time: experienceTime,
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
      setRegistrationError(
        registrationError instanceof Error
          ? registrationError.message
          : "Không thể đăng ký. Vui lòng thử lại.",
      );
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
        bg-linear-to-b from-[#0C1636]/75 to-[#23409C]/75
        text-white px-5
      "
    >
      {/* Form container */}
      <section
        className="
          relative mx-auto flex min-h-dvh w-full max-w-lg
          flex-col justify-center px-6F
          py-8
          [@media(max-height:45rem)]:py-5
        "
      >
        {/* Heading */}
        <header className="mb-5 text-center [@media(max-height:45rem)]:mb-3">
          <h1
            className="
              font-serif text-3xl font-normal tracking-wide
              text-[#FFF5E9]
            "
          >
            THÔNG TIN
          </h1>

          <p className="mt-2 text-xs leading-5 text-[#C4CCDF]">
            Cá nhân hóa trải nghiệm đặc biệt dành riêng cho bạn
          </p>
        </header>

        {/* Form */}
        <form
          className="flex flex-col gap-4 [@media(max-height:45rem)]:gap-3"
          onSubmit={handleSubmit(handleRegister)}
          noValidate
        >
          {/* Full name */}
          <div>
            <label htmlFor="fullName" className={labelClass}>
              HỌ VÀ TÊN
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Nhập họ và tên"
              className={inputClass}
              aria-invalid={Boolean(errors.fullName)}
              {...register("fullName")}
            />
            {errors.fullName && (
              <p role="alert" className="mt-1 text-left text-xs text-[#E9A6A6]">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className={labelClass}>
              SỐ ĐIỆN THOẠI
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="Nhập số điện thoại"
              className={inputClass}
              aria-invalid={Boolean(errors.phone)}
              {...register("phone")}
            />
            {errors.phone && (
              <p role="alert" className="mt-1 text-left text-xs text-[#E9A6A6]">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className={labelClass}>
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              className={inputClass}
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email && (
              <p role="alert" className="mt-1 text-left text-xs text-[#E9A6A6]">
                {errors.email.message}
              </p>
            )}
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
                  aria-invalid={Boolean(errors.gender)}
                  onClick={() =>
                    setValue("gender", item, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                  className={`${optionClass(gender === item)} w-22.25`}
                >
                  {item}
                </button>
              ))}
            </div>
            {errors.gender && (
              <p role="alert" className="mt-1 text-left text-xs text-[#E9A6A6]">
                {errors.gender.message}
              </p>
            )}
          </fieldset>

          {/* Experience time */}
          <fieldset>
            <legend className={labelClass}>
              KHUNG GIỜ TRẢI NGHIỆM
            </legend>

            <div className="grid grid-cols-3 gap-2">
              {(["09:00 - 11:30", "11:30 - 13:30", "13:30 - 16:00"] as const).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={time === item}
                    aria-invalid={Boolean(errors.experienceTime)}
                    onClick={() =>
                      setValue("experienceTime", item, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                    className={`
                      whitespace-nowrap rounded-xl border
                      px-1 py-3 text-[0.6875rem] transition
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
            {errors.experienceTime && (
              <p role="alert" className="mt-1 text-left text-xs text-[#E9A6A6]">
                {errors.experienceTime.message}
              </p>
            )}
          </fieldset>

          {/* Validation message */}
          {registrationError && (
            <p
              role="alert"
              className="text-left text-xs leading-4 text-[#E9A6A6]"
            >
              {registrationError}
            </p>
          )}

          {/* Continue button */}
          <button
            type="submit"
            disabled={!gender || !time || isSubmitting}
            className={`
              mx-auto mt-0 w-[min(100%,17.5rem)]
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
            {isSubmitting ? "ĐANG ĐĂNG KÝ..." : "ĐĂNG KÝ"}
          </button>
        </form>
      </section>
    </main>
  );
}
