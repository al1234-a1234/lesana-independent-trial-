"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import core from "@/content/core-vocabulary.json";
import { useData } from "@/components/data-provider";
export default function CorePractice(){
 const {group}=useParams<{group:string}>(),g=core.find((x)=>x.id===group),{data,mutate}=useData();
 const [index,setIndex]=useState(0),[answer,setAnswer]=useState(""),[answers,setAnswers]=useState<string[]>([]),[feedback,setFeedback]=useState<"right"|"wrong"|null>(null),[saved,setSaved]=useState(false),[error,setError]=useState("");
 if(!g)return <div className="words-empty">المجموعة غير موجودة. <Link href="/words/core">ارجع للمجموعات</Link></div>;
 const prior=data?.coreGroups.find((x)=>x.groupId===`${g.level}-${g.number-1}`),locked=g.number>1&&(!prior||prior.score<4);
 if(locked)return <div className="words-empty"><h1>هذه المجموعة لم تُفتح بعد</h1><Link href="/words/core">ارجع للمجموعات</Link></div>;
 const practice=g.words.slice(0,5),word=practice[index];
 async function next(){const all=[...answers,answer];if(index<4){setAnswers(all);setIndex(index+1);setAnswer("");setFeedback(null)}else{try{await mutate({type:"core",groupId:group,answers:all});setSaved(true)}catch{setError("تعذر حفظ النتيجة. حاول مرة أخرى.")}}}
 function check(e:React.FormEvent){e.preventDefault();if(!answer.trim())return;setFeedback(answer.trim().toLowerCase()===word.en.toLowerCase()?"right":"wrong")}
 return <div className="practice-page"><Link href="/words/core">→ المجموعات</Link><div className="practice-panel"><span className="kicker">{g.level} · المجموعة {g.number}</span>{saved?<><h1>أنهيت التدريب</h1><p>نتيجتك محفوظة. يمكنك فتح المجموعة التالية إذا أجبت عن 4 كلمات أو أكثر.</p><Link className="green-button" href="/words/core">العودة للمجموعات ←</Link></>:<><div className="practice-progress">{index+1} من 5</div><h1>{word.ar}</h1><p>اكتب الكلمة الإنجليزية</p><form onSubmit={check}><input aria-label="الإجابة الإنجليزية" dir="ltr" value={answer} onChange={(e)=>setAnswer(e.target.value)} autoComplete="off" spellCheck={false}/><button className="green-button">تحقق</button></form>{feedback&&<div role="status" className={feedback==="right"?"practice-right":"practice-wrong"}>{feedback==="right"?"صحيح ✓":`الكلمة: ${word.en}`}</div>}{feedback&&<button className="plain-button" onClick={()=>void next()}>التالي ←</button>}{error&&<p role="alert">{error}</p>}</>}</div></div>
}
