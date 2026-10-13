import { useState } from "react";
import { Download, LoaderCircle, RotateCcw } from "lucide-react";

interface StepResultProps {
  generatedMediaUrl: string | null;
  onReset: () => void;
}

const getVideoMimeType = (url: string): string | null => {
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname.endsWith(".mp4")) return "video/mp4";
  if (pathname.endsWith(".webm")) return "video/webm";
  if (pathname.endsWith(".ogg")) return "video/ogg";
  if (pathname.endsWith(".mov")) return "video/quicktime";
  return null;
};

export function StepResult({ generatedMediaUrl, onReset }: StepResultProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const videoMimeType = generatedMediaUrl
    ? getVideoMimeType(generatedMediaUrl)
    : null;

  const handleDownload = async () => {
    if (!generatedMediaUrl) return;

    setDownloading(true);
    setDownloadError("");
    try {
      const response = await fetch(generatedMediaUrl);
      if (!response.ok) {
        throw new Error(`Tải video thất bại (${response.status}).`);
      }

      const videoBlob = await response.blob();
      const downloadUrl = URL.createObjectURL(videoBlob);
      const link = document.createElement("a");
      const extension =
        new URL(generatedMediaUrl).pathname.match(/\.(mp4|webm|ogg|mov)$/i)?.[0] ??
        ".mp4";
      link.href = downloadUrl;
      link.download = `thiep-gem${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (error) {
      console.error("Không thể tải video thiệp:", error);
      setDownloadError(
        error instanceof TypeError
          ? "Máy chủ video không cho phép tải trực tiếp từ trình duyệt (CORS)."
          : error instanceof Error
            ? error.message
            : "Không thể tải video. Vui lòng thử lại.",
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="fixed inset-0 z-100 h-dvh w-screen overflow-hidden bg-black">
      {generatedMediaUrl && videoMimeType ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-contain"
          aria-label="Video thiệp được tạo bằng AI"
        >
          <source src={generatedMediaUrl} type={videoMimeType} />
          Trình duyệt của bạn không hỗ trợ phát video.
        </video>
      ) : (
        <p
          role="alert"
          className="absolute inset-0 flex items-center justify-center px-6 text-center text-white"
        >
          Không tìm thấy video thiệp đã tạo. Vui lòng thử lại.
        </p>
      )}
      {downloadError && (
        <p
          role="alert"
          className="absolute bottom-24 left-1/2 z-10 w-[min(90vw,32rem)] -translate-x-1/2 rounded-xl bg-red-950/85 px-4 py-3 text-center text-sm text-white"
        >
          {downloadError}
        </p>
      )}
      <div className="absolute right-4 top-4 z-10 flex gap-2 sm:right-6 sm:top-6">
        {videoMimeType && (
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            aria-label={downloading ? "Đang tải video" : "Tải video"}
            title={downloading ? "Đang tải video" : "Tải video"}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/45 text-white shadow-lg backdrop-blur-md transition hover:bg-black/70 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {downloading ? (
              <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          disabled={downloading}
          aria-label="Chơi lại"
          title="Chơi lại"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/45 text-white shadow-lg backdrop-blur-md transition hover:bg-black/70 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}