
import React from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-[#030817]">
      <div className="relative isolate h-dvh min-h-125 w-full max-w-107.5 overflow-hidden bg-[#030817] shadow-2xl ring-1 ring-white/10">
        <img
          src="/BackGround.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
        />

        <main className="relative z-10 h-full w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
