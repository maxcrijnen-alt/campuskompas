'use client';
import {useState,useEffect,useRef} from 'react';
import {X,Share2,Navigation,ChevronDown,Accessibility} from 'lucide-react';
import type {CampusData,Location,Locale} from '@/lib/campus/types';
import {OpeningHours} from './opening-hours';
import {ReportButton,Feedback} from './community';
export function LocationPanel({location:l,data,locale,onClose,onRoute,onToast}:{location:Location;data:CampusData;locale:Locale;onClose:()=>void;onRoute:()=>void;onToast:(s:string)=>void}){
 const en=locale==='en',[expanded,setExpanded]=useState(false),heading=useRef<HTMLHeadingElement>(null);
 const category=data.categories.find(c=>c.id===l.category_id),floor=data.floors.find(f=>f.id===l.floor_id),source=data.sources.find(s=>s.id===l.source_id),node=data.nodes.find(n=>n.id===l.node_id);
 useEffect(()=>{setExpanded(false);heading.current?.focus({preventScroll:true});},[l.id]);
 async function share(){const url=window.location.origin+'/map?to='+encodeURIComponent(l.id);try{if(navigator.share){await navigator.share({title:l.name[locale],url});}else{await navigator.clipboard.writeText(url);onToast(en?'Location link copied':'Locatielink gekopieerd');}}catch(error){if(error instanceof Error&&error.name==='AbortError')return;try{await navigator.clipboard.writeText(url);onToast(en?'Location link copied':'Locatielink gekopieerd');}catch{onToast(en?'Copy the link from your address bar.':'Kopieer de link uit je adresbalk.');}}}
 return <section className="panel location-panel" aria-label={en?'Location details':'Locatiedetails'}>
 <div className="sheet-handle" aria-hidden="true"/><div className="panel-heading"><span className="badge">{category?.name[locale]}</span><div className="panel-actions"><button className="icon-button route-mobile-toggle" aria-label={en?'Expand or collapse details':'Details in- of uitklappen'} aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}><ChevronDown size={18}/></button><button className="icon-button" aria-label={en?'Close details':'Details sluiten'} onClick={onClose}><X size={20}/></button></div></div>
 <h2 ref={heading} tabIndex={-1}>{l.category_id==='room'?l.room_code:l.name[locale]}</h2>
 <p className="location-meta">{l.building_id} · {floor?.level===0?(en?'Ground floor':'Begane grond'):(en?'Floor ':'Verdieping ')+floor?.level}{l.room_code&&/^[A-Z]/.test(l.room_code)?' · Zone '+l.room_code[0]:''}</p>
 <div className="location-cta"><button className="primary-button" onClick={onRoute}><Navigation size={18}/>{en?'Route here':'Route hierheen'}</button><button className="secondary-button" onClick={()=>void share()} aria-label={en?'Share location':'Deel locatie'}><Share2 size={18}/><span>{en?'Share':'Delen'}</span></button></div>
 <div className={'sheet-content '+(expanded?'expanded':'')}>
 {l.category_id!=='room'&&<>{l.description[locale]&&<p>{l.description[locale]}</p>}<OpeningHours hours={data.hours.find(h=>h.id===l.hours_id)} locale={locale}/><p className="form-note"><Accessibility size={14}/>{node?.accessibility_status==='verified'&&node.accessible?(en?'Step-free access verified.':'Drempelvrije toegang gecontroleerd.'):(en?'Step-free access not yet confirmed.':'Drempelvrije toegang nog niet bevestigd.')}</p></>}
 <ReportButton locale={locale} entityId={l.id}/><Feedback key={l.id} locale={locale} entityId={l.id}/>
 <details className="location-source"><summary>{en?'Source and data information':'Bron en gegevens'}</summary>{source&&<a className="text-link" href={source.url+(l.source_page?'#page='+l.source_page:'')} target="_blank" rel="noreferrer">{source.title} ↗</a>}<p>{en?'Location on the published plan; current use still needs campus confirmation.':'Locatie op de gepubliceerde kaart; actueel gebruik moet nog door de campus worden bevestigd.'}</p>{source&&<small>{en?'Source checked':'Bron gecontroleerd'}: {source.verified_at}</small>}</details>
 </div>
 </section>;
}
