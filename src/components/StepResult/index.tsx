import { useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, LoaderCircle, RotateCcw } from "lucide-react";

interface StepResultProps {
  generatedMediaUrl: string | null;
  onReset: () => void;
}

interface VideoSize {
  width: number;
  height: number;
}

interface VideoAspectRatio {
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
  const [videoAspectRatio, setVideoAspectRatio] =
    useState<VideoAspectRatio | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const videoMimeType = generatedMediaUrl
    ? getVideoMimeType(generatedMediaUrl)
    : null;

  useLayoutEffect(() => {
    if (!hasPlayed || !videoAspectRatio) return;

    const section = sectionRef.current;
    if (!section) return;

    const resizeVideo = () => {
      const styles = window.getComputedStyle(section);
      const horizontalPadding =
        Number.parseFloat(styles.paddingLeft) +
        Number.parseFloat(styles.paddingRight);
      const verticalPadding =
        Number.parseFloat(styles.paddingTop) +
        Number.parseFloat(styles.paddingBottom);
      const gap = Number.parseFloat(styles.rowGap) || 0;
      const controlsHeight =
        controlsRef.current?.getBoundingClientRect().height ?? 0;
      const maxWidth = Math.max(0, section.clientWidth - horizontalPadding);
      const maxHeight = Math.max(
        0,
        section.clientHeight - verticalPadding - gap - controlsHeight,
      );
      const scale = Math.min(
        maxWidth / videoAspectRatio.width,
        maxHeight / videoAspectRatio.height,
      );

      if (Number.isFinite(scale) && scale > 0) {
        setVideoSize({
          width: videoAspectRatio.width * scale,
          height: videoAspectRatio.height * scale,
        });
      }
    };

    resizeVideo();
    const observer = new ResizeObserver(resizeVideo);
    observer.observe(section);
    if (controlsRef.current) observer.observe(controlsRef.current);

    return () => observer.disconnect();
  }, [hasPlayed, videoAspectRatio]);

  const handleVideoEnded = (video: HTMLVideoElement) => {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      setVideoAspectRatio({
        width: video.videoWidth,
        height: video.videoHeight,
      });
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
      const response = await fetch(`${generatedMediaUrl}?download`);
      if (!response.ok) {
        throw new Error(`Tải thiệp thất bại (HTTP ${response.status}).`);
      }

      const video = await response.blob();
      const downloadUrl = URL.createObjectURL(video);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "thiep-gem.mp4";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (error) {
      console.error("Không thể tải video thiệp:", error);
      setDownloadError(
        error instanceof Error
          ? error.message
          : "Không thể tải video thiệp. Vui lòng thử lại.",
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      className={`absolute inset-0 z-100 flex h-full w-full flex-col items-center justify-center overflow-hidden ${
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
        <div
          ref={controlsRef}
          className="relative z-10 flex w-[min(100%,17.5rem)] flex-col gap-3"
        >
          {videoMimeType && (
            <button
              type="button"
              onClick={handleDownload}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border border-[#FFF5EA]/80 px-5 text-sm font-bold tracking-wide text-[#160D08] shadow-lg transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              style={{
                background:
                  "linear-gradient(180deg, #FFF0D9 0%, #D8B18D 25%, #A66D49 75%, #E7C5A2 100%)",
              }}
            >
              {downloading ? (
                <LoaderCircle
                  className="h-5 w-5 animate-spin"
                  aria-hidden="true"
                />
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
