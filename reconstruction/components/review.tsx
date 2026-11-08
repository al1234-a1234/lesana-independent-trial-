"use client";
import { useState } from "react";
import Link from "next/link";
import { allLines, type Line } from "@/lib/catalog";
import { useData } from "./data-provider";
import { Study } from "./study";
export function Review() {
  const { data } = useData();
  const [session, setSession] = useState<Line[] | null>(null);
  if (session) return <Study reviewLines={session} />;
  const records = [...(data?.records ?? [])].sort((a, b) => a.dueAt - b.dueAt);
  const due = records.filter((r) => r.dueAt <= Date.now());
  const select = (ids: string[]) =>
    setSession(
      ids
        .map((id) => allLines.find((l) => l.id === id))
        .filter((l): l is Line => Boolean(l)),
    );
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">خطوة للتثبيت</p>
        <h1>
          بعض الجمل تستحق <em>عودة.</em>
        </h1>
        <p className="muted">
          جمل أخطأت فيها ترجع قريبًا. والجمل التي تتقنها تعود بعد فترة أطول.
        </p>
      </div>
      <div className="review-summary">
        <div>
          <span>مستحق الآن</span>
          <strong data-testid="due-count">{due.length}</strong>
        </div>
        <div>
          <span>في جدولك</span>
          <strong>{records.length}</strong>
        </div>
        {due.length > 0 ? (
          <button
            className="button"
            onClick={() => select(due.slice(0, 5).map((r) => r.lineId))}
          >
            ابدأ المراجعة ←
          </button>
        ) : records.length > 0 ? (
          <button
            className="button secondary"
            onClick={() => select(records.slice(0, 5).map((r) => r.lineId))}
          >
            تدرّب الآن
          </button>
        ) : (
          <Link className="button" href="/">
            ابدأ قصة أولًا ←
          </Link>
        )}
      </div>
      {!records.length ? (
        <div className="empty">
          <span className="empty-symbol">↻</span>
          <h2>هنا تنمو ذاكرتك.</h2>
          <p>أكمل سطرًا من أي قصة وسنضيفه إلى جدول مراجعتك.</p>
        </div>
      ) : (
        <div className="review-list">
          {records.map((r) => {
            const line = allLines.find((l) => l.id === r.lineId);
            if (!line) return null;
            return (
              <article className="review-row" key={r.lineId}>
                <span className="review-status">
                  {r.dueAt <= Date.now() ? "↻" : "◷"}
                </span>
                <div>
                  <p lang="en" dir="ltr">
                    {line.text}
                  </p>
                  <small>{line.ar}</small>
                </div>
                <div className="review-date">
                  <b>
                    {r.dueAt <= Date.now()
                      ? "الآن"
                      : new Date(r.dueAt).toLocaleString("ar-SA", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                  </b>
                  <span>
                    {Math.round(r.accuracy * 100)}% دقة · {r.attempts} محاولات
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="schedule-note">
        بعد خطأ: 10 دقائق. بعد المحاولات الخالية من الأخطاء: يوم، ثم 3، 7، 14،
        30، و60 يومًا.
      </p>
    </>
  );
}
