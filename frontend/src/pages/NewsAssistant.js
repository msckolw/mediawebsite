import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import api from '../services/api';
import { prepareImageUpload } from '../services/imageUpload';
import '../styles/NewsAssistant.css';

const base = '/admin/assistant';
const categoryLabels = ['Progressive / Left', 'Center-Left', 'Center / Neutral', 'Center-Right', 'Right / Conservative'];
const today = () => new Date().toISOString().slice(0,10);
const initialAssignment = () => ({ topic:'', context:'', category:'politics', fromDate:today(), toDate:today(), outletIds:[], seedUrls:'', imageUrl:'', imageCaption:'', imageCredit:'' });
const emptyOutlet = () => ({ name:'', domains:[], category:categoryLabels[0], region:'Indian', country:'India', orientation:'', notes:'', access:'unknown', enabled:true });
const errorText = error => error.response?.data?.message || error.message || 'The request could not be completed.';
const displayStatus = status => ({queued:'Queued',running:'Research in progress',ready:'Awaiting your review',publishing:'Publication needs confirmation',failed:'Needs attention',published:'Published',rejected:'Rejected'}[status] || status);

function Field({ label, children }) {
  return <label className="assistant-field"><span>{label}</span>{children}</label>;
}

export default function NewsAssistant() {
  const { user, loading } = useSession();
  if (loading) return <p role="status">Checking your session…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <AssistantWorkspace />;
}

