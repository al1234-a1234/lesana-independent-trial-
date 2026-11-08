"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { flush, pending, state } from "@/lib/client-store";
import type { AppState } from "@/lib/types";
import type { PersonalAction } from "@/lib/personal";
type Data = {
  data: AppState | null;
  error: string;
  queue: number;
  refresh: () => Promise<void>;
  update: (s: AppState) => void;
  mutate: (action: PersonalAction) => Promise<void>;
};
const Context = createContext<Data | null>(null);
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppState | null>(null),
    [error, setError] = useState(""),
    [queue, setQueue] = useState(0);
  const refresh = useCallback(async () => {
    try {
      const initial = await state();
      setData(initial);
      const saved = await flush();
      if (saved) setData(saved);
      setQueue(pending().length);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الاتصال");
    }
  }, []);
  useEffect(() => {
    void refresh();
    const update = () => setQueue(pending().length);
    const online = () => void refresh();
    window.addEventListener("online", online);
    window.addEventListener("satr-pending", update);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("satr-pending", update);
    };
  }, [refresh]);
  const mutate = useCallback(async (action: PersonalAction) => {
    const response=await fetch("/api/personal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(action)});
    if(!response.ok) throw new Error(`Could not save (${response.status})`);
    setData(await response.json());
  },[]);
  return (
    <Context.Provider value={{ data, error, queue, refresh, update: setData, mutate }}>
      {children}
    </Context.Provider>
  );
}
export function useData() {
  const data = useContext(Context);
  if (!data) throw new Error("DataProvider required");
  return data;
}
