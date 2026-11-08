"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useData } from "./data-provider";
import { useTheme } from "./theme-provider";
const navigation = [["/home","الرئيسية"],["/stories","القصص"],["/texts","النصوص"],["/tests","الاختبارات"],["/words","كلماتي"]] as const;
export function Shell({children}:{children:React.ReactNode}) {
  const pathname=usePathname(),{data,queue,error,refresh}=useData(),{theme,toggle}=useTheme();
  const [notifications,setNotifications]=useState(false);
  const learning=pathname.startsWith("/story/");
  if(learning) return <main className="learning-main">{children}</main>;
  if(pathname==="/challenge" || pathname==="/know")return <><header className="public-game-header"><Link href="/stories">جرّب قصة مجانية ←</Link><Link className="lesana-logo" href="/home"><span className="lesana-mark"><i/><i/><i/></span><strong>لسانا</strong></Link></header><main className="game-standalone">{children}</main></>;
  const due=data?.records.filter((r)=>r.dueAt<=Date.now()).length??0;
  return <>
    <header className="lesana-header">
      <div className="lesana-header-inner">
        <Link href="/home" className="lesana-logo" aria-label="لسانا الرئيسية"><span className="lesana-mark" aria-hidden="true"><i/><i/><i/></span><strong>لسانا</strong></Link>
        <nav aria-label="التنقل الرئيسي" className="lesana-nav">{navigation.map(([href,label])=><Link key={href} href={href} className={pathname===href || (href==="/stories" && pathname.startsWith("/stories/")) || (href==="/texts" && pathname.startsWith("/passages")) || (href==="/words" && pathname.startsWith("/words/"))?"active":""}>{label}</Link>)}</nav>
        <div className="header-tools">
          <Link href="/account" aria-label="مساحة الزائر" title="مساحة الزائر" className="avatar-link">ز</Link>
          <button aria-label={theme==="light"?"الوضع الداكن":"الوضع الفاتح"} title="تبديل المظهر" onClick={toggle}>{theme==="light"?"☾":"☀"}</button>
          <button aria-label="الإشعارات" title="الإشعارات" onClick={()=>setNotifications((x)=>!x)}>♧{due>0&&<b className="notification-count">{due}</b>}</button>
          {notifications&&<div className="notification-pop" role="status">{due?`لديك ${due} جمل للمراجعة.`:"لا توجد مراجعات مستحقة الآن."}<Link href="/review" onClick={()=>setNotifications(false)}>افتح المراجعة ←</Link></div>}
        </div>
      </div>
    </header>
    {error&&<div className="site-notice" role="alert">{error} <button onClick={()=>void refresh()}>إعادة الاتصال</button></div>}
    {queue>0&&<div className="site-notice" role="status" data-testid="pending-status">{queue} نتيجة تنتظر المزامنة. <button onClick={()=>void refresh()}>أعد المزامنة</button></div>}
    <main className="lesana-main">{children}</main>
    <footer className="lesana-footer"><span>لسانا · تجربة مستقلة للمالك</span><Link href="/review">المراجعة</Link><Link href="/account">خصوصيتك</Link></footer>
  </>;
}