export function AssistantWorkspace() {
  const [tab,setTab] = useState('assignments');
  const [config,setConfig] = useState(null);
  const [outlets,setOutlets] = useState([]);
  const [jobs,setJobs] = useState([]);
  const [page,setPage] = useState(1);
  const [selectedId,setSelectedId] = useState('');
  const [job,setJob] = useState(null);
  const [draft,setDraft] = useState(null);
  const [dirty,setDirty] = useState(false);
  const [approval,setApproval] = useState(false);
  const [reviewNote,setReviewNote] = useState('');
  const [assignment,setAssignment] = useState(initialAssignment);
  const [outlet,setOutlet] = useState(emptyOutlet);
  const [outletId,setOutletId] = useState('');
  const [region,setRegion] = useState('');
  const [busy,setBusy] = useState(false);
  const [processing,setProcessing] = useState(false);
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const requestId = useRef(null);
  const imageVersion = useRef(0);
  const detailVersion = useRef(0);
  const invalidateDetail = useCallback(() => { ++detailVersion.current; },[]);
  const refresh = useCallback(async () => {
    const [c,o,j] = await Promise.all([api.get(`${base}/config`),api.get(`${base}/outlets`),api.get(`${base}/assignments?page=${page}`)]);
    setConfig(c.data); setOutlets(o.data); setJobs(j.data);
  },[page]);
  useEffect(() => {
    let active = true;
    refresh().catch(e => { if (active) setError(errorText(e)); });
    return () => { active = false; };
  },[refresh]);
  const loadJob = useCallback(async id => {
    const version = ++detailVersion.current;
    const result = await api.get(`${base}/assignments/${id}`);
    if (version !== detailVersion.current) return;
    setJob(result.data); setDraft(result.data.draft || null); setDirty(false); setApproval(false);
  },[]);
  useEffect(() => {
    if (!selectedId) return;
    loadJob(selectedId).catch(e => setError(errorText(e)));
    return invalidateDetail;
  },[selectedId,loadJob,invalidateDetail]);
  useEffect(() => {
    if (!selectedId || !job || !['queued','running'].includes(job.status)) return;
    let active = true; let pending = false;
    const timer = setInterval(async () => {
      if (pending) return; pending = true;
      try { if (active) { await loadJob(selectedId); await refresh(); } }
      catch (e) { if (active) setError(errorText(e)); }
      finally { pending = false; }
    },5000);
    return () => { active = false; clearInterval(timer); invalidateDetail(); };
  },[selectedId,job,loadJob,refresh,invalidateDetail]);
  const action = async task => {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try { await task(); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  };
  const assignmentChange = (key,value) => {
    requestId.current = null;
    setAssignment(current => ({...current,[key]:value}));
  };
  const imageChange = async event => {
    const file = event.target.files[0]; if (!file) return;
    const version = ++imageVersion.current;
    setProcessing(true); setError('');
    try {
      const image = await prepareImageUpload(file);
      if (version === imageVersion.current) assignmentChange('imageUrl',image);
    } catch (e) { if (version === imageVersion.current) setError(errorText(e)); }
    finally { if (version === imageVersion.current) setProcessing(false); }
  };
  const start = event => {
    event.preventDefault();
    action(async () => {
      requestId.current ||= crypto.randomUUID();
      const result = await api.post(`${base}/assignments`,{...assignment,requestId:requestId.current,
        seedUrls:assignment.seedUrls.split('\n').map(s => s.trim()).filter(Boolean)});
      setSelectedId(result.data._id); setJob(result.data); setTab('assignments');
      setAssignment(initialAssignment()); requestId.current = null;
      setMessage('Assignment saved. Research runs in the background.'); await refresh();
    });
  };
  const saveDraft = () => action(async () => {
    const result = await api.put(`${base}/assignments/${job._id}/draft`,{draft,revision:job.revision});
    setJob(current => ({...current,...result.data})); setDirty(false); setApproval(false); setMessage('Draft saved. Your edits have not been reviewed by Grok.');
  });
  const publish = () => action(async () => {
    const result = await api.post(`${base}/assignments/${job._id}/publish`,{revision:job.revision,approve:approval,reviewNote});
    await loadJob(job._id); await refresh(); setMessage(`Published successfully. Article ID: ${result.data.articleId}`);
  });
  const edit = (key,value) => { setDraft(current => ({...current,[key]:value})); setDirty(true); setApproval(false); };
  const visibleOutlets = outlets.filter(o => !region || o.region === region);
  return <div className="news-assistant">
    <header className="assistant-heading"><div><Link to="/admin">← Admin panel</Link><h1>News Assistant</h1><p>Search with Parallel. Write with Luna. Review with Grok. Publish with your approval.</p></div>
      {config && <aside><strong>Parallel + {config.models.writer} + {config.models.reviewer}</strong><p>${config.budget.estimatedAndReservedUsd.toFixed(2)} estimated/reserved of ${config.budget.allowanceUsd.toFixed(2)} this month</p></aside>}
    </header>
    {error && <div className="assistant-notice error" role="alert">{error}</div>}
    {message && <div className="assistant-notice" role="status">{message}</div>}
    {config && (!config.enabled || !config.configured) && <div className="assistant-notice">Research is unavailable until Parallel, OpenAI, and xAI API keys are configured and the assistant is enabled on the backend. You can still manage the source library.</div>}
    <nav className="assistant-tabs" aria-label="News assistant sections">{[['assignments','Assignments'],['new','New assignment'],['sources','Source library']].map(([key,label]) => <button key={key} aria-current={tab === key ? 'page' : undefined} onClick={() => setTab(key)}>{label}</button>)}</nav>

    {tab === 'new' && <form className="assistant-card" onSubmit={start}>
      <h2>New assignment</h2>
      <Field label="News topic"><input required maxLength={500} value={assignment.topic} onChange={e => assignmentChange('topic',e.target.value)} /></Field>
      <Field label="Context or editorial focus (optional)"><textarea maxLength={3000} value={assignment.context} onChange={e => assignmentChange('context',e.target.value)} /></Field>
      <div className="assistant-columns"><Field label="News category"><select value={assignment.category} onChange={e => assignmentChange('category',e.target.value)}>{(config?.articleCategories || []).map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Published from"><input type="date" required value={assignment.fromDate} onChange={e => assignmentChange('fromDate',e.target.value)} /></Field>
        <Field label="Published through"><input type="date" required value={assignment.toDate} onChange={e => assignmentChange('toDate',e.target.value)} /></Field></div>
      <fieldset><legend>Select up to eight outlets ({assignment.outletIds.length}/8)</legend>
        <Field label="Filter region"><select value={region} onChange={e => setRegion(e.target.value)}><option value="">All regions</option><option>Indian</option><option>International</option></select></Field>
        {categoryLabels.map(category => <div key={category} className="assistant-outlet-group"><h3>{category}</h3>{visibleOutlets.filter(o => o.enabled && o.category === category).map(o => <label key={o._id} className="assistant-check"><input type="checkbox" checked={assignment.outletIds.includes(o._id)} disabled={!assignment.outletIds.includes(o._id) && assignment.outletIds.length >= 8} onChange={e => assignmentChange('outletIds',e.target.checked ? [...assignment.outletIds,o._id] : assignment.outletIds.filter(id => id !== o._id))} />{o.name} <small>{o.region} · {o.access}</small></label>)}</div>)}
        {!outlets.length && <p>Add outlets in the source library first.</p>}
      </fieldset>
      <Field label="Known article URLs (optional, one per line)"><textarea value={assignment.seedUrls} onChange={e => assignmentChange('seedUrls',e.target.value)} placeholder="https://selected-outlet.com/article" /></Field>
      <Field label="Topic image"><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || processing} onChange={imageChange} /></Field>
      <p>Use an original landscape image at least 1200 × 675 pixels, up to 10 MB. Confirm permission to publish it.</p>
      {processing && <p role="status">Preparing image…</p>}
      {assignment.imageUrl && <img className="assistant-preview-image" src={assignment.imageUrl} alt="Selected assignment" />}
      <Field label="Image caption (optional)"><input maxLength={500} value={assignment.imageCaption} onChange={e => assignmentChange('imageCaption',e.target.value)} /></Field>
      <Field label="Image credit (optional)"><input maxLength={300} value={assignment.imageCredit} onChange={e => assignmentChange('imageCredit',e.target.value)} /></Field>
      <button className="assistant-primary" disabled={busy || processing || !assignment.imageUrl || !assignment.outletIds.length || !config?.enabled || !config?.configured}>{busy ? 'Saving assignment…' : 'Research and draft'}</button>
    </form>}

    {tab === 'sources' && <div className="assistant-workspace"><section className="assistant-card"><h2>Source library</h2><p>These labels are your editorial classifications. Review the proposed domains before using the imported library.</p>
      <button disabled={busy} onClick={() => action(async () => { const result = await api.post(`${base}/outlets/import-defaults`); setMessage(result.data.message); await refresh(); })}>Import media-sheet starter library</button>
      <p>NPR and PBS are separate entries. Existing entries will be preserved.</p>
      {outlets.map(o => <button className="assistant-list-row" key={o._id} onClick={() => {setOutlet(o);setOutletId(o._id);}}><strong>{o.name}</strong><span>{o.category} · {o.region}{!o.enabled ? ' · Disabled' : ''}</span></button>)}
    </section><form className="assistant-card" onSubmit={e => {e.preventDefault();action(async () => {
      if (outletId) await api.put(`${base}/outlets/${outletId}`,outlet); else await api.post(`${base}/outlets`,outlet);
      setOutlet(emptyOutlet());setOutletId('');setMessage('Source saved. Active assignments retain their original source settings.');await refresh();
    });}}><h2>{outletId ? 'Edit outlet' : 'Add outlet'}</h2>
      <Field label="Outlet name"><input required maxLength={150} value={outlet.name} onChange={e => setOutlet({...outlet,name:e.target.value})} /></Field>
      <Field label="Allowed domains (comma separated)"><input required value={outlet.domains.join(', ')} onChange={e => setOutlet({...outlet,domains:e.target.value.split(',').map(s => s.trim())})} placeholder="example.com" /></Field>
      <Field label="Bias category"><select value={outlet.category} onChange={e => setOutlet({...outlet,category:e.target.value})}>{categoryLabels.map(c => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Region"><select value={outlet.region} onChange={e => setOutlet({...outlet,region:e.target.value})}><option>Indian</option><option>International</option></select></Field>
      <Field label="Country"><input value={outlet.country || ''} onChange={e => setOutlet({...outlet,country:e.target.value})} /></Field>
      <Field label="Orientation"><input value={outlet.orientation || ''} onChange={e => setOutlet({...outlet,orientation:e.target.value})} /></Field>
      <Field label="Focus and notes"><textarea value={outlet.notes || ''} onChange={e => setOutlet({...outlet,notes:e.target.value})} /></Field>
      <Field label="Access"><select value={outlet.access} onChange={e => setOutlet({...outlet,access:e.target.value})}><option value="unknown">Unknown</option><option value="public">Public</option><option value="subscription">Subscription</option></select></Field>
      <label className="assistant-check"><input type="checkbox" checked={outlet.enabled} onChange={e => setOutlet({...outlet,enabled:e.target.checked})} />Enabled for new assignments</label>
      <div className="assistant-actions"><button className="assistant-primary" disabled={busy}>Save outlet</button><button type="button" onClick={() => {setOutlet(emptyOutlet());setOutletId('');}}>New outlet</button></div>
    </form></div>}

    {tab === 'assignments' && <div className="assistant-workspace"><section className="assistant-card"><h2>Assignments</h2><button disabled={busy} onClick={() => action(refresh)}>Refresh list</button>
      {!jobs.length && <p>No assignments yet. Create one to begin.</p>}
      {jobs.map(item => <button disabled={busy} className="assistant-list-row" aria-current={selectedId === item._id ? 'true' : undefined} key={item._id} onClick={() => {if (!dirty || window.confirm('Discard your unsaved draft edits?')) {if (selectedId === item._id) {action(() => loadJob(item._id));return;}setSelectedId(item._id);setJob(null);setDraft(null);setApproval(false);setReviewNote('');}}}><strong>{item.topic}</strong><span>{displayStatus(item.status)}</span><small>{new Date(item.createdAt).toLocaleString()}</small></button>)}
      <div className="assistant-actions"><button disabled={page <= 1} onClick={() => setPage(page-1)}>Previous</button><span>Page {page}</span><button disabled={jobs.length < 30} onClick={() => setPage(page+1)}>Next</button></div>
    </section><section className="assistant-card" aria-label="Assignment review">
      {!job ? <p>{selectedId ? 'Loading assignment…' : 'Select an assignment to see its research and draft.'}</p> : <>
        <h2>{job.topic}</h2><p><strong>{displayStatus(job.status)}</strong> · {job.stage}</p>
        <p>{job.fromDate} through {job.toDate} · {job.category}</p>
        {job.error && <p className="assistant-notice error">{job.error}</p>}
        {job.warnings?.length > 0 && <div className="assistant-notice"><h3>Coverage and review notes</h3><ul>{job.warnings.map((warning,i) => <li key={i}>{warning}</li>)}</ul></div>}
        {['queued','failed'].includes(job.status) && job.attempts < 3 && job.stage !== 'research_insufficient' && <button disabled={busy} onClick={() => action(async () => { await api.post(`${base}/assignments/${job._id}/retry`);await loadJob(job._id);await refresh();setMessage('Queued. An unfinished provider request may be billed again.');})}>Retry dispatch / resume</button>}
        {job.status === 'queued' && config?.queueMode === 'local' && <p>Waiting for the backend assistant worker to pick up this assignment.</p>}
        {job.imageUrl && <figure><img className="assistant-preview-image" src={job.imageUrl} alt={job.imageCaption || 'Assignment image'} /><figcaption>{job.imageCaption} {job.imageCredit && `Credit: ${job.imageCredit}`}</figcaption></figure>}
        {draft && <><h3>Article draft</h3><p>{job.humanEdited ? 'Includes your edits; Grok has not reviewed those edits.' : 'Check the source evidence and findings before approving.'}</p>
          {['title','summary','content'].map(key => <Field key={key} label={{title:'Title',summary:'Summary',content:'Full article'}[key]}>{key === 'title' ? <input value={draft[key]} disabled={job.status !== 'ready' || busy} onChange={e => edit(key,e.target.value)} /> : <textarea rows={key === 'content' ? 16 : 4} value={draft[key]} disabled={job.status !== 'ready' || busy} onChange={e => edit(key,e.target.value)} />}</Field>)}
          {job.status === 'ready' && <button disabled={busy || !dirty} onClick={saveDraft}>Save draft edits</button>}
          <details><summary>Preview article</summary><article className="assistant-article"><h2>{draft.title}</h2><p><strong>{draft.summary}</strong></p>{draft.content.split(/\n+/).filter(Boolean).map((p,i) => <p key={i}>{p}</p>)}</article></details>
          <details><summary>Claim evidence</summary><ul>{draft.claims?.map((c,i) => <li key={i}>{c.claim} <strong>({c.sourceIds.join(', ')})</strong></li>)}</ul></details>
        </>}
        {job.research && <section><h3>Source evidence</h3>{categoryLabels.map(category => {
          const sources = job.research.sources.filter(s => s.category === category);
          return sources.length ? <div key={category}><h4>{category}</h4>{sources.map(s => <details key={s.id}><summary>{s.id} · {s.outlet} · {s.status}{draft?.sourceIds.includes(s.id) ? ' · Cited' : ''}</summary><p><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title || s.url} ↗</a></p><p>{s.publicationDate} {s.reason}</p>{s.truncated && <p>Only the first 10,000 characters were provided to the models.</p>}{s.text && <p className="assistant-source-text">{s.text}</p>}</details>)}</div> : null;
        })}</section>}
        {job.reviews?.map(review => <section key={review.round} className="assistant-review"><h3>Grok review {review.round}</h3><p>{review.summary}</p>{review.findings.length ? review.findings.map((f,i) => <div key={i}><strong>{f.severity.toUpperCase()}</strong><blockquote>{f.passage}</blockquote><p>{f.issue}</p><p>Suggested correction: {f.correction}</p><small>Evidence: {f.sourceIds.join(', ') || 'Editorial assessment'}</small></div>) : <p>No actionable findings reported.</p>}</section>)}
        {job.versions?.length > 0 && <details><summary>Draft history ({job.versions.length} versions)</summary>{job.versions.map((v,i) => <details key={i}><summary>{v.stage} · {v.title}</summary>{v.notes && <p>Revision notes: {v.notes}</p>}<p>{v.summary}</p><p className="assistant-source-text">{v.content}</p></details>)}</details>}
        {job.usage?.length > 0 && <details><summary>API usage</summary>{job.usage.map((u,i) => <p key={i}>{u.stage} · {u.model}: {u.provider === 'parallel' ? `${u.searchCalls} search request(s)` : `${u.inputTokens} input / ${u.outputTokens} output tokens`} · ${Number(u.estimatedUsd || 0).toFixed(4)} estimated</p>)}</details>}
        {['ready','publishing'].includes(job.status) && <div className="assistant-approval"><h3>Editorial approval</h3><p>Review remaining findings and source gaps. Approval does not certify the article as unbiased.</p>
          <Field label="Your review note"><textarea required value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Record how you addressed any remaining concerns." /></Field>
          <label className="assistant-check"><input type="checkbox" checked={approval} disabled={dirty || busy} onChange={e => setApproval(e.target.checked)} />I reviewed this article, its sources, and image permission, and approve publication.</label>
          <button className="assistant-primary" disabled={busy || dirty || !approval || !reviewNote.trim()} onClick={publish}>{busy ? 'Publishing…' : job.status === 'publishing' ? 'Finish publication' : 'Approve and publish'}</button>
          {dirty && <p>Save your draft edits before approving.</p>}
        </div>}
        {['ready','failed','queued'].includes(job.status) && <button disabled={busy} onClick={() => action(async () => {await api.post(`${base}/assignments/${job._id}/reject`,{revision:job.revision});await loadJob(job._id);await refresh();})}>Reject assignment</button>}
        {job.status === 'published' && <Link className="assistant-published" to={`/article/${job.publishedArticle}`}>View published article →</Link>}
      </>}
    </section></div>}
  </div>;
}
