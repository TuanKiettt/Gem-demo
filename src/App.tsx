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

type WorkflowStep = 0 | 1 | 2 | 3 | 4;

const BTN_CLASSES =
  "rounded-full px-10 py-4 text-xl font-semibold disabled:opacity-30 transition focus-visible:outline-4 focus-visible:outline-offset-4";

function App() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const previousStepRef = useRef<WorkflowStep>(0);
  const isTransitioningRef = useRef(false);
  const [step, setStep] = useState<WorkflowStep>(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [generatedMediaUrl, setGeneratedMediaUrl] = useState<string | null>(
    null,
  );
  const handleSessionChange = useCallback((nextSession: Session | null) => {
    if (nextSession) {
      return;
    }

    setStep(0);
    setPreview(null);
    setUploadedImageUrl(null);
    setGeneratedMediaUrl(null);
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
    setGeneratedMediaUrl(null);
    Cookies.remove("uploadedAvatar", { path: "" });
    Cookies.remove("uploadedAvatar", { path: "/" });
    localStorage.removeItem("uploadedAvatar");
    sessionStorage.removeItem("uploadedAvatar");
    window.location.reload();
  };

  return (
    <MainLayout stepNum={step}>
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
            onImageUploaded={(nextPreview, nextImageUrl) => {
              setPreview(nextPreview);
              setUploadedImageUrl(nextImageUrl);
            }}
            onNext={() => animateTransition(3)}
            onBack={() => animateTransition(1)}
          />
        )}

        {step === 3 && (
          <StepFormCard
            preview={preview}
            uploadedImageUrl={uploadedImageUrl}
            onGenerated={setGeneratedMediaUrl}
            onBack={() => animateTransition(2)}
            onNext={() => animateTransition(4)}
          />
        )}

        {step === 4 && (
          <StepResult generatedMediaUrl={generatedMediaUrl} onReset={reset} />
        )}
      </div>
    </MainLayout>
  );
}

export default App;