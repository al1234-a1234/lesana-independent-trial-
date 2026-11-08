"use client";
import Link from "next/link";
import { useState } from "react";
import { stories } from "@/lib/catalog";
import { useData } from "./data-provider";
import { StoryCover } from "./story-cover";
export function Dashboard() {
  const {data}=useData();
  const [slide,setSlide]=useState(0);
  const ordered=[stories.find((s)=>s.slug==="i-can-start")!, ...stories.filter((s)=>s.slug!=="i-can-start")];
  const records=data?.records??[];
  const progress=(slug:string)=>records.filter((r)=>r.lineId.startsWith(slug+"-")).length;
  const current=ordered.find((s)=>progress(s.slug)>0 && progress(s.slug)<s.lines.length)??ordered[0];
  const count=progress(current.slug), due=records.filter((r)=>r.dueAt<=Date.now()).length;
  const promo=ordered[slide%ordered.length];
  return <div className="home-page">
    <section className="promo-banner" aria-label="قصص جديدة">
      <div className="promo-art"><StoryCover cover={promo.cover} theme={promo.theme} alt={promo.title}/></div>
      <div className="promo-overlay"/>
      <div className="promo-copy"><span>قصص قصيرة، سطر جديد كل يوم</span><h1>حكايات جديدة<br/>تنتظرك.</h1><p>{promo.titleEn} · {promo.title}</p><Link href={`/stories/${promo.slug}`} className="green-button">اكتشف القصة ←</Link></div>
      <div className="promo-arrows"><button aria-label="القصة السابقة" onClick={()=>setSlide((n)=>(n+ordered.length-1)%ordered.length)}>→</button><button aria-label="القصة التالية" onClick={()=>setSlide((n)=>(n+1)%ordered.length)}>←</button></div>
    </section>
    <div className="home-greeting"><p>مساء الخير،</p><h2>أهلًا يا <span>زائر</span> 👋</h2><p>سطر واحد اليوم يصنع فرقًا غدًا.</p></div>
    <div className="home-section-heading"><h2>{count>0?"كمّل من آخر سطر":"ابدأ رحلتك"}</h2><Link href="/stories">كل القصص ←</Link></div>
    <section className="continue-card">
      <div className="continue-art"><StoryCover cover={current.cover} theme={current.theme} alt={current.title}/></div>
      <div className="continue-copy"><span className="level-badge">{current.level} · مبتدئ</span><h3 lang="en" dir="ltr">{current.titleEn}</h3><p>{current.title}</p><div className="continue-meta"><span>{current.lines.length} أسطر</span><span>{count}/{current.lines.length} مكتمل</span></div><div className="continue-track"><i style={{width:`${count/current.lines.length*100}%`}}/></div><Link className="green-button" href={`/story/${current.slug}`}>{count?"تابع القصة":"ابدأ القصة"} ←</Link></div>
    </section>
    <div className="home-quick-grid"><Link href="/review"><b>↻</b><span><strong>{due} مراجعة مستحقة</strong><small>الجمل التي تعود إليك</small></span></Link><Link href="/words/core"><b>◈</b><span><strong>الكلمات الأساسية</strong><small>مجموعات من A1 إلى C1</small></span></Link><Link href="/texts"><b>▷</b><span><strong>نصوص للاستماع</strong><small>استمع ثم أجب</small></span></Link></div>
  </div>;
}
