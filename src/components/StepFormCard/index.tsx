
import { useState } from "react";
import {
  generateInvitation,
  type InvitationGenerationProgress,
} from "../../api/invitation";
import {
  readRegistrationData,
  type RegistrationData,
} from "../../lib/registration";
import { ArrowLeftCircle } from "lucide-react";

interface StepFormCardProps {
  onBack: () => void;
  onNext: () => void;
  preview: string | null;
  uploadedImageUrl: string | null;
  onGenerated: (url: string) => void;
  onGenerationStart: () => void;
  onGenerationProgress: (progress: InvitationGenerationProgress) => void;
  onServiceCreated: (serviceId: string) => void;
  onGenerationError: () => void;
}

export function StepFormCard({
  onBack,
  onNext,
  preview,
  uploadedImageUrl,
  onGenerated,
  onGenerationStart,
  onGenerationProgress,
  onServiceCreated,
  onGenerationError,
}: StepFormCardProps) {
  const [generationLoading, setGenerationLoading] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [registration] = useState(() => {
    try {
      return { data: readRegistrationData(), error: "" };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "Không thể đọc thông tin đăng ký.",
      };
    }
  });
  const profile: RegistrationData | null = registration.data;

  const handleCreateInvitation = async () => {
    if (!profile) {
      setGenerationError("Không tìm thấy thông tin đăng ký của bạn.");
      return;
    }

    setGenerationLoading(true);
    setGenerationError("");
    onGenerationStart();

    try {
      const generatedUrl = await generateInvitation(
        {
          fullName: profile.fullName,
          gender: profile.gender,
          experienceTime: profile.experienceTime,
          uploadedImageUrl,
        },
        onGenerationProgress,
        onServiceCreated,
      );

      onGenerated(generatedUrl);
      onNext();
    } catch (error) {
      console.error("Không thể tạo thiệp:", error);
      onGenerationError();

      setGenerationError(
        error instanceof Error
          ? error.message
          : "Không thể tạo thiệp bằng AI. Vui lòng thử lại.",
      );
    } finally {
      setGenerationLoading(false);
    }
  };

  return (
    <section className="px-5">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-[#07132f]/75 via-[#101c43]/70 to-[#102d78]/85" />

      <div className="pointer-events-none absolute -bottom-32 left-1/2 -z-10 h-80 w-[150%] -translate-x-1/2 rounded-[50%] bg-blue-700/20 blur-3xl" />

      {/* Back button */}
      <div className="relative z-10 w-full max-w-md shrink-0 pt-5">
        <button
          type="button"
          onClick={onBack}
          disabled={generationLoading}
          aria-label="Quay lại"
          className="flex h-9 w-9 items-center justify-center  text-[#f5c34f] transition hover:bg-[#e9b84f]/15 disabled:opacity-50"
        >
          <ArrowLeftCircle/>
        </button>
      </div>

      {/* Heading */}
      <header className="relative z-10 mt-7 w-full max-w-md shrink-0 text-center">
        <h2 className="whitespace-nowrap font-serif text-[clamp(1.4375rem,6vw,2.125rem)] uppercase leading-tight tracking-[-0.04em] text-[#fff7e8]">
          Xác nhận thông tin
        </h2>
        <p className="mt-1 text-sm text-white/65">
          Kiểm tra lại thông tin của bạn trước khi tạo thiệp
        </p>
      </header>

      {/* Main content */}
      <div className="relative z-10 my-auto flex w-full max-w-md flex-col items-center py-6">
        {/* Portrait */}
        <div className="relative h-40 w-39 shrink-0 overflow-hidden rounded-2xl border-2 border-[#d7a04c] bg-[#172344] shadow-[0_0.5rem_1.875rem_rgba(0,0,0,0.3)]">
          {preview ? (
            <img
              src={preview}
              alt="Ảnh xem trước của bạn"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-3 text-center text-sm text-white/50">
              Chưa có ảnh
            </div>
          )}
        </div>

        {/* Information card */}
        <div className="mt-5 w-full rounded-2xl border border-[#c9954d] bg-[#111a30]/90 px-5 py-5 shadow-[0_0.75rem_2.1875rem_rgba(0,0,0,0.2)] backdrop-blur-md">
          <div className="grid grid-cols-2 gap-x-5 gap-y-5">
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-[#e9aa57]">
                Họ và tên
              </p>
              <p className="mt-1 text-base font-bold text-white">
                {profile?.fullName || "Chưa có thông tin"}
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-[#e9aa57]">
                Giới tính
              </p>
              <p className="mt-1 text-sm text-white/90">
                {profile?.gender === "NAM"
                  ? "Nam"
                  : profile?.gender === "NỮ"
                    ? "Nữ"
                    : "Chưa có thông tin"}
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-[#e9aa57]">
                Email
              </p>
              <p className="mt-1 text-sm text-white/90">
                {profile?.email || "Chưa có thông tin"}
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-[#e9aa57]">
                Số điện thoại
              </p>
              <p className="mt-1 text-sm text-white/90">
                {profile?.phone || "Chưa có thông tin"}
              </p>
            </div>

            <div className="col-span-2 min-w-0">
              <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-[#e9aa57]">
                Khung giờ trải nghiệm
              </p>
              <p className="mt-1 text-sm text-white/90">
                {profile?.experienceTime || "Chưa có thông tin"}
              </p>
            </div>
          </div>
        </div>

        {(registration.error || !profile) && (
          <p role="alert" className="mt-4 w-full text-sm text-red-200">
            {registration.error ||
              "Không tìm thấy thông tin đăng ký. Hãy xóa phiên Supabase trong localStorage nếu cần đăng ký lại."}
          </p>
        )}

        {/* Error */}
        {generationError && (
          <p
            role="alert"
            className="mt-4 w-full rounded-xl border border-red-300/40 bg-red-950/50 p-3 text-sm text-red-200"
          >
            {generationError}
          </p>
        )}
      </div>

      {/* Confirm button */}
      <div className="relative z-10 w-full max-w-md shrink-0 pb-3 pt-2">
        <button
          type="button"
          onClick={handleCreateInvitation}
          disabled={
            !profile ||
            !profile.fullName ||
            !profile.gender ||
            !profile.experienceTime ||
            !preview ||
            !uploadedImageUrl ||
            generationLoading
          }
          className="mx-auto flex min-h-11 w-fit max-w-full items-center justify-center gap-1.5 rounded-full border border-[#fff0ce] bg-linear-to-r from-[#a96b3f] via-[#f3d2a0] to-[#a66a40] px-6 py-3 text-sm font-extrabold uppercase "
        >
          {generationLoading ? (
            "Đang tạo thiệp..."
          ) : (
            <div>
              Xác nhận tạo thiệp
            </div>
          )}
        </button>
      </div>
    </section>
  );
}
