import React, {useEffect, useRef, useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import '../styles/Contact.css';

const empty={kind:'experience',name:'',email:'',phone:'',company:'',message:'',consent:false,website:''};
const labels={investment:'Investment inquiry',experience:'My experience',suggestion:'Suggestion',general:'General inquiry'};
export default function ContactUs() {
  const location=useLocation();
  const navigate=useNavigate();
  const [ready,setReady]=useState(false);
  useEffect(()=>setReady(true),[]);
  const [form,setForm]=useState(empty);
  const [status,setStatus]=useState('');
  const [error,setError]=useState('');
  const [receipt,setReceipt]=useState(null);
  const [dirty,setDirty]=useState(false);
  const request=useRef(null);
  const busy=useRef(false);
  useEffect(()=>{
    const draft=location.state?.inquiryDraft;
    const investment=new URLSearchParams(location.search).get('interest')==='investment';
    if (draft || investment) {
      setForm({...empty,...(draft || {}),kind:draft?.kind || 'investment',consent:false,website:''});
      setReceipt(null);setError('');setDirty(Boolean(draft));request.current=null;
      setStatus(draft ? 'Your draft is ready. Review the details, agree to being contacted, and send when you are ready.' : '');
      if (draft) navigate(location.pathname,{replace:true,state:null});
    }
  },[location.key,location.search,location.state,location.pathname,navigate]);
  const change=event=>{
    const {name,value,checked,type}=event.target;
    setForm(previous=>({...previous,[name]:type==='checkbox' ? checked : value}));
    setDirty(true);setError('');setReceipt(null);setStatus('');
  };
  const chooseInvestment=()=>{
    setForm(previous=>({...previous,kind:'investment'}));
    setDirty(true);setReceipt(null);
    document.getElementById('inquiry-name')?.focus();
  };
  const submit=async event=>{
    event.preventDefault();
    if (busy.current) return;
    if (!form.consent) {setError('Please agree to being contacted about this inquiry.');return;}
    const snapshot=JSON.stringify(form);
    // A changed payload gets a new ID; an unchanged retry reuses the original ID.
    if (!request.current || request.current.snapshot!==snapshot) {
      request.current={snapshot,id:window.crypto.randomUUID()};
    }
    busy.current=true;setStatus('Sending your inquiry…');setError('');
    try {
      const {submitInquiry}=await import('../services/inquiries');
      const saved=await submitInquiry({...form,requestId:request.current.id});
      setReceipt(saved);setStatus('');setForm(empty);setDirty(false);request.current=null;
    } catch(failure) {
      setError(failure.message || 'Could not save your inquiry. Please try again.');setStatus('');
    } finally {busy.current=false;}
  };
  const clear=()=>{setForm(empty);setDirty(false);setStatus('');setError('');setReceipt(null);request.current=null;};
  const sending=status==='Sending your inquiry…';
  return <div className="nb-contact">
    <header className="nb-contact-heading"><p className="nb-contact-kicker">LET’S BUILD BETTER NEWS</p><h1>Your voice matters.</h1><p>Tell us about your experience, share an idea, or start a conversation about investing in The NoBias Media.</p></header>
    <div className="nb-contact-layout">
      <aside className="nb-investment"><p className="nb-contact-kicker">INVEST IN OUR FUTURE</p><h2>Help shape what comes next.</h2><p>We welcome conversations with people and organizations interested in investing in The NoBias Media and helping us grow.</p><button type="button" onClick={chooseInvestment} disabled={sending}>Discuss an investment <span aria-hidden="true">↗</span></button><p className="nb-contact-note">Start a conversation with our team. No payment or investment commitment is made through this form.</p><hr/><h3>Prefer to reach us directly?</h3><a href="mailto:contact@thenobiasmedia.com">contact@thenobiasmedia.com</a><a href="tel:+917001414991">+91-7001414991</a><address>75–76, West Guru Angad Nagar, Laxmi Nagar, near Nirman Vihar Metro Station, Delhi – 110092, India.</address></aside>
      <section className="nb-contact-form-section" aria-labelledby="inquiry-title"><h2 id="inquiry-title">Let’s hear from you.</h2><p>Fields marked with * are required.</p>
        {receipt && <div className="nb-contact-success" role="status"><h3>Thank you. Your inquiry is saved.</h3><p>{receipt.kind==='investment' ? 'Your investment inquiry is in our team’s private inbox.' : 'Your message is in our team’s private inbox.'} We can reply using the contact details you provided.</p><p>Reference: {receipt.reference}</p></div>}
        <form method="post" action="/contact" onSubmit={submit} data-inquiry-dirty={dirty ? 'true' : 'false'} aria-label="Contact inquiry">
          <fieldset disabled={sending || !ready}>
            <label htmlFor="inquiry-kind">What would you like to share? *</label><select id="inquiry-kind" name="kind" value={form.kind} onChange={change} required>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
            {form.kind==='investment' && <p className="nb-investment-hint">Tell us about your interest in investing, your organization if applicable, and how you would like to get involved.</p>}
            <div className="nb-contact-row"><div><label htmlFor="inquiry-name">Your name *</label><input id="inquiry-name" name="name" autoComplete="name" value={form.name} onChange={change} minLength={2} maxLength={100} required/></div><div><label htmlFor="inquiry-email">Email address *</label><input id="inquiry-email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} maxLength={254} required/></div></div>
            <div className="nb-contact-row"><div><label htmlFor="inquiry-company">Organization (optional)</label><input id="inquiry-company" name="company" autoComplete="organization" value={form.company} onChange={change} maxLength={150}/></div><div><label htmlFor="inquiry-phone">Phone number (optional)</label><input id="inquiry-phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={change} maxLength={30}/></div></div>
            <label htmlFor="inquiry-message">Your message *</label><textarea id="inquiry-message" name="message" value={form.message} onChange={change} rows={7} minLength={10} maxLength={5000} required aria-describedby="inquiry-help"/>
            <p id="inquiry-help" className="nb-contact-note">Please leave out passwords, bank details, and confidential documents. Up to 5,000 characters.</p>
            <div className="nb-contact-trap" aria-hidden="true"><label htmlFor="inquiry-website">Leave this field blank</label><input id="inquiry-website" name="website" value={form.website} onChange={change} tabIndex={-1} autoComplete="off"/></div>
            <label className="nb-contact-consent"><input type="checkbox" name="consent" checked={form.consent} onChange={change} required/><span>I agree that The NoBias Media may store my inquiry and contact me about it, as described in the <a href="/privacy-policy">Privacy Policy</a>. *</span></label>
            <p className="nb-contact-note">Your message is private and available to our authorized team. We do not publish submissions on the site.</p>
            <button type="submit" className="nb-contact-submit">{sending ? 'Sending…' : form.kind==='investment' ? 'Send investment inquiry' : 'Send message'} <span aria-hidden="true">↗</span></button> <button type="button" className="nb-contact-clear" onClick={clear}>Clear form</button>
          </fieldset>
        </form>
        {status && <p role="status">{status}</p>}{error && <p className="nb-contact-error" role="alert">{error} You can also email <a href="mailto:contact@thenobiasmedia.com">contact@thenobiasmedia.com</a>.</p>}
        <noscript>Please email contact@thenobiasmedia.com or enable JavaScript to send this form.</noscript>
      </section>
    </div>
  </div>;
}
