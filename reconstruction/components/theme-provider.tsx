"use client";
import { createContext, useContext, useEffect, useState } from "react";
const ThemeContext=createContext<{theme:"light"|"dark";toggle:()=>void}>({theme:"light",toggle:()=>{}});
export function ThemeProvider({children}:{children:React.ReactNode}) {
  const [theme,setTheme]=useState<"light"|"dark">("light");
  useEffect(()=>{
    const saved=localStorage.getItem("lesana-trial-theme");
    if(saved==="dark" || saved==="light") setTheme(saved);
  },[]);
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem("lesana-trial-theme",theme);},[theme]);
  return <ThemeContext.Provider value={{theme,toggle:()=>setTheme((x)=>x==="light"?"dark":"light")}}>{children}</ThemeContext.Provider>;
}
export function useTheme(){return useContext(ThemeContext)}
