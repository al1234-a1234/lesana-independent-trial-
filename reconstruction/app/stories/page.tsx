"use client";
import Link from "next/link";
import { useState } from "react";
import { stories } from "@/lib/catalog";
import { useData } from "@/components/data-provider";
import { StoryCover } from "@/components/story-cover";
export default function StoriesPage(){
 const {data}=useData(),[level,setLevel]=useState("الكل"),[query,setQuery]=useState("");
 const items=stories.filter((s)=>(level==="الكل"||s.level===level)&&(`${s.title} ${s.titleEn}`.toLowerCase().includes(query.toLowerCase())));
 return <div className="catalog-page"><div className="page-heading"><span className="kicker">مكتبة القصص</span><h1>قصة قصيرة. خطوة أكبر.</h1><p>اختر ما يثير فضولك، واستمع ثم اكتب الجمل بنفسك.</p></div>
 <div className="catalog-tools"><div className="filter-pills" role="group" aria-label="مستوى القصص">{["الكل","A1","A2","B1"].map((x)=><button key={x} className={level===x?"selected":""} onClick={()=>setLevel(x)}>{x}</button>)}</div><input type="search" aria-label="ابحث عن قصة" placeholder="ابحث عن قصة" value={query} onChange={(e)=>setQuery(e.target.value)}/></div>
 {!data?<div className="catalog-grid">{[1,2,3].map((x)=><div className="catalog-skeleton" key={x} role="status">نحمّل قصصك…</div>)}</div>:items.length?<div className="catalog-grid">{items.map((s)=>{const done=data.records.filter((r)=>r.lineId.startsWith(s.slug+"-")).length;return <Link className="catalog-card" href={`/stories/${s.slug}`} key={s.slug}><div className="catalog-cover"><StoryCover cover={s.cover} theme={s.theme} alt={s.title}/><span>{s.level}</span></div><div className="catalog-card-body"><h2 lang="en" dir="ltr">{s.titleEn}</h2><p>{s.title}</p><small>{s.description}</small><div>{done}/{s.lines.length} أسطر <b>←</b></div></div></Link>})}</div>:<div className="catalog-empty">لا توجد قصص بهذه المعايير. <button onClick={()=>{setLevel("الكل");setQuery("")}}>عرض كل القصص</button></div>}
 </div>;
}
