import { Art } from "./art";
export function StoryCover({cover,theme,alt}:{cover?:string;theme:string;alt:string}) {
  return cover ? <img className="story-cover-image" src={cover} alt={alt} /> : <Art theme={theme}/>;
}
