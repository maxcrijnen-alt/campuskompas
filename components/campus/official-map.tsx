'use client';
import Image from 'next/image';
import {TransformWrapper,TransformComponent,useControls} from 'react-zoom-pan-pinch';
import {Plus,Minus,Maximize} from 'lucide-react';
import type {CampusData,Floor,Locale,Location} from '@/lib/campus/types';
import {OpeningHours} from './opening-hours';

// Percentage positions read from the labelled original guide pages 18 and 22.
// These identify facilities, not entrances or validated routing coordinates.
const hotspots:Record<string,[number,number]>={library:[10,33],'cafe-if':[13,44],canteen:[54,77],brandstof:[43,53],espresso:[45,83],'food-court':[54,70]};

function MapControls({en}:{en:boolean}) {
  const {zoomIn,zoomOut,resetTransform}=useControls();
  return <div className="map-controls"><button aria-label={en?'Zoom in':'Inzoomen'} onClick={()=>zoomIn()}><Plus/></button><button aria-label={en?'Zoom out':'Uitzoomen'} onClick={()=>zoomOut()}><Minus/></button><button aria-label={en?'Reset map':'Kaart herstellen'} onClick={()=>resetTransform()}><Maximize/></button></div>;
}
export function OfficialMap({floor,locale,selected,data,onSelect}:{floor:Floor;locale:Locale;selected:Location|null;data:CampusData;onSelect:(location:Location)=>void}) {
  const en=locale==='en';
  const available=['R8','R10'].includes(floor.building_id)&&floor.level>=0&&floor.level<=3;
  const page=(floor.building_id==='R8'?18:22)+floor.level;
  const source='https://etenjournal.com/wp-content/uploads/2024/04/map-nhl-stenden.pdf#page='+page;
  const places=data.locations.filter(l=>l.floor_id===floor.id&&l.category_id!=='room');
  const selectedHere=selected?.floor_id===floor.id?selected:null;
  function choose(location:Location){onSelect(location);requestAnimationFrame(()=>{const panel=document.getElementById('map-opening-hours');panel?.focus({preventScroll:true});panel?.scrollIntoView({behavior:'smooth',block:'nearest'});});}
  if(!available)return <p className="notice">{en?'No published floor plan found for this floor.':'Geen gepubliceerde plattegrond gevonden voor deze verdieping.'}</p>;
  return <section className="official-map" aria-label={en?'NHL Stenden floor plan':'Plattegrond NHL Stenden'}>
    <div className="official-map-heading"><strong>{floor.building_id} · {floor.level===0?(en?'Ground floor':'Begane grond'):(en?'Floor ':'Verdieping ')+floor.level}</strong><a href={source} target="_blank" rel="noreferrer">{en?'Original PDF ↗':'Originele PDF ↗'}</a></div>
    <div className="map-canvas official-canvas">
      <TransformWrapper key={floor.id} minScale={0.5} maxScale={8} initialScale={1} centerOnInit limitToBounds={false}>
        <TransformComponent wrapperClass="map-transform" contentClass="official-map-content">
          <Image src={'/maps/'+floor.building_id.toLowerCase()+'-'+floor.level+'.webp'} width={1489} height={1489} unoptimized alt={(en?'NHL Stenden floor plan, ':'NHL Stenden-plattegrond, ')+floor.building_id+', '+(en?'floor ':'verdieping ')+floor.level} draggable={false}/>
          {places.filter(l=>hotspots[l.id]).map(l=><button key={l.id} className="official-hotspot" style={{left:hotspots[l.id][0]+'%',top:hotspots[l.id][1]+'%'}} aria-label={(en?'Opening hours for ':'Openingstijden van ')+l.name[locale]} aria-pressed={selected?.id===l.id} title={l.name[locale]} onClick={()=>choose(l)}>i</button>)}
        </TransformComponent>
        <MapControls en={en}/>
      </TransformWrapper>
    </div>
    {places.length>0&&<div className="map-places"><strong>{en?'Choose a place for opening hours':'Klik op een plek voor openingstijden'}</strong><div>{places.map(l=><button key={l.id} aria-pressed={selected?.id===l.id} onClick={()=>choose(l)}>{l.name[locale]}</button>)}</div></div>}
    {selectedHere&&selectedHere.category_id!=='room'&&<section id="map-opening-hours" tabIndex={-1} className="map-hours" aria-label={(en?'Opening hours: ':'Openingstijden: ')+selectedHere.name[locale]}><h3>{selectedHere.name[locale]}</h3><OpeningHours locale={locale} hours={data.hours.find(h=>h.id===selectedHere.hours_id)}/></section>}
    {selected?.floor_id===floor.id&&<p className="official-selection">{en?'Selected: ':'Geselecteerd: '}<strong>{selected.name[locale]}</strong>{selected.room_code?' · '+selected.room_code:''}. {en?'Read the room code on the plan; pinch or use + to zoom.':'Zoek de lokaalcode op de kaart; knijp of gebruik + om in te zoomen.'}</p>}
    <p className="official-source">{en?'Source: NHL Stenden guide, pp. 18–25, public copy hosted by ETEN (2024). Latest edition: NHL Stenden intranet. Room names may have changed.':'Bron: NHL Stenden-gids, p. 18–25, openbare kopie bij ETEN (2024). Nieuwste editie: NHL Stenden-intranet. Ruimtenamen kunnen gewijzigd zijn.'}</p>
  </section>;
}
