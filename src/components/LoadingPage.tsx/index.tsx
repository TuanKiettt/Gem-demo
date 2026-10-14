import { useEffect, useState } from "react";

interface LoadingPageProps {
  progress?: number | null;
  title?: string;
  subtitle?: string;
}

const AI_LOADING_SCRIPT = [
"Đang phân tích hình ảnh của bạn...",
"AI đang nhận diện các chi tiết trong ảnh...",
"Đang phân tích khuôn mặt, bố cục và ánh sáng...",
"AI đang thay đổi trang phục theo yêu cầu...",
"Đang tinh chỉnh kiểu dáng và chất liệu trang phục...",
"Đang hoàn thiện diện mạo mới của bạn...",
"AI đang tạo hình ảnh mới cho bạn...",
"Đang tinh chỉnh chi tiết để hình ảnh tự nhiên hơn...",
"Đang tối ưu chất lượng và độ sắc nét hình ảnh...",
"Một chút nữa thôi, diện mạo mới sắp xuất hiện...",
"AI đang hoàn thiện những chi tiết cuối cùng...",
"Sắp xong rồi! Cùng chờ xem diện mạo mới của bạn nhé...",
]

export default function LoadingPage({
  progress,
  title = "ĐANG TẠO THIỆP MỜI",
  subtitle = "Vũ trụ đang chuẩn bị một điều bất ngờ...",
}: LoadingPageProps) {
  const [scriptIndex, setScriptIndex] = useState(0);
  const hasProgress = typeof progress === "number";
  const value = hasProgress
    ? Math.round(Math.max(0, Math.min(100, progress)))
    : null;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setScriptIndex((currentIndex) =>
        Math.min(currentIndex + 1, AI_LOADING_SCRIPT.length - 1),
      );
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-linear-to-b from-[#08132f]/80 via-[#0b1839]/75 to-[#123b91]/85 px-5">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -bottom-20 left-1/2 z-0 h-72 w-[140%] -translate-x-1/2 rounded-[50%] bg-blue-600/20 blur-3xl" />

      {/* Loading card */}
      <section
        className="relative z-10 w-full max-w-sm rounded-[1.625rem] border border-[#d6a052] bg-[#111c39]/95 px-6 py-9 shadow-[0_1.25rem_3.75rem_rgba(0,0,0,0.3)] backdrop-blur-md"
        aria-label="Tiến trình tạo thiệp"
        aria-live="polite"
      >
        {/* Star emblem */}
        <div className="mx-auto mb-5 flex h-26.5 w-26.5 items-center justify-center rounded-full bg-[#050b43]">
          <img
            src="/LoadingIcon.png"
            alt="loading-icon"
            className="h-22.5 w-22.5 animate-[pulse_2s_ease-in-out_infinite] object-contain"
          />
        </div>

        {/* Title */}
        <h1 className="text-center text-lg font-extrabold tracking-wide text-[#fff8ec]">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-center text-xs leading-6 text-[#aeb9d7]">
          {subtitle}
        </p>

        {/* Progress bar */}
        <div
          className="mt-10 h-2.25 w-full overflow-hidden rounded-full bg-[#41465d]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          {...(value === null
            ? { "aria-valuetext": "Đang chờ cập nhật tiến trình từ AI" }
            : { "aria-valuenow": value })}
          aria-label="Tiến độ tạo thiệp"
        >
          <div
            className={`h-full rounded-full bg-linear-to-r from-[#dba05b] via-[#f6c989] to-[#ffe0b5] ${
              value === null
                ? "w-1/3 animate-[progress-indeterminate_1.6s_ease-in-out_infinite]"
                : "transition-[width] duration-300 ease-out"
            }`}
          />
        </div>

        {/* Percentage */}
        <p className="mt-4 text-center text-sm font-bold tabular-nums text-[#e9ad62]">
          {AI_LOADING_SCRIPT[scriptIndex]}
        </p>
      </section>
    </div>
  );
}
