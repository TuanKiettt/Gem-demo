import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import gsap from "gsap";
import type { Session } from "@supabase/supabase-js";
import { MainLayout } from "./layouts/MainLayout";
import { StepWelcome } from "./components/StepWelcome";
import { StepAuth } from "./components/StepAuth";
import { StepCapture } from "./components/StepCapture";
import { StepFormCard } from "./components/StepFormCard";
import { StepResult } from "./components/StepResult";
import { useSupabaseSession } from "./hooks/useSupabaseSession";
import LoadingPage from "./components/LoadingPage.tsx";
import type { InvitationGenerationProgress } from "./api/invitation";

type WorkflowStep = 0 | 1 | 2 | 3 | 4;
type PhotoSource = "upload" | "camera";

const BTN_CLASSES =
  "rounded-full px-10 py-4 text-xl font-semibold disabled:opacity-30 transition focus-visible:outline-4 focus-visible:outline-offset-4";
const GENERATED_MEDIA_STORAGE_KEY = "generatedInvitationMediaUrl";

function App() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const previousStepRef = useRef<WorkflowStep>(0);
  const isTransitioningRef = useRef(false);
  const [step, setStep] = useState<WorkflowStep>(() =>
    localStorage.getItem(GENERATED_MEDIA_STORAGE_KEY) ? 4 : 0,
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<PhotoSource | null>(null);
  const [generatedMediaUrl, setGeneratedMediaUrl] = useState<string | null>(
    () => localStorage.getItem(GENERATED_MEDIA_STORAGE_KEY),
  );
  const [generationActive, setGenerationActive] = useState(false);
  const [generationProgress, setGenerationProgress] =
    useState<InvitationGenerationProgress>({
      progress: null,
      message: "Đang gửi yêu cầu tạo thiệp đến AI...",
    });
  const handleSessionChange = useCallback((nextSession: Session | null) => {
    if (nextSession) {
      return;
    }

    setStep(0);
    setPreview(null);
    setUploadedImageUrl(null);
    setPhotoSource(null);
    setGeneratedMediaUrl(null);
    localStorage.removeItem(GENERATED_MEDIA_STORAGE_KEY);
    setGenerationActive(false);
  }, []);
  const authStatus = useSupabaseSession(handleSessionChange);

  useLayoutEffect(() => {
    const wrapper = wrapRef.current;
    if (!wrapper || previousStepRef.current === step) return;

    previousStepRef.current = step;
    gsap.fromTo(
      wrapper,
      { yPercent: -100, autoAlpha: 0 },
      {
        yPercent: 0,
        autoAlpha: 1,
        duration: 0.65,
        ease: "power3.out",
        onComplete: () => {
          isTransitioningRef.current = false;
        },
      },
    );

    return () => {
      gsap.killTweensOf(wrapper);
    };
  }, [step]);

  if (authStatus === "loading") {
    return <p className="text-center mt-20 text-lg">Đang kiểm tra phiên đăng nhập...</p>;
  }

  const animateTransition = (nextStep: WorkflowStep) => {
    const wrapper = wrapRef.current;
    if (!wrapper || isTransitioningRef.current || nextStep === step) return;

    isTransitioningRef.current = true;
    gsap.to(wrapper, {
      yPercent: 100,
      autoAlpha: 0,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => setStep(nextStep),
    });
  };

  const reset = () => {
    setStep(0);
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setUploadedImageUrl(null);
    setPhotoSource(null);
    setGeneratedMediaUrl(null);
    localStorage.removeItem(GENERATED_MEDIA_STORAGE_KEY);
    Cookies.remove("uploadedAvatar", { path: "" });
    Cookies.remove("uploadedAvatar", { path: "/" });
    localStorage.removeItem("uploadedAvatar");
    sessionStorage.removeItem("uploadedAvatar");
    window.location.reload();
  };

  return (
    <MainLayout>
      <div ref={wrapRef} className="w-full h-full flex flex-col items-center justify-center">
        {step === 0 && (
          <StepWelcome onNext={() => animateTransition(authStatus === "authenticated" ? 2 : 1)} />
        )}

        {step === 1 && (
          <StepAuth 
            btnClass={BTN_CLASSES} 
            onNext={() => animateTransition(2)} 
          />
        )}

        {step === 2 && (
          <StepCapture
            preview={preview}
            uploadedImageUrl={uploadedImageUrl}
            photoSource={photoSource}
            onImageUploaded={(nextPreview, nextImageUrl, nextPhotoSource) => {
              setPreview(nextPreview);
              setUploadedImageUrl(nextImageUrl);
              setPhotoSource(nextPhotoSource);
            }}
            onNext={() => animateTransition(3)}
          />
        )}

        {step === 3 && (
          <StepFormCard
            preview={preview}
            uploadedImageUrl={uploadedImageUrl}
            onGenerated={(url) => {
              localStorage.setItem(GENERATED_MEDIA_STORAGE_KEY, url);
              setGeneratedMediaUrl(url);
              setGenerationActive(false);
            }}
            onGenerationStart={() => {
              setGenerationProgress({
                progress: null,
                message: "Đang gửi yêu cầu tạo thiệp đến AI...",
              });
              setGenerationActive(true);
            }}
            onGenerationProgress={setGenerationProgress}
            onGenerationError={() => setGenerationActive(false)}
            onBack={() => animateTransition(2)}
            onNext={() => animateTransition(4)}
          />
        )}

        {step === 4 && (
          <StepResult generatedMediaUrl={generatedMediaUrl} onReset={reset} />
        )}
      </div>
      {generationActive && (
        <LoadingPage
          progress={generationProgress.progress}
          subtitle={generationProgress.message}
        />
      )}
    </MainLayout>
  );
}

export default App;