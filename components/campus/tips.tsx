'use client';
import Link from 'next/link';
import type {CampusData,Locale} from '@/lib/campus/types';
import {Icon} from './icon';
import {ReportButton} from './community';
import {track} from '@/lib/campus/analytics';
export function TipsPage({data,locale}:{data:CampusData;locale:Locale}){
 const en=locale==='en';
 const tips=[
 ['room-code','door','Hoe lees je F3.025?','How do you read F3.025?','F is de zone, 3 de verdieping en 025 het lokaal. Probeer de zoekfunctie met of zonder punt.','F is the zone, 3 is the floor and 025 is the room. Search with or without the dot.','F3025'],
 ['buildings','map','R8 of R10?','R8 or R10?','Controleer eerst het gebouw op je rooster of uitnodiging. Wissel boven de kaart tussen Rengerslaan 8 en 10.','First check the building on your timetable or invitation. Switch between Rengerslaan 8 and 10 above the map.','R10_MAIN'],
 ['help','info','Een praktische vraag?','A practical question?','Student Info vind je in R8. Bekijk de plek en plan je route.','Find Student Info in R8. View the location and plan your route.','student-info'],
 ['library','book','Naar de bibliotheek','Find the library','Zoek de bibliotheek op de begane grond van R8. Actuele openingstijden staan bij de locatie.','Find the library on the ground floor of R8. Check its location details for opening hours.','library'],
 ['coffee','coffee','Tijd voor een pauze','Time for a break','Central Brew staat op de kaart in de centrale hal van R8. Zoek op koffie voor andere plekken.','Central Brew is shown in the central hall of R8. Search coffee for other places.','central-brew'],
 ['study','book','Een plek om te studeren','A place to study','Begin bij de bibliotheek. Zoek studieplekken op de kaart; beschikbaarheid wordt niet live bijgehouden.','Start at the library. Search study places on the map; availability is not tracked live.','library'],
 ['qr','qr','Begin met een QR-code','Start with a QR code','Een CampusKompas-QR vult je startpunt in. Kies daarna je bestemming. Dit gebruikt geen indoor GPS.','A CampusKompas QR code sets your starting point. Then choose a destination. It does not use indoor GPS.',''],
 ['access','access','Drempelvrij op weg','Step-free navigation','Zet Toegankelijke route aan. Alleen gecontroleerde verbindingen tellen mee. Is er geen route? Vraag hulp bij de receptie.','Enable Accessible route. Only verified connections are used. No route available? Ask reception for assistance.',''],
 ['report','info','Klopt de informatie niet?','Is something incorrect?','Gebruik de meldknop bij een plek. Een beheerder controleert je melding voordat de kaart verandert.','Use the report button on a location. An administrator checks your report before changing the map.',''],
 ];
 return <div className="content-page"><div className="section-heading"><div><span className="eyebrow">{en?'A GOOD START':'EEN GOED BEGIN'}</span><h1>{en?'First-year tips':'Eerstejaars Tips'}</h1><p>{en?'Find your room. Get help. Settle in.':'Vind je lokaal. Vind hulp. Voel je thuis.'}</p></div></div><div className="card-grid">{tips.map(([id,icon,n,e,bodyNL,bodyEN,target])=>{const stored=data.tips.find(t=>t.id===id),location=data.locations.find(l=>l.id===target);return <article className="discovery-card tip-action" key={id}><div className="card-icon"><Icon name={icon}/></div><h2>{stored?.published?stored.title[locale]:en?e:n}</h2><p>{stored?.published?stored.body[locale]:en?bodyEN:bodyNL}</p>{id==='room-code'&&<div className="welcome-example"><span>F</span><span>3</span><span>025</span><small>Zone</small><small>{en?'Floor':'Verdieping'}</small><small>{en?'Room':'Lokaal'}</small></div>}{location?<Link className="text-link" href={'/map?to='+location.id} onClick={()=>track('tip_view',{tip_id:id})}>{en?'View on map':'Bekijk op kaart'} →</Link>:id==='report'?<ReportButton locale={locale}/>:<Link className="text-link" onClick={()=>track('tip_view',{tip_id:id})} href={id==='access'?'/map?to=library&navigate=1&accessible=1':'/map'}>{en?'Open map':'Open kaart'} →</Link>}</article>;})}</div></div>;
}
