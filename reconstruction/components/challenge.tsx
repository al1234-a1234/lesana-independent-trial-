"use client";
import { useEffect, useState } from "react";
import { currentWord, idleGame, skipGame, startGame, submitGame, tickGame } from "@/lib/game";

export function Challenge() {
  const [game, setGame] = useState(idleGame);
  const [answer, setAnswer] = useState("");
  const [best, setBest] = useState<number | null>(null);
  useEffect(() => {
    const raw = localStorage.getItem("satr.challenge.best.v1");
    const value = Number(raw);
    if (raw !== null && Number.isFinite(value)) setBest(value);
  }, []);
  useEffect(() => {
    if (game.phase !== "playing") return;
    const timer = window.setInterval(() => setGame(tickGame), 1000);
    return () => window.clearInterval(timer);
  }, [game.phase]);
  useEffect(() => {
    if (game.phase !== "finished") return;
    const value = Math.max(best ?? 0, game.correct);
    if (value !== best) {
      localStorage.setItem("satr.challenge.best.v1", String(value));
      // Keep the stored score for the next visit without an effect-driven rerender.
    }
  }, [game.phase, game.correct, best]);

  function start() {
    setGame(startGame(Date.now()));
    setAnswer("");
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!answer.trim()) return;
    setGame((state) => submitGame(state, answer));
    if (answer.trim().toLowerCase() === currentWord(game).en.toLowerCase()) setAnswer("");
  }
  function hear() {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    const utterance = new SpeechSynthesisUtterance(currentWord(game).en);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
  const word = game.phase === "playing" ? currentWord(game) : null;
  return (
    <section className="game-page">
      {game.phase!=="idle"&&<><p className="eyebrow">تحدي مستقل بكلمات قصص سطر الأصلية</p><h1>دقيقة للكلمات</h1></>}
      {game.phase==="idle"&&<div className="game-ready"><span className="game-ready-badge">بدون تسجيل · 60 ثانية</span><h1>كم كلمة إنجليزية تكتب في 60 ثانية؟</h1><p>نعطيك المعنى بالعربي، وأنت تكتب الكلمة بالإنجليزي. إذا علقت، نكشف لك حرف كل 3 ثوانٍ، وعندك 3 مرات تسمع فيها الكلمة 🔊</p><div className="game-example"><small>مثال</small><strong>يفوّت</strong><span dir="ltr">m _ _ _ → <b>miss</b></span></div><button className="game-ready-button" onClick={start}>⚡ ابدأ التحدي</button><p>أفضل نتيجة: {best ?? 0} كلمة</p></div>}
      {game.phase!=="idle"&&<p className="muted">اقرأ المعنى بالعربية واكتب الكلمة الإنجليزية. يمكنك تجاوز السؤال والعودة للعب في أي وقت.</p>}
      {game.phase!=="idle"&&
      <div className="game-panel">
        <div className="game-top"><span>إجابات صحيحة <strong data-testid="game-score">{game.correct}</strong></span><span>المتبقي <strong data-testid="game-time">{game.seconds}</strong> ثانية</span></div>
        {game.phase === "playing" && word && <div className="game-center">
          <span className="soft-tag">الكلمة {game.index + 1}</span>
          <h2 data-testid="game-prompt">{word.ar}</h2>
          <form onSubmit={submit}>
            <label htmlFor="game-answer">اكتب بالإنجليزي</label>
            <input id="game-answer" aria-label="اكتب بالإنجليزي" autoComplete="off" spellCheck={false} dir="ltr" value={answer} onChange={(event) => setAnswer(event.target.value)} autoFocus />
            <button className="button" type="submit">تحقق ←</button>
          </form>
          <p role="status" data-testid="game-feedback">{game.last === "wrong" ? "جرّب مرة أخرى" : game.last === "correct" ? "إجابة صحيحة ✓" : game.last === "skipped" ? "انتقلت إلى كلمة أخرى" : ""}</p>
          <div className="game-actions"><button onClick={hear} type="button">🔊 استمع</button><button onClick={() => { setGame(skipGame); setAnswer(""); }} type="button">لا أعرفها، التالية ←</button></div>
        </div>}
        {game.phase === "finished" && <div className="game-center"><h2>انتهت الدقيقة</h2><p>أجبت عن {game.correct} كلمة، وتجاوزت {game.skipped}، وأخطأت {game.mistakes} مرة.</p><button className="button" onClick={start}>جولة جديدة ←</button></div>}
      </div>}
    </section>
  );
}
