
interface LoadingPageProps {
  progress?: number | null;
  title?: string;
  subtitle?: string;
}

export default function LoadingPage({
  progress,
  title = "ĐANG TẠO THIỆP MỜI",
  subtitle = "Vũ trụ đang chuẩn bị một điều bất ngờ...",
}: LoadingPageProps) {
  const hasProgress = typeof progress === "number";
  const value = hasProgress
    ? Math.round(Math.max(0, Math.min(100, progress)))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-linear-to-b from-[#08132f]/80 via-[#0b1839]/75 to-[#123b91]/85 px-5">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -bottom-20 left-1/2 z-0 h-72 w-[140%] -translate-x-1/2 rounded-[50%] bg-blue-600/20 blur-3xl" />

      {/* Loading card */}
      <section
        className="relative z-10 w-full max-w-sm rounded-[26px] border border-[#d6a052] bg-[#111c39]/95 px-6 py-9 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-md sm:px-8"
        aria-label="Tiến trình tạo thiệp"
        aria-live="polite"
      >
        {/* Star emblem: public/2 25.png */}
        <div className="mx-auto mb-5 flex h-26.5 w-26.5 items-center justify-center rounded-full bg-[#050b43]">
          <img
            src={`${import.meta.env.BASE_URL}2%2025.png`}
            alt="Ngôi sao phát sáng"
            className="h-22.5 w-22.5 animate-[pulse_2s_ease-in-out_infinite] object-contain"
          />
        </div>

        {/* Title */}
        <h1 className="text-center text-lg font-extrabold tracking-wide text-[#fff8ec]">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-center text-xs leading-6 text-[#aeb9d7] sm:text-sm">
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
            style={value === null ? undefined : { width: `${value}%` }}
          />
        </div>

        {/* Percentage */}
        <p className="mt-4 text-center text-sm font-bold tabular-nums text-[#e9ad62]">
          {value === null ? "Đang cập nhật tiến trình..." : `${value}%`}
        </p>
      </section>
    </div>
  );
}
