import { useState } from "react";
import { ArrowDown, LoaderCircle, RotateCcw } from "lucide-react";

interface StepResultProps {
  generatedMediaUrl: string | null;
  onReset: () => void;
}

interface VideoSize {
  width: number;
  height: number;
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
  const [hasPlayed, setHasPlayed] = useState(false);
  const [videoSize, setVideoSize] = useState<VideoSize | null>(null);
  const videoMimeType = generatedMediaUrl
    ? getVideoMimeType(generatedMediaUrl)
    : null;

  const handleVideoEnded = (video: HTMLVideoElement) => {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      const aspectRatio = video.videoWidth / video.videoHeight;
      const maxWidth = Math.min(320, window.innerWidth * 0.7);
      const maxHeight = window.innerHeight * 0.62;
      const width = Math.min(maxWidth, maxHeight * aspectRatio);
      setVideoSize({ width, height: width / aspectRatio });
    }
    setHasPlayed(true);
    video.currentTime = 0;
    void video.play().catch((error: unknown) => {
      console.error("Không thể tiếp tục phát video thiệp:", error);
    });
  };

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
    <section
      className={`fixed inset-0 z-100 flex h-dvh w-screen flex-col items-center justify-center overflow-hidden ${
        hasPlayed ? "gap-6 px-5 py-8" : ""
      }`}
    >
      {hasPlayed && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-linear-to-b from-[#0C1636]/75 to-[#23409C]/75"
        />
      )}
      {generatedMediaUrl && videoMimeType ? (
        <video
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={(event) => handleVideoEnded(event.currentTarget)}
          className={`${
            hasPlayed
              ? "relative z-10 rounded-sm bg-black object-cover shadow-2xl"
              : "absolute inset-0 h-full w-full object-contain"
          }`}
          style={
            hasPlayed && videoSize
              ? { width: videoSize.width, height: videoSize.height }
              : undefined
          }
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
          className={`z-10 w-[min(90vw,32rem)] rounded-xl bg-red-950/85 px-4 py-3 text-center text-sm text-white ${
            hasPlayed ? "" : "absolute bottom-24 left-1/2 -translate-x-1/2"
          }`}
        >
          {downloadError}
        </p>
      )}
      {hasPlayed && (
        <div className="relative z-10 flex w-[min(100%,280px)] flex-col gap-3">
          {videoMimeType && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border border-[#FFF5EA]/80 px-5 text-sm font-bold tracking-wide text-[#160D08] shadow-lg transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              style={{
                background:
                  "linear-gradient(180deg, #FFF0D9 0%, #D8B18D 25%, #A66D49 75%, #E7C5A2 100%)",
              }}
            >
              {downloading ? (
                <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowDown className="h-5 w-5" aria-hidden="true" />
              )}
              LƯU THIỆP MỜI
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            disabled={downloading}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border border-[#D9A44F] bg-[#111D48]/80 px-5 text-sm font-bold tracking-wide text-[#E5A447] transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            TẠO THIỆP KHÁC
          </button>
        </div>
      )}
    </section>
  );
}