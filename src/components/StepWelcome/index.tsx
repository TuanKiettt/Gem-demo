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
        <div className="flex min-h-0 items-center justify-center w-full">
          <img
            src="/LogoGEM-02-1.png"
            alt="GEM Center"
            className=" absolute top-[4.5%] max-w-[45%] object-contain max-h-[10dvh]"
          />
        </div>

        {/* 2. Tagline: vùng giữa background */}
        <div className="flex min-h-0 w-full items-center justify-center">
          <img
            src="/Tgaline 1.png"
            alt="Future Banquet Experience"
            className=" absolute top-[47%] object-contain max-h-[24dvh] -translate-x-2.5"
          />
        </div>

        {/* 3. Partner logos */}
        <div className="flex w-full items-center justify-center py-[1dvh]">
          <img
            src="/logo 2.png"
            alt="GEM Center partners"
            className=" absolute bottom-[15%] h-auto w-full object-contain max-h-[12dvh]"
          />
        </div>

        {/* 4. Explore button */}
        <div className="flex w-full items-center justify-center py-[1.5dvh]">
          <button
            type="button"
            onClick={onNext}
            className="w-[min(78%,280px)] shrink-0 rounded-full border border-[#FFF5EA]/70 px-4 py-3 font-bold transition-transform duration-200 active:scale-95 focus-visible:outline focus-visible:outline-[#DEBD99] absolute bottom-[5%]"
            style={{
              background:
                "linear-gradient(#9B5931 0%, #DEBD99 35%, #DBB890 70%, #965B36 100%)",
            }}
          >
            Khám Phá Trải Nghiệm
          </button>
        </div>
    </div>
  );
}
