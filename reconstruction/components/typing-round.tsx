"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { accuracy, advance, initialState, inputValue, marks, prepareTarget } from "@/lib/engine";
import core from "@/content/core-vocabulary.json";
import type { Line } from "@/lib/catalog";
import { sound } from "@/lib/audio";
export type Result = { inputs:string[];durationMs:number;correct:number;wrong:number;accuracy:number };
const meaning = new Map(core.flatMap((g)=>g.words.map((w)=>[w.en.toLowerCase(),w.ar])));
export function TypingRound({line,punctuation,hidden,sounds,onDone,onReplay}:{line:Line;punctuation:boolean;hidden:boolean;sounds:boolean;onDone:(r:Result)=>void;onReplay:()=>void}){
 const target=prepareTarget(line.text,punctuation);
 const [state,setState]=useState(()=>initialState(target.length)),[selected,setSelected]=useState<string|null>(null),[composing,setComposing]=useState(false),[draft,setDraft]=useState("");
 const current=useRef(state),history=useRef<string[]>([]),started=useRef<number|null>(null),input=useRef<HTMLInputElement>(null);
 const status=marks(state,target);
 const tokens=useMemo(()=>target.match(/\S+|\s+/g)??[],[target]);
 useEffect(()=>{
  input.current?.focus();
  const focus=()=>input.current?.focus();
  window.addEventListener("focus-typing",focus);
  return()=>window.removeEventListener("focus-typing",focus);
 },[]);
 function change(raw:string){
  if(current.current.done)return;
  started.current??=performance.now();history.current.push(raw);
  const next=advance(current.current,raw,target,punctuation);
  if(sounds && raw.length>current.current.typed.length) sound(next.wrong===current.current.wrong);
  current.current=next;setState(next);
  if(next.done) onDone({inputs:history.current,durationMs:Math.max(1,Math.round(performance.now()-(started.current??performance.now()))),correct:next.correct,wrong:next.wrong,accuracy:accuracy(next)});
 }
 let offset=0;
 const charNodes=tokens.map((token,ti)=>{
  const start=offset;offset+=token.length;
  const isWord=/[A-Za-z]/.test(token);
  const clean=token.toLowerCase().replace(/[^a-z']/g,"");
  return <span key={ti} className={isWord?"typing-word":"typing-space"} onClick={(event)=>{event.stopPropagation();if(isWord)setSelected(clean);input.current?.focus()}}>{[...token].map((c,j)=>{const i=start+j;return <span key={i} data-i={i} data-mark={status[i]} className={`char mark-${status[i]} ${i===state.typed.length?"caret":""} ${hidden && status[i]===0 && /[a-z0-9]/i.test(c)?"hidden-char":""}`}>{c===" "?(status[i]===3?"·":"\u00a0"):c}</span>})}</span>;
 });
 const selectedMeaning=selected===line.keyword.en.toLowerCase()?line.keyword.ar:meaning.get(selected??"");
 const nextChar=target[state.typed.length];
 return <>
  <div className="target-text immersive-target" lang="en" dir="ltr" data-testid="target" aria-label={hidden?"الجملة مخفية للاستماع":target} onClick={()=>input.current?.focus()}>{charNodes}</div>
  <input ref={input} className="immersive-keyboard-input" data-testid="typing-input" aria-label="اكتب الجملة بالإنجليزية" value={composing?draft:inputValue(state,target,punctuation)} onChange={(e)=>{if(composing)setDraft(e.target.value);else change(e.target.value)}} onCompositionStart={(e)=>{setComposing(true);setDraft(e.currentTarget.value)}} onCompositionEnd={(e)=>{setComposing(false);change(e.currentTarget.value)}} onKeyDown={(e)=>{if(e.key==="\\"){e.preventDefault();onReplay()}}} autoCorrect="off" autoComplete="off" autoCapitalize="none" spellCheck={false} inputMode="text" enterKeyHint="done" lang="en" dir="ltr" disabled={state.done} maxLength={target.length+10}/>
  {selected&&<div className="word-tooltip" role="status"><span lang="en" dir="ltr">{selected}</span><strong>{selectedMeaning??"كلمة من الجملة"}</strong><button aria-label="إغلاق معنى الكلمة" onClick={()=>setSelected(null)}>×</button></div>}
  {!state.done&&nextChar&&<div className="typing-helper"><kbd>{nextChar.toUpperCase()}</kbd><span>الحرف التالي</span></div>}
  {state.arabicHits>=2&&<p role="alert" className="notice error">لوحة مفاتيحك عربية. بدّل إلى الإنجليزية ثم أكمل.</p>}
  {state.retried&&!state.typed&&!state.done&&<p role="alert" className="notice">أغلب الجملة لم يطابق. جرّب مرة أخرى على مهلك.</p>}
  <div className="typing-stat" aria-label="نتيجة الجملة"><span>الدقة <b data-testid="accuracy">{Math.round(accuracy(state)*100)}%</b></span><span>{state.wrong} أخطاء</span></div>
  <button className="typing-focus-button" type="button" onClick={()=>input.current?.focus()}>{state.done?"✓ اكتمل السطر":"اضغط هنا لمواصلة الكتابة"}</button>
 </>;
}
