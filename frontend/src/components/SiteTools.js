import {useEffect,useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {getArticles,getArticle,getArticleByCategory} from '../services/api';
import {registerSiteTools} from '../webmcp/register';
export default function SiteTools() {
  const navigate=useNavigate();
  const navigateRef=useRef(navigate);
  navigateRef.current=navigate;
  useEffect(()=>{
    const context=document.modelContext || navigator.modelContext;
    if (!context?.registerTool) return;
    const controller=new AbortController();
    fetch('/webmcp.json',{credentials:'omit',signal:controller.signal})
      .then(response=>{if (!response.ok) throw new Error('Manifest unavailable');return response.json();})
      .then(manifest=>registerSiteTools({context,manifest,navigate:(...args)=>navigateRef.current(...args),getArticles,getArticle,getArticleByCategory,
        signal:controller.signal,legacy:!document.modelContext}))
      .catch(()=>{/* The standard contact form and reader work without WebMCP. */});
    return ()=>controller.abort();
  },[]);
  return null;
}
