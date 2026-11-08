import Link from "next/link";
import { notFound } from "next/navigation";
import { stories } from "@/lib/catalog";
import { StoryCover } from "@/components/story-cover";
import { StoryProgress } from "@/components/story-progress";
export function generateStaticParams(){return stories.map((s)=>({slug:s.slug}))}
export default async function Detail({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params,story=stories.find((s)=>s.slug===slug);if(!story)notFound();
 return <div className="detail-page"><div className="detail-hero"><StoryCover cover={story.cover} theme={story.theme} alt={story.title}/><div className="detail-shade"/><div className="detail-content"><span className="level-badge">{story.level} · {story.lines.length} جمل</span><h1 lang="en" dir="ltr">{story.titleEn}</h1><h2>{story.title}</h2><p>{story.description}</p><StoryProgress ids={story.lines.map((l)=>l.id)}/><Link className="green-button" href={`/story/${story.slug}`}>ابدأ القصة ←</Link></div></div><div className="detail-lower"><h2>جمل في هذه القصة</h2><p>تسمع كل جملة، تقرأ معناها، ثم تكتبها حرفًا حرفًا.</p><div className="detail-line-grid">{story.lines.slice(0,3).map((line,i)=><div key={i}><span>0{i+1}</span><p lang="en" dir="ltr">{line.text}</p><small>{line.ar}</small></div>)}</div><Link href="/stories">→ كل القصص</Link></div></div>;
}
