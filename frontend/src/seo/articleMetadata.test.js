const {updateMetadata}=require('./articleMetadata');
const article={_id:'507f1f77bcf86cd799439011',title:'First headline',summary:'Summary',content:'Body',category:'politics',imageUrl:'https://example.org/photo.jpg'};
afterEach(()=>updateMetadata(document,null));
test('article metadata changes on navigation without duplicate tags and resets on leaving the reader',()=>{
  updateMetadata(document,article);
  expect(document.title).toBe('First headline | The NoBias Media');
  expect(document.querySelector('link[rel="canonical"]').href).toContain(article._id);
  expect(JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent).headline).toBe(article.title);
  updateMetadata(document,{...article,_id:'507f1f77bcf86cd799439012',title:'Next headline'});
  expect(document.title).toBe('Next headline | The NoBias Media');
  expect(document.querySelectorAll('meta[property="og:title"]')).toHaveLength(1);
  expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
  updateMetadata(document,null);
  expect(document.title).toBe('The NoBias Media');
  expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
});
test('head updates treat headline markup as text and exclude non-HTTP images',()=>{
  updateMetadata(document,{...article,title:'<img src=x onerror=alert(1)>',imageUrl:'javascript:alert(1)'});
  expect(document.head.querySelector('img')).toBeNull();
  expect(document.querySelector('meta[property="og:image"]')).toBeNull();
  expect(document.title).toBe('<img src=x onerror=alert(1)> | The NoBias Media');
});

test('site JSON-LD survives article navigation and cleanup without duplicates',()=>{
  const site=document.createElement('script');
  site.type='application/ld+json';
  site.setAttribute('data-nbm-site','');
  site.textContent=JSON.stringify({'@context':'https://schema.org','@type':'WebSite'});
  document.head.appendChild(site);
  try {
    updateMetadata(document,article);
    updateMetadata(document,{...article,title:'Next headline'});
    expect(document.querySelectorAll('script[data-nbm-site]')).toHaveLength(1);
    expect(document.querySelectorAll('script[data-nbm-meta]')).toHaveLength(1);
    const news=JSON.parse(document.querySelector('script[data-nbm-meta]').textContent);
    expect(news.publisher['@id']).toBe('https://thenobiasmedia.com/#organization');
    expect(news.isPartOf['@id']).toBe('https://thenobiasmedia.com/#website');
    updateMetadata(document,null);
    expect(document.querySelector('script[data-nbm-site]')).toBe(site);
    expect(document.querySelector('script[data-nbm-meta]')).toBeNull();
  } finally {
    site.remove();
  }
});
