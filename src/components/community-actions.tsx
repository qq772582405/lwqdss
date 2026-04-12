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
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={handleJoinGroup}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50/90 px-5 py-3 text-sm font-semibold text-emerald-900 shadow-[0_14px_30px_rgba(9,126,105,0.14)] transition hover:-translate-y-0.5 hover:bg-emerald-100"
        >
          QQ群 {QQ_GROUP_ID}
        </button>
        <a
          href={SHOP_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--line-color)] bg-white/88 px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] shadow-[0_14px_32px_rgba(194,106,37,0.12)] transition hover:-translate-y-0.5 hover:border-[color:var(--accent-color)]"
        >
          低价AI小店
        </a>
      </div>
      <p className="max-w-2xl text-center text-sm text-[color:var(--muted-foreground)]">
        {notice || SHOP_PROMPT}
      </p>
    </div>
  );
}
