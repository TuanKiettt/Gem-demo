interface StepWelcomeProps {
  onNext: () => void;
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <>
      <div
        className="
          relative z-10 mx-auto grid h-full w-full max-w-125 justify-items-center px-[5%] py-[1.5dvh]
        "
      >
        {/* 1. GEM logo */}
        <div className="flex min-h-0 items-center justify-center w-full">
          <img
            src={`${import.meta.env.BASE_URL}LogoGEM-02-1.png`}
            alt="GEM Center"
            className=" absolute top-[4.5%] h-auto w-auto max-w-[45%] object-contain max-h-[10dvh]"
          />
        </div>

        {/* 2. Tagline: vùng giữa background */}
        <div className="flex min-h-0 w-full items-center justify-center">
          <img
            src={`${import.meta.env.BASE_URL}Tgaline%201.png`}
            alt="Future Banquet Experience"
            className=" absolute top-[45%] right-4 h-auto w-full object-contain max-h-[24dvh]"
          />
        </div>

        {/* 3. Partner logos */}
        <div className="flex w-full items-center justify-center py-[1dvh]">
          <img
            src={`${import.meta.env.BASE_URL}logo%202.png`}
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
                "linear-gradient(180deg, #9B5931 0%, #DEBD99 35%, #DBB890 70%, #965B36 100%)",
            }}
          >
            Khám Phá Trải Nghiệm
          </button>
        </div>

        {/* 5. Bottom spacer
            Background đã có logo Managed by ở phía dưới */}
        <div aria-hidden="true" />
      </div>
    </>
  );
}
