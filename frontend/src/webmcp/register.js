// Descriptions and schemas live in the public, site-specific webmcp.json manifest.
function validateInput(input,schema) {
  if (!input || typeof input!=='object' || Array.isArray(input)) throw new Error('Provide an input object.');
  if (Object.keys(input).some(key=>!Object.hasOwn(schema.properties,key))) throw new Error('Unexpected input field.');
  for (const key of schema.required || []) if (!Object.hasOwn(input,key)) throw new Error(`Missing ${key}.`);
  for (const [key,value] of Object.entries(input)) {
    const rule=schema.properties[key];
    if (rule.type==='string' && (typeof value!=='string' || value.trim().length<(rule.minLength || 0) || value.length>(rule.maxLength || Infinity))) throw new Error(`Check ${key}.`);
    if (rule.type==='integer' && (!Number.isSafeInteger(value) || value<rule.minimum || value>rule.maximum)) throw new Error(`Check ${key}.`);
    if (rule.enum && !rule.enum.includes(value)) throw new Error(`Check ${key}.`);
    if (rule.pattern && !new RegExp(rule.pattern).test(value)) throw new Error(`Check ${key}.`);
    if (rule.format==='email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Enter a valid email address.');
  }
  return input;
}
const publicArticle=article=>({id:String(article._id),title:String(article.title || ''),summary:String(article.summary || ''),
  category:String(article.category || ''),url:`https://thenobiasmedia.com/article/${article._id}`});
export async function registerSiteTools({context,manifest,navigate,getArticles,getArticle,getArticleByCategory,signal,legacy=false}) {
  if (!context?.registerTool || signal?.aborted) return;
  const actions={
    list_public_articles:async(input,executionSignal)=>{
      const feed=input.category ? await getArticleByCategory(input.category,input.page || 1,executionSignal) : await getArticles(input.page || 1,executionSignal);
      return {status:'ok',articles:feed.articles.map(publicArticle),page:feed.currentPage,totalPages:feed.totalPages};
    },
    get_public_article:async(input,executionSignal)=>{
      const article=await getArticle(input.id,true,executionSignal);
      if (String(article._id)!==input.id) throw new Error('Article not found.');
      const sources=(article.source || []).filter(source=>{
        try {return ['https:','http:'].includes(new URL(source.url).protocol);} catch {return false;}
      }).map(source=>({url:source.url,label:String(source.source_type || 'Source')}));
      return {status:'ok',article:{...publicArticle(article),body:String(article.content || ''),sources}};
    },
    prepare_inquiry:async input=>{
      if (document.querySelector('[data-inquiry-dirty="true"]')) throw new Error('An unsent inquiry is already open. Ask the visitor to finish or clear it before preparing another.');
      navigate('/contact',{state:{inquiryDraft:input}});
      return {status:'awaiting_user_review',path:'/contact',message:'Draft prepared only. The visitor must review the visible form, agree to being contacted, and click Send. Nothing has been submitted.'};
    }
  };
  const registered=[];
  const cleanup=()=>{
    if (typeof context.unregisterTool==='function') for (const name of registered) {
      try {context.unregisterTool(name);} catch { /* Newer implementations use AbortSignal. */ }
    }
  };
  signal?.addEventListener('abort',cleanup,{once:true});
  for (const definition of manifest.tools) {
    if (signal?.aborted) break;
    if (!actions[definition.name]) continue;
    const execute=async(input,client={})=>{
      let result;
      try {
        if (signal?.aborted || client.signal?.aborted) throw new Error('Tool execution canceled.');
        validateInput(input,definition.inputSchema);
        result=await actions[definition.name](input,client.signal);
      } catch(error) {result={status:'error',message:error.message || 'The request could not be completed.'};}
      return legacy ? {content:[{type:'text',text:JSON.stringify(result)}]} : result;
    };
    try {
      await context.registerTool({name:definition.name,description:definition.description,
        inputSchema:definition.inputSchema,annotations:definition.annotations,execute},{signal});
      registered.push(definition.name);
      if (signal?.aborted) cleanup();
    } catch { /* Browser policy or unavailable preview support must not break the website. */ }
  }
}
