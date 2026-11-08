import { notFound } from "next/navigation";
import passages from "@/content/passages.json";
import { PassagePlayer } from "@/components/passage-player";
export function generateStaticParams(){return passages.map((p)=>({slug:p.slug}))}
export default async function PassagePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params,passage=passages.find((p)=>p.slug===slug);if(!passage)notFound();return <PassagePlayer passage={passage}/>}
