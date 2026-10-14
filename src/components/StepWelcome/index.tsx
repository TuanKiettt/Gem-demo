interface StepWelcomeProps {
  onNext: () => void;
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <div
      className="
          relative z-10 mx-auto grid h-full w-full max-w-125 justify-items-center px-[5%] py-[1.5dvh]
        "
    >
      {/* 1. GEM logo */}
      <div className="relative flex min-h-0 w-full items-center justify-center">
        {/* Logo góc trái trên */}
        <img
          src="/LogoGEM-02-1.png"
          alt="GEM Center"
          className="absolute top-[4.5%] max-w-[45%] object-contain max-h-[10dvh]"
        />
      </div>

      {/* 2. Tagline: vùng giữa background */}
      <div className="flex min-h-0 w-full items-center justify-center">
        <img
          src="/Tagline.png"
          alt="Future Banquet Experience"
          className=" absolute top-[47%] object-contain max-h-[24dvh] -translate-x-2.5"
        />
      </div>

      {/* 3. Partner logos */}
      <div className="flex w-full items-center justify-center py-[1dvh]">
        <img
          src="/LogoSponsor.png"
          alt="GEM Center partners"
          className=" absolute bottom-[15%] h-auto w-full object-contain max-h-[12dvh]"
        />
      </div>

      {/* 4. Explore button */}
      <div className="flex w-full items-center justify-center py-[1.5dvh]">
        <button
          type="button"
          onClick={onNext}
          className="w-[min(78%,17.5rem)] shrink-0 rounded-full border border-[#fff0ce] bg-linear-to-r from-[#a96b3f] via-[#f3d2a0] to-[#a66a40]  px-4 py-3 font-bold transition-transform duration-200 active:scale-95 focus-visible:outline focus-visible:outline-[#DEBD99] absolute bottom-[5%]"
        >
          Khám Phá Trải Nghiệm
        </button>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-5 flex items-center justify-center gap-1.5 text-[0.5rem] leading-none text-white/80">
        <span>Managed by</span>
        <img
          src="/invitation-logo.png"
          alt="Invitation"
          className="h-[min(4dvh,1.5rem)] max-w-[45%] object-contain"
        />
      </div>
    </div>
  );
}
