import Image from "next/image";
import { CommunityActions } from "@/components/community-actions";
import { RedeemForm } from "@/components/redeem-form";
import { ANNOUNCEMENT_TEXT } from "@/lib/site-content";

function BrandStrip() {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--line-color)] bg-white/85 px-4 py-3 shadow-[0_16px_45px_rgba(27,19,13,0.06)] backdrop-blur">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--line-color)] bg-[rgba(248,245,239,0.96)]">
        <Image
          src="/brand-mark.svg"
          alt="低价 AI 实验室"
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
          priority
        />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted-foreground)]">
          Redeem Lab
        </p>
        <p className="mt-1 text-base font-semibold text-[color:var(--foreground)]">低价 AI 实验室</p>
      </div>
    </div>
  );
}

function TrustRail() {
  const items = ["ChatGPT Team", "自助兑换", "结果即时反馈"];

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-[color:var(--muted-foreground)]">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line-color)] bg-white/72 px-4 py-2 shadow-[0_12px_30px_rgba(27,19,13,0.04)]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent-soft)]" />
          {item}
        </span>
      ))}
    </div>
  );
}

function AnnouncementBar() {
  return (
    <section className="rounded-[30px] border border-[color:var(--line-color)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,243,236,0.9))] px-6 py-5 shadow-[0_22px_55px_rgba(27,19,13,0.06)] backdrop-blur sm:px-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <span className="inline-flex w-fit rounded-full border border-[color:var(--line-color)] bg-[rgba(248,245,239,0.92)] px-4 py-1 text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
            使用须知
          </span>
          <p className="text-sm leading-8 text-[color:var(--foreground)] sm:text-base">
            {ANNOUNCEMENT_TEXT}
          </p>
        </div>
        <span className="hidden h-3 w-3 shrink-0 rounded-full bg-[color:var(--accent-soft)] opacity-70 sm:block" />
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-[1260px] flex-1 flex-col gap-6 px-4 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-8">
      <section className="relative overflow-hidden rounded-[40px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,243,236,0.88))] px-5 py-6 shadow-[0_34px_90px_rgba(27,19,13,0.08)] sm:px-8 sm:py-8 lg:px-12 lg:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_45%)]" />
        <div className="relative flex flex-col items-center text-center">
          <BrandStrip />
          <div className="mt-10 max-w-4xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.6em] text-[color:var(--muted-foreground)] sm:text-xs">
              Redeem Portal
            </p>
            <h1 className="mt-5 text-[clamp(2.9rem,8vw,5.6rem)] font-semibold tracking-[-0.05em] text-[color:var(--foreground)]">
              GPT Team 兑换中心
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[color:var(--muted-foreground)] sm:text-lg">
              保留高频工具，把 Team 兑换和 Access Token 提取整合到一张主工具卡里，减少跳转，让输入、提取和复制都更直接。
            </p>
          </div>
          <div className="mt-8 w-full max-w-3xl">
            <CommunityActions />
          </div>
          <TrustRail />
        </div>
      </section>

      <AnnouncementBar />

      <RedeemForm />
    </main>
  );
}
