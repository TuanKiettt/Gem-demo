
import React from "react";

interface MainLayoutProps {
  stepNum: number;
  children: React.ReactNode;
}

export function MainLayout({ stepNum, children }: MainLayoutProps) {
  return (
    <div className="relative isolate h-dvh min-h-125 w-full overflow-hidden bg-[#030817]">

      {/* Background scale theo màn hình */}
      <img
        src="/02-1.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill"
      />

      {/* Nội dung nằm trên background */}
      <main className="relative z-10 h-full w-full">
        {children}
      </main>

    </div>
  );
}
