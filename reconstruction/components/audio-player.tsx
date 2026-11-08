"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
export type AudioHandle = { play: () => void; stop: () => void };
export const AudioPlayer = forwardRef<
  AudioHandle,
  {
    src: string;
    text: string;
    rate: number;
    autoplay: boolean;
    onReplay: () => void;
  }
>(function AudioPlayer({ src, text, rate, autoplay, onReplay }, ref) {
  const currentRate = useRef(rate);
  const audio = useRef<HTMLAudioElement>(null),
    [playing, setPlaying] = useState(false),
    [error, setError] = useState("");
  function fallback() {
    const voices = window.speechSynthesis?.getVoices() ?? [];
    const voice = voices.find((v) => v.lang.startsWith("en"));
    if (!voice) {
      setError(
        "تعذّر تحميل الصوت، ولا يوجد صوت إنجليزي بديل على جهازك. يمكنك متابعة الكتابة.",
      );
      return;
    }
    const speech = new SpeechSynthesisUtterance(text);
    speech.voice = voice;
    speech.rate = rate;
    speech.onend = () => setPlaying(false);
    speech.onerror = () => {
      setPlaying(false);
      setError("تعذّر تشغيل الصوت البديل.");
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
    setError("نستخدم نطق الجهاز بدل الملف الصوتي.");
    setPlaying(true);
  }
  function play() {
    const el = audio.current;
    if (!el) return;
    setError("");
    el.currentTime = 0;
    el.playbackRate = rate;
    el.preservesPitch = true;
    void el
      .play()
      .then(() => setPlaying(true))
      .catch((e) => {
        if (e.name === "NotAllowedError") {
          setError("اضغط اسمع للسماح بتشغيل الصوت.");
          setPlaying(false);
        } else fallback();
      });
  }
  function stop() {
    audio.current?.pause();
    window.speechSynthesis?.cancel();
    setPlaying(false);
  }
  useImperativeHandle(ref, () => ({ play, stop }));
  useEffect(() => {
    currentRate.current = rate;
    if (audio.current) audio.current.playbackRate = rate;
  }, [rate]);
  useEffect(() => {
    const timer = autoplay
      ? setTimeout(() => {
          if (audio.current) {
            audio.current.playbackRate = currentRate.current;
            void audio.current
              .play()
              .then(() => setPlaying(true))
              .catch(() => setPlaying(false));
          }
        }, 100)
      : undefined;
    return () => {
      clearTimeout(timer);
      audio.current?.pause();
      window.speechSynthesis?.cancel();
    };
  }, [src, autoplay]);
  return (
    <div className="audio-controls">
      <audio
        ref={audio}
        src={src}
        preload="auto"
        data-testid="line-audio"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onError={() =>
          setError("ملف الصوت غير متاح. اضغط اسمع لتجربة نطق الجهاز.")
        }
      />
      <button
        type="button"
        className="button audio-button"
        onClick={() => {
          if (playing) stop();
          else {
            onReplay();
            play();
          }
        }}
      >
        {playing ? "Ⅱ إيقاف" : "▷ اسمع الجملة"}
      </button>
      <span className="audio-speed">{rate}×</span>
      {error && (
        <p role="alert" className="audio-error">
          {error}
        </p>
      )}
    </div>
  );
});
