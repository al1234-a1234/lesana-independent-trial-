"use client";
import { useData } from "./data-provider";
export function StoryProgress({ids}:{ids:string[]}){
 const {data}=useData();
 const completed=ids.filter((id)=>data?.records.some((r)=>r.lineId===id)).length;
 return <p className="detail-progress" role="status">{completed}/{ids.length} أسطر مكتملة</p>;
}
