"use client";
import Link from "next/link";
import { useState } from "react";
import core from "@/content/core-vocabulary.json";
import { useData } from "@/components/data-provider";
export default function Core(){
 const {data}=useData(),[level,setLevel]=useState("A1");
 const groups=core.filter((g)=>g.level===level);
 return <div className="core-page"><div className="page-heading"><span className="kicker">الكلمات الأساسية</span><h1>مجموعات صغيرة، تقدم واضح.</h1><p>كل مجموعة تضم 20 كلمة؛ تمرين قصير يفتح المجموعة التالية.</p></div><div className="core-levels" role="group" aria-label="مستوى الكلمات">{["A1","A2","B1","B2","C1"].map((x)=><button key={x} className={level===x?"active":""} onClick={()=>setLevel(x)}>{x}</button>)}</div><p className="core-count">{core.reduce((n,g)=>n+g.words.length,0)} كلمة في هذه النسخة التجريبية · {groups.length} مجموعات في {level}</p><div className="core-grid">{groups.map((g)=>{const progress=data?.coreGroups.find((x)=>x.groupId===g.id);const prior=data?.coreGroups.find((x)=>x.groupId===`${g.level}-${g.number-1}`);const locked=g.number>1&&(!prior||prior.score<4);return <article key={g.id} className={`core-group ${locked?"locked":""}`}><div className="core-group-top"><span>المجموعة {g.number}</span><b>{locked?"مغلقة":(progress?.score??0)>=4?"مكتملة":"الحالية"}</b></div><p lang="en" dir="ltr">{g.words.slice(0,5).map((x)=>x.en).join(" · ")}</p><small>{g.words.length} كلمة · {progress?`أفضل نتيجة ${progress.score}/5`:"ابدأ التعلّم"}</small>{locked?<span className="core-lock">أكمل السابقة أولًا</span>:<Link href={`/words/core/${g.id}`}>افتح المجموعة ←</Link>}</article>})}</div><Link className="plain-back" href="/words">→ كلماتي</Link></div>
}
