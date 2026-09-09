'use client';
import {useState} from 'react';
import {ThumbsUp,ThumbsDown} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import type {Locale} from '@/lib/campus/types';
import {track} from '@/lib/campus/analytics';
export function ReportButton({locale,entityId=null,query=''}:{locale:Locale;entityId?:string|null;query?:string}){
 const en=locale==='en';
 const [open,setOpen]=useState(false),[started,setStarted]=useState(0),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState('');
 return <><button className="text-link subtle" onClick={()=>{setStarted(Date.now());setDone(false);setError('');setOpen(true);}}>{entityId?(en?'Is this information incorrect?':'Klopt deze informatie niet?'):(en?'Missing a place? Let us know':'Locatie ontbreekt? Laat het weten')}</button>
 <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>{en?'Help improve the map':'Help de kaart verbeteren'}</DialogTitle><DialogDescription>{en?'Your report goes to a campus administrator. No account needed. Please do not include personal details.':'Je melding gaat naar een beheerder. Geen account nodig. Vermeld geen persoonsgegevens.'}</DialogDescription>
 {done?<p role="status">{en?'Thanks! Your report has been saved for review.':'Bedankt! Je melding is opgeslagen en wordt gecontroleerd.'}</p>:<form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');const f=new FormData(e.currentTarget);try{const r=await fetch('/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entity_type:entityId?'location':'missing_location',entity_id:entityId,searched_code:entityId?undefined:query.slice(0,100),report_type:entityId?f.get('report_type'):'missing_location',message:f.get('message')||'',website:f.get('website')||'',started_at:started})});if(!r.ok)throw Error();setDone(true);track('data_report_submit',{entity_type:entityId?'location':'missing_location'});}catch{setError(en?'Not saved. Please try again in a moment.':'Niet opgeslagen. Probeer het zo opnieuw.');}finally{setBusy(false);}}}>
 {entityId&&<label className="field-label">{en?'What is incorrect?':'Wat klopt er niet?'}<select className="field-input" name="report_type">{[['wrong_location','Locatie klopt niet','Wrong location'],['missing_room','Lokaal bestaat niet','Room does not exist'],['wrong_hours','Openingstijden kloppen niet','Wrong opening hours'],['facility_gone','Voorziening bestaat niet meer','Facility no longer exists'],['other','Anders','Other']].map(([v,n,e])=><option key={v} value={v}>{en?e:n}</option>)}</select></label>}
 {!entityId&&query&&<p>{en?'Searched for: ':'Gezocht naar: '}<strong>{query.slice(0,100)}</strong></p>}
 <label className="field-label">{en?'Comment (optional)':'Toelichting (optioneel)'}<textarea className="field-input" name="message" rows={3} maxLength={1200}/></label>
 <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
 {error&&<p role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy?(en?'Saving…':'Opslaan…'):(en?'Send report':'Verstuur melding')}</button></form>}
 </DialogContent></Dialog></>;
}
export function Feedback({locale,entityId=null,context='location'}:{locale:Locale;entityId?:string|null;context?:'location'|'search'|'route'}){
 const en=locale==='en';const [started]=useState(()=>Date.now()),[state,setState]=useState<'idle'|'busy'|'done'|'error'>('idle');
 async function send(helpful:boolean){setState('busy');try{const r=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entity_id:entityId,context,helpful,message:'',website:'',started_at:started})});if(!r.ok)throw Error();setState('done');}catch{setState('error');}}
 return <div className="feedback" aria-live="polite">{state==='done'?<span>{en?'Thanks for your feedback!':'Bedankt voor je feedback!'}</span>:<><span>{en?'Did you find what you needed?':'Heb je gevonden wat je zocht?'}</span><div><button className="icon-button" disabled={state==='busy'} aria-label={en?'Yes, found it':'Ja, gevonden'} onClick={()=>void send(true)}><ThumbsUp size={18}/></button><button className="icon-button" disabled={state==='busy'} aria-label={en?'No, not found':'Nee, niet gevonden'} onClick={()=>void send(false)}><ThumbsDown size={18}/></button></div>{state==='error'&&<small role="alert">{en?'Not saved. Try again.':'Niet opgeslagen. Probeer opnieuw.'}</small>}</>}</div>;
}
