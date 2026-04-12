import Image from "next/image";
import { CommunityActions } from "@/components/community-actions";
import { RedeemForm } from "@/components/redeem-form";
import { ANNOUNCEMENT_TEXT } from "@/lib/site-content";

function FeatureBadge({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="rounded-[30px] border border-[color:var(--line-color)] bg-white/80 px-5 py-4 text-center shadow-[0_18px_40px_rgba(194,106,37,0.08)] sm:min-w-52">
      <p className="text-sm text-[color:var(--muted-foreground)]">{eyebrow}</p>
      <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">{title}</p>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="rounded-[36px] border border-white/75 bg-white p-4 shadow-[0_28px_70px_rgba(36,36,36,0.12)]">
      <Image
        src="/brand-mark.svg"
        alt="OpenAI 风格图标"
        width={112}
        height={112}
        className="h-24 w-24 object-contain sm:h-28 sm:w-28"
        priority
      />
    </div>
  );
}

export function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col gap-7 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <section className="rounded-[42px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,248,241,0.82))] px-6 py-8 shadow-[0_30px_90px_rgba(164,118,76,0.14)] backdrop-blur sm:px-10 sm:py-10 lg:px-14">
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-center lg:gap-8">
          <FeatureBadge eyebrow="ChatGPT Team" title="官方直连" />
          <BrandMark />
          <FeatureBadge eyebrow="当前卡位" title="库存充足" />
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm uppercase tracking-[0.45em] text-[color:var(--muted-foreground)]">Redeem Portal</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-6xl lg:text-7xl">
            GPT Team 兑换中心
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[color:var(--muted-foreground)] sm:text-xl">
            输入邮箱和兑换码，自助提交兑换。
          </p>
        </div>
        <div className="mt-8">
          <CommunityActions />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr_0.82fr]">
        <aside className="rounded-[34px] border border-[color:var(--line-color)] bg-[linear-gradient(180deg,rgba(255,246,240,0.86),rgba(255,251,248,0.92))] p-6 shadow-[0_24px_70px_rgba(194,106,37,0.08)] xl:p-8">
          <span className="inline-flex rounded-full border border-[color:var(--line-color)] bg-white/80 px-4 py-1 text-sm text-[color:var(--muted-foreground)]">
            公告 / 告知买家
          </span>
          <h2 className="mt-8 text-3xl font-semibold text-[color:var(--foreground)]">使用须知</h2>
          <p className="mt-6 text-lg leading-10 text-[color:var(--muted-foreground)]">{ANNOUNCEMENT_TEXT}</p>
        </aside>

        <RedeemForm />

        <aside className="rounded-[34px] border border-[rgba(126,173,220,0.28)] bg-[linear-gradient(180deg,rgba(245,248,255,0.92),rgba(240,245,255,0.85))] p-6 shadow-[0_24px_70px_rgba(76,113,164,0.08)] xl:p-8">
          <div className="rounded-[28px] border border-white/75 bg-white/80 p-5 shadow-[0_16px_40px_rgba(76,113,164,0.08)]">
            <span className="inline-flex rounded-full border border-[rgba(126,173,220,0.3)] bg-[rgba(242,248,255,0.95)] px-4 py-1 text-sm text-sky-900/75">
              官方群
            </span>
            <h2 className="mt-6 text-3xl font-semibold text-slate-900">获取最新动态</h2>
            <p className="mt-4 text-lg leading-9 text-slate-600">
              点击顶部 QQ 群按钮即可自动复制群号并打开加群链接，方便买家及时查看补充通知和兑换提醒。
            </p>
          </div>
          <div className="mt-6 rounded-[28px] border border-white/75 bg-white/80 p-5 shadow-[0_16px_40px_rgba(76,113,164,0.08)]">
            <span className="inline-flex rounded-full border border-[rgba(126,173,220,0.3)] bg-[rgba(242,248,255,0.95)] px-4 py-1 text-sm text-sky-900/75">
              更多低价会员
            </span>
            <h2 className="mt-6 text-3xl font-semibold text-slate-900">继续挑选更多商品</h2>
            <p className="mt-4 text-lg leading-9 text-slate-600">
              如果你还需要 ChatGPT Team、Plus 与 Gemini 相关商品，可直接点击顶部的小店入口继续浏览。
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
