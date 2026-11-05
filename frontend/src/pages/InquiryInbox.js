import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useSession} from '../context/SessionContext';
import api from '../services/api';
import '../styles/Contact.css';
const labels={investment:'Investment inquiry',experience:'Reader experience',suggestion:'Suggestion',general:'General inquiry'};
export default function InquiryInbox() {
  const {user,loading:sessionLoading}=useSession();
  const [kind,setKind]=useState('investment');
  const [page,setPage]=useState(1);
  const [data,setData]=useState({items:[],totalPages:0});
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const [busy,setBusy]=useState(false);
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    if (user?.role!=='admin') {setData({items:[],totalPages:0});return;}
    let active=true;setLoading(true);setData({items:[],totalPages:0});setError('');
    api.get(`/admin/inquiries?kind=${kind}&page=${page}`).then(result=>{if(active)setData(result.data);})
      .catch(failure=>{if(active)setError(failure.response?.data?.message || 'Could not load the inbox.');})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[kind,page,user,refresh]);
  const update=async(item,notification=false)=>{
    if(busy)return;setBusy(true);setError('');
    try {
      if(notification) {
        const result=await api.post(`/admin/inquiries/${item._id}/notify`,{});
        if (!['sent','unchanged'].includes(result.data.status)) {setError('Email is still pending. Check the Resend configuration and try again.');return;}
      } else await api.put(`/admin/inquiries/${item._id}`,{status:item.status==='reviewed'?'new':'reviewed'});
      setRefresh(value=>value+1);
    } catch(failure) {setError(failure.response?.data?.message || 'Could not update the inquiry.');}
    finally {setBusy(false);}
  };
  if(sessionLoading)return <div className="nb-contact">Checking your session…</div>;
  if(user?.role!=='admin')return <div className="nb-contact"><h1>Private inquiry inbox</h1><p>Please <Link to="/login">sign in as an administrator</Link> to read inquiries.</p></div>;
  return <div className="nb-contact"><p className="nb-contact-kicker">PRIVATE · TEAM INBOX</p><h1>Reader &amp; investor inquiries</h1><p>Investment inquiries appear first by default. Visitor messages are unverified submissions; review them before following links or taking action.</p><Link to="/admin">Back to admin</Link>
    <div className="nb-inbox-toolbar"><label htmlFor="inbox-filter">Show</label><select id="inbox-filter" value={kind} onChange={event=>{setKind(event.target.value);setPage(1);}}><option value="all">All inquiries</option>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><button disabled={busy || loading} onClick={()=>setRefresh(value=>value+1)}>Refresh</button></div>
    {error && <p role="alert" className="nb-contact-error">{error}</p>}{loading && <p role="status">Loading inquiries…</p>}
    {!loading && data.items.length===0 && <p>No inquiries in this view yet.</p>}
    {!loading && data.items.map(item=><article key={item._id} className={`nb-inquiry ${item.kind==='investment'?'nb-inquiry-investment':''}`}><p className="nb-contact-kicker">{labels[item.kind]} · {item.status}</p><h2>{item.name}</h2><dl><dt>Email</dt><dd><a href={`mailto:${encodeURIComponent(item.email)}`}>{item.email}</a></dd>{item.company && <><dt>Organization</dt><dd>{item.company}</dd></>}{item.phone && <><dt>Phone</dt><dd>{item.phone}</dd></>}<dt>Received</dt><dd>{new Date(item.createdAt).toLocaleString('en-US')}</dd><dt>Reference</dt><dd>{item._id}</dd><dt>Email notice</dt><dd>{item.notification?.status || 'pending'}</dd></dl><p className="nb-inquiry-message">{item.message}</p><div className="nb-inquiry-actions"><button disabled={busy} onClick={()=>update(item)}>{item.status==='reviewed'?'Mark as new':'Mark as reviewed'}</button>{item.notification?.status!=='sent' && <button disabled={busy} onClick={()=>update(item,true)}>Retry email notification</button>}</div></article>)}
    <div className="nb-inbox-toolbar"><button disabled={page===1 || loading || busy} onClick={()=>setPage(value=>value-1)}>Previous</button><span>Page {page} of {Math.max(1,data.totalPages)}</span><button disabled={page>=data.totalPages || loading || busy} onClick={()=>setPage(value=>value+1)}>Next</button></div>
  </div>;
}
