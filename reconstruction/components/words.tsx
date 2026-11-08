"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { allLines } from "@/lib/catalog";
import core from "@/content/core-vocabulary.json";
import { knownWords } from "@/lib/known-game";
import { useData } from "./data-provider";
const knownAudio=new Set(allLines.map((l)=>l.keyword.en.toLowerCase()));
const allWords=[...new Map([...core.flatMap((g)=>g.words),...allLines.map((l)=>({en:l.keyword.en,ar:l.keyword.ar,source:"original-story"})),...knownWords.map((w)=>({en:w.en,ar:w.ar,source:"known-game"}))].map((w)=>[w.en.toLowerCase(),w])).values()];
function speak(word:string){
 if(knownAudio.has(word.toLowerCase())) void new Audio(`/audio/word-${word.toLowerCase()}.mp3`).play().catch(()=>{});
 else if("speechSynthesis" in window){const u=new SpeechSynthesisUtterance(word);u.lang="en-US";u.rate=.9;window.speechSynthesis.speak(u)}
}
export function Words(){
 const {data,mutate}=useData(),[tab,setTab]=useState<"learned"|"favorites"|"discover">("learned"),[query,setQuery]=useState(""),[page,setPage]=useState(0),[saving,setSaving]=useState("");
 const learned=new Set([...allLines.filter((l)=>data?.records.some((r)=>r.lineId===l.id)).map((l)=>l.keyword.en.toLowerCase()),...(data?.knownWords??[])]);
 const favorites=new Set(data?.favoriteWords??[]);
 const filtered=useMemo(()=>allWords.filter((w)=>(tab==="discover" || (tab==="learned"?learned.has(w.en.toLowerCase()):favorites.has(w.en))) && (`${w.en} ${w.ar}`.toLowerCase().includes(query.toLowerCase()))),[tab,query,data]);
 const shown=filtered.slice(page*12,page*12+12);
 async function favorite(word:string){setSaving(word);try{await mutate({type:"favorite",word,enabled:!favorites.has(word)})}finally{setSaving("")}}
 return <div className="words-page"><div className="page-heading"><span className="kicker">كلماتي</span><h1>كل كلمة، خطوة.</h1><p>الكلمات التي تعلمتها، أو حفظتها للمراجعة، في مكان واحد.</p></div><div className="word-tabs" role="tablist">{([["learned","تعلمتها"],["favorites","المفضلة"],["discover","اكتشف كلمات"]] as const).map(([value,label])=><button key={value} role="tab" aria-selected={tab===value} onClick={()=>{setTab(value);setPage(0);setQuery("")}}>{label}</button>)}<Link href="/words/core">الكلمات الأساسية ←</Link></div>
 <div className="word-toolbar"><input type="search" value={query} onChange={(e)=>{setQuery(e.target.value);setPage(0)}} placeholder="ابحث عن كلمة" aria-label="ابحث عن كلمة"/><span>{filtered.length} كلمة في هذا القسم</span></div>
 {data===null?<div className="words-empty" role="status">نحمّل كلماتك…</div>:filtered.length===0?<div className="words-empty"><span className="empty-star">★</span><h2>{tab==="favorites"?"لا توجد كلمات مفضلة بعد":"لا توجد كلمات هنا بعد"}</h2><p>{tab==="favorites"?"احفظ الكلمات التي تحب العودة إليها بالنجمة.":"اقرأ قصة واكتب جملها، أو ابدأ من اكتشف كلمات."}</p><Link className="green-button" href="/stories">اقرأ قصة ←</Link></div>:<><div className="vocab-grid">{shown.map((w)=><article className="vocab-card" key={w.en}><div className="vocab-card-top"><button aria-label={`اسمع ${w.en}`} onClick={()=>speak(w.en)}>▷</button><button aria-label={favorites.has(w.en)?`إزالة ${w.en} من المفضلة`:`أضف ${w.en} للمفضلة`} aria-pressed={favorites.has(w.en)} disabled={saving===w.en} onClick={()=>void favorite(w.en)}>{favorites.has(w.en)?"★":"☆"}</button></div><h2 lang="en" dir="ltr">{w.en}</h2><p>{w.ar}</p><small>{learned.has(w.en.toLowerCase())?"تعلمتها في قصة":favorites.has(w.en)?"في المفضلة":"كلمة جديدة"}</small></article>)}</div><div className="page-controls"><button disabled={page===0} onClick={()=>setPage((n)=>n-1)}>السابق →</button><span>{page+1} / {Math.ceil(filtered.length/12)}</span><button disabled={(page+1)*12>=filtered.length} onClick={()=>setPage((n)=>n+1)}>← التالي</button></div></>}
 </div>
}
