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

function InfoCard({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-[30px] border border-[color:var(--line-color)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(250,247,242,0.84))] p-6 shadow-[0_22px_55px_rgba(27,19,13,0.06)] backdrop-blur">
      <span className="inline-flex rounded-full border border-[color:var(--line-color)] bg-[rgba(248,245,239,0.92)] px-4 py-1 text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
        {label}
      </span>
      <h2 className="mt-6 text-3xl font-semibold leading-tight text-[color:var(--foreground)]">{title}</h2>
      <p className="mt-5 text-base leading-8 text-[color:var(--muted-foreground)]">{body}</p>
    </article>
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
              输入邮箱和兑换码，自助提交兑换。保留必要信息，压缩无效装饰，让购买、提交和查看结果都更直接。
            </p>
          </div>
          <div className="mt-8 w-full max-w-3xl">
            <CommunityActions />
          </div>
          <TrustRail />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] xl:gap-6">
        <RedeemForm />

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1">
          <InfoCard label="公告 / 告知买家" title="使用须知" body={ANNOUNCEMENT_TEXT} />
          <InfoCard
            label="最新动态"
            title="加入群聊获取通知"
            body="点击上方 QQ 群按钮即可自动复制群号并跳转，方便买家第一时间查看补货、异常与兑换提醒。"
          />
          <InfoCard
            label="低价AI小店"
            title="继续挑选更多商品"
            body="如果你还需要 ChatGPT Team、Plus 与 Gemini 相关商品，可直接点击上方的小店入口继续浏览。"
          />
        </div>
      </section>
    </main>
  );
}
