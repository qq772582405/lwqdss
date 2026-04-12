"use client";

import { useState } from "react";
import {
  QQ_GROUP_ID,
  QQ_GROUP_URL,
  SHOP_PROMPT,
  SHOP_URL,
} from "@/lib/site-content";

export function CommunityActions() {
  const [notice, setNotice] = useState("");

  const handleJoinGroup = async () => {
    try {
      await navigator.clipboard.writeText(QQ_GROUP_ID);
      setNotice("QQ群号已复制，正在打开加群链接");
    } catch {
      setNotice("无法自动复制群号，请手动添加官方群");
    }

    window.open(QQ_GROUP_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="grid w-full gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleJoinGroup}
          className="inline-flex min-h-14 items-center justify-center rounded-[22px] border border-emerald-300/70 bg-[linear-gradient(135deg,rgba(234,252,247,0.98),rgba(221,245,239,0.94))] px-5 py-3 text-sm font-semibold text-emerald-950 shadow-[0_18px_40px_rgba(10,118,100,0.12)] transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-[0_24px_45px_rgba(10,118,100,0.16)]"
        >
          QQ群 {QQ_GROUP_ID}
        </button>
        <a
          href={SHOP_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-14 items-center justify-center rounded-[22px] border border-[color:var(--line-color)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,241,234,0.88))] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] shadow-[0_18px_40px_rgba(27,19,13,0.08)] transition hover:-translate-y-0.5 hover:border-[color:var(--accent-color)] hover:shadow-[0_24px_45px_rgba(27,19,13,0.12)]"
        >
          低价AI小店
        </a>
      </div>
      <p className="max-w-2xl text-center text-sm leading-7 text-[color:var(--muted-foreground)]">
        {notice || SHOP_PROMPT}
      </p>
    </div>
  );
}
