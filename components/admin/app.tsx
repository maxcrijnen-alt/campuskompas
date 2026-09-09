'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  Compass,
  LogOut,
  Plus,
  Check,
  X,
  Star,
  Trash2,
  Save,
  ArrowLeft,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';

import { MapEditor } from './map-editor';
import type {
  Gem,
  Floor,
} from '@/lib/campus/types';
import QRCode from 'qrcode';
type Row = Record<string, unknown>;
const sections = [
  ['dashboard', 'Overzicht / Overview', ''],
  ['reports','Datameldingen / Reports','data_reports'],
  ['feedback','Gebruikersfeedback / Feedback','user_feedback'],
  ['sources','Bronnen / Sources','source_records'],
  ['locations', 'Locaties / Locations', 'locations'],
  ['rooms', 'Lokalen / Rooms', 'rooms'],
  ['maps', 'Kaarten / Maps', 'floors'],
  ['routes', 'Route nodes', 'route_nodes'],
  ['edges', 'Route edges', 'route_edges'],
  ['gems', 'Hidden Gems', 'hidden_gems'],
  ['tips', 'Tips', 'first_year_tips'],
  ['opening-hours', 'Openingstijden / Hours', 'opening_hours'],
  ['qr', 'QR-locaties / QR locations', 'qr_locations'],
];
export function AdminApp({
  section,
  initialEmail,
}: {
  section: string;
  initialEmail: string | null;
}) {
  const [email, setEmail] = useState(initialEmail),
    [rows, setRows] = useState<Row[]>([]),
    [locations, setLocations] = useState<Row[]>([]),
    [routeNodes, setRouteNodes] = useState<Row[]>([]),
    [health, setHealth] = useState<Record<string, Record<string, unknown>> | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [edit, setEdit] = useState<string | null>(null),
    [remove, setRemove] = useState<Row | null>(null),
    [stats, setStats] = useState({
      pending: 0,
      locations: 0,
      review: 0,
      maps: 0,
      reports:0,
    }),
    [qr, setQr] = useState(''),
    [notice, setNotice] = useState('');
  const table = sections.find((s) => s[0] === section)?.[2] ?? '';
  async function read(t: string) {
    const r = await fetch('/api/admin/' + t);
    if (r.status === 401 || r.status === 403) {
      setEmail(null);
      throw Error('Sessie verlopen / Session expired');
    }
    if (!r.ok) throw Error('Gegevens niet beschikbaar / Data unavailable');
    const v = (await r.json()) as { rows: Row[] };
    return v.rows;
  }
  async function refresh() {
    setLoading(true);
    setError('');
    try {
      if (table) {
        const loaded=await read(table);setRows(loaded);
        if(table==='hidden_gems')setLocations(await read('locations'));
        if(table==='locations')setRouteNodes(await read('route_nodes'));
        const id=new URLSearchParams(window.location.search).get('edit');const record=id&&loaded.find(r=>r.id===id);if(record)setEdit(JSON.stringify(record,null,2));
      }
      else {
        const [g, l, f, reports, healthResponse] = await Promise.all([
          read('hidden_gems'),
          read('locations'),
          read('floors'),
          read('data_reports'),
          fetch('/api/admin/routing-health'),
        ]);
        if(!healthResponse.ok)throw Error('Routing health niet beschikbaar / unavailable');
        setHealth(await healthResponse.json());
        setStats({
          pending: g.filter((x) => x.status === 'pending').length,
          locations: l.length,
          review: l.filter((x) => x.verification_status !== 'verified').length,
          maps: f.length,
          reports:reports.filter(r=>r.status==='pending').length,
        });
        setRows(
          [...g, ...l, ...reports]
            .sort((a, b) =>
              display(b.updated_at).localeCompare(display(a.updated_at)),
            )
            .slice(0, 8),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (email) void refresh();
    // Initial fetch follows auth/table changes; refresh also supports explicit saves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, table]);
  async function save(row: Row, target = table) {
    setError('');
    const r = await fetch('/api/admin/' + target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
    });
    if (!r.ok) {
      setError(
        'Niet opgeslagen. Controleer velden en verwijzingen. / Not saved. Check fields and references.',
      );
      throw Error('Save failed');
    }
    setNotice('Opgeslagen / Saved');
    await refresh();
  }
  async function login(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
        }),
      });
      if (!r.ok)
        throw Error(
          r.status === 503
            ? 'Database tijdelijk niet bereikbaar / Database unavailable'
            : 'Geen beheerderstoegang of onjuiste gegevens / Admin access denied',
        );
      setEmail(display(form.get('email')));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <header className="app-header">
        <Link className="wordmark" href="/">
          <span className="logo">
            <Compass />
          </span>
          CampusKompas
        </Link>
        <span className="badge">Beheer / Administration</span>
        {email && (
          <button
            className="text-link"
            onClick={async () => {
              await fetch('/api/admin/session', { method: 'DELETE' });
              setEmail(null);
            }}
          >
            <LogOut size={18} />
            Uitloggen / Sign out
          </button>
        )}
      </header>
      <main id="main" className="page-wrap">
        {!email ? (
          <section
            className="panel"
            style={{ maxWidth: 440, margin: '40px auto' }}
          >
            <h1 style={{ fontSize: 28, fontWeight: 700 }}>
              Welkom terug / Welcome back
            </h1>
            <p>
              Alleen campusbeheerders. Studenten gebruiken de app zonder
              account.
              <br />
              Administrators only. Students do not need an account.
            </p>
            <form onSubmit={login}>
              <label className="field-label">
                E-mail
                <input
                  className="field-input"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                />
              </label>
              <label className="field-label">
                Wachtwoord / Password
                <input
                  className="field-input"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
              <button className="primary-button" disabled={loading}>
                Inloggen / Sign in
              </button>
            </form>
            <Link className="text-link" href="/">
              <ArrowLeft size={15} />
              Terug naar de campus / Back to campus
            </Link>
          </section>
        ) : (
          <div className="admin-layout">
            <nav className="admin-nav" aria-label="Beheer / Administration">
              {sections.map(([id, label]) => (
                <Link
                  key={id}
                  href={'/admin/' + id}
                  className={section === id ? 'active' : ''}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <section style={{ minWidth: 0 }}>
              <div className="section-heading">
                <div>
                  <div className="eyebrow">CAMPUS CONTENT</div>
                  <h1>
                    {sections.find((s) => s[0] === section)?.[1] ?? 'Overzicht'}
                  </h1>
                </div>
                {table && !['hidden_gems','data_reports','user_feedback'].includes(table) && (
                  <button
                    className="secondary-button"
                    onClick={() =>
                      setEdit(JSON.stringify(defaultRow(table), null, 2))
                    }
                  >
                    <Plus size={18} />
                    Nieuw / New
                  </button>
                )}
              </div>
              {error && (
                <p className="notice" role="alert">
                  {error}
                </p>
              )}
              {notice && (
                <p role="status" className="form-note">
                  {notice}
                </p>
              )}
              {loading ? (
                <div className="loading" aria-label="Loading" />
              ) : !table ? (
                <>
                  <div className="stat-row">
                    {[
                      [stats.pending, 'Te beoordelen / Pending'],
                      [stats.locations, 'Locaties / Locations'],
                      [stats.review, 'Te valideren / Review'],
                      [stats.reports, 'Open datameldingen / Open reports'],
                    ].map(([n, label]) => (
                      <div className="stat" key={display(label)}>
                        <strong>{n}</strong>
                        {label}
                      </div>
                    ))}
                  </div>
                  {health && (
                    <section className="panel admin-routing-health">
                      <h2>Routing health</h2>
                      <div className="stat-row">
                        <div className="stat"><strong>{display(health.routing.routingCoveragePercent)}%</strong>Coverage</div>
                        <div className="stat"><strong>{display(health.routing.directMappings)}</strong>Direct</div>
                        <div className="stat"><strong>{display(health.routing.inferredMappings)}</strong>Inferred</div>
                        <div className="stat"><strong>{display(health.routing.needsReview)}</strong>Needs review</div>
                        <div className="stat"><strong>{display(health.routing.locationsOutsideMainComponent)}</strong>Disconnected</div>
                        <div className="stat"><strong>{display(health.accessibility.publicLocationsWithPossibleWheelchairRoute)}</strong>Possible wheelchair</div>
                        <div className="stat"><strong>{display(health.accessibility.publicLocationsConfirmedAccessible)}</strong>Confirmed accessible</div>
                        <div className="stat"><strong>{display(health.gems.needsReview)}</strong>Gem locations to review</div>
                      </div>
                      <p className="form-note">Onbekende toegankelijkheidsdata telt als verificatiewerk, niet als graph-fout. / Unknown accessibility data is verification work, not a graph error.</p>
                    </section>
                  )}
                  <h2 style={{ fontSize: 22, margin: '25px 0' }}>
                    Recent gewijzigd / Recently changed
                  </h2>
                  <div className="panel">
                    {rows.map((r, i) => (
                      <p key={i}>
                        {display(
                          r.title ?? (r.name as { nl: string })?.nl ?? r.id,
                        )}{' '}
                        · {display(r.updated_at ?? '')}
                      </p>
                    ))}
                  </div>
                </>
              ) : table === 'data_reports' ? (
                <div className="card-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))'}}>
                 {[...rows].sort((a,b)=>Number(b.status==='pending')-Number(a.status==='pending')||display(b.created_at).localeCompare(display(a.created_at))).map(r=><article className="report-card" key={display(r.id)}>
                  <span className="badge">{display(r.status)}</span><h3>{display(r.report_type)}</h3><p>{display(r.message)||'Geen toelichting / No comment'}</p>
                  {Boolean(r.searched_code)&&<p>Zoekopdracht / Search: {display(r.searched_code)}</p>}
                  {Boolean(r.entity_id)&&<><Link className="text-link" href={'/map?to='+display(r.entity_id)} target="_blank">Bekijk locatie / View location →</Link><Link className="text-link" href={'/admin/locations?edit='+display(r.entity_id)}>Locatie bewerken / Edit location →</Link></>}
                  <small>{display(r.created_at)}</small><form onSubmit={e=>{e.preventDefault();const form=new FormData(e.currentTarget);void save({id:r.id,status:form.get('status'),internal_note:form.get('internal_note')}).catch(()=>{});}}>
                   <label className="field-label">Afhandeling / Resolution<select className="field-input" name="status" defaultValue={display(r.status)}><option value="pending">Te beoordelen / Pending</option><option value="resolved">Opgelost / Resolved</option><option value="rejected">Afgewezen / Rejected</option></select></label>
                   <label className="field-label">Interne notitie / Internal note<textarea className="field-input" name="internal_note" maxLength={4000} defaultValue={display(r.internal_note)} rows={3}/></label>
                   <button className="primary-button">Afhandeling opslaan / Save resolution</button>
                  </form></article>)}
                  {!rows.length&&<p>Geen datameldingen / No reports</p>}
                </div>
              ) : table === 'user_feedback' ? (
                <section className="panel"><h2>Feedback</h2><p>{rows.filter(r=>r.helpful===true).length} gevonden / found · {rows.filter(r=>r.helpful===false).length} niet gevonden / not found</p><div className="stat-row">{['search','location','route'].map(c=><div className="stat" key={c}><strong>{rows.filter(r=>r.context===c&&r.helpful===true).length} / {rows.filter(r=>r.context===c).length}</strong>{c} · positief / total</div>)}</div></section>
              ) : table === 'hidden_gems' ? (
                <div
                  className="card-grid"
                  style={{
                    gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
                  }}
                >
                  {rows.map((r) => {
                    const g = r as unknown as Gem;
                    return (
                      <article key={g.id} className="gem-card">
                        <span className="badge">{g.status}</span>
                        {g.photo_path && (
                          <Image unoptimized
                            src={'/api/gems/' + g.id + '/photo?moderate=1'}
                            alt={g.title}
                            width={300}
                            height={180}
                            style={{
                              width: '100%',
                              objectFit: 'cover',
                              marginTop: 12,
                            }}
                          />
                        )}
                        <h2>{g.title}</h2>
                        <p>{g.description}</p>
                        {g.location_id ? <Link
                          className="text-link"
                          href={'/map?to=' + g.location_id}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Locatie controleren / Check location →
                        </Link> : <div className="gem-location-proposal"><strong>{g.proposed_location_name}</strong><p>{g.proposed_location_description}</p><small>{[g.proposed_building_id,g.proposed_floor_id,g.proposed_room_zone].filter(Boolean).join(' · ') || 'Gebouw en verdieping onbekend / unknown'}</small></div>}
                        <label className="field-label">
                          Canonieke locatie / Canonical location
                          <select className="field-input" defaultValue={g.location_id ?? ''} onChange={(event)=>{if(event.target.value)void save({...r,location_id:event.target.value},'hidden_gems').catch(()=>{});}}>
                            <option value="">Nog niet koppelen / Keep proposed</option>
                            {locations.filter((entry)=>entry.status==='approved'&&entry.routing_status==='direct').map((entry)=><option key={display(entry.id)} value={display(entry.id)}>{display((entry.name as {nl?:string})?.nl ?? entry.id)} · {display(entry.id)}</option>)}
                          </select>
                        </label>
                        {!g.location_id&&<Link className="text-link" href="/admin/locations">Nieuwe canonieke locatie maken / Create canonical location →</Link>}
                        <div
                          style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}
                        >
                          <button
                            aria-label="Goedkeuren / Approve"
                            className="secondary-button"
                            onClick={() =>
                              void save({ ...r, status: 'approved' }).catch(
                                () => {},
                              )
                            }
                          >
                            <Check size={17} />
                            Approve
                          </button>
                          <button
                            aria-label="Afwijzen / Reject"
                            className="secondary-button"
                            onClick={() =>
                              void save({ ...r, status: 'rejected' }).catch(
                                () => {},
                              )
                            }
                          >
                            <X size={17} />
                          </button>
                          <button
                            aria-label="Featured"
                            className="secondary-button"
                            onClick={() =>
                              void save({ ...r, featured: !g.featured }).catch(
                                () => {},
                              )
                            }
                          >
                            <Star
                              size={17}
                              fill={g.featured ? 'currentColor' : 'none'}
                            />
                          </button>
                          <button
                            className="text-link"
                            onClick={() => setEdit(JSON.stringify(r, null, 2))}
                          >
                            Bewerken / Edit
                          </button>
                          <button
                            className="icon-button"
                            aria-label="Verwijderen / Delete"
                            onClick={() => setRemove(r)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                  {!rows.length && (
                    <div className="empty-state">
                      Geen inzendingen / No submissions
                    </div>
                  )}
                </div>
              ) : table === 'locations' ? (
                <div className="panel" style={{ overflowX: 'auto' }}>
                  <table className="admin-table"><thead><tr><th>Locatie</th><th>Route</th><th>Endpoint-node</th><th>Verificatie</th><th>Acties</th></tr></thead><tbody>
                    {rows.map((r)=><tr key={display(r.id)}><td><strong>{display((r.name as {nl?:string})?.nl ?? r.id)}</strong><br/><small>{display(r.building_id)} · {display(r.floor_id)}</small></td><td><span className="badge">{display(r.routing_status)}</span><br/><small>{display(r.endpoint_source)}</small></td><td><select className="field-input" value={display(r.node_id)} onChange={(event)=>void save({...r,node_id:event.target.value||null}).catch(()=>{})}><option value="">Controle nodig</option>{routeNodes.filter((node)=>node.building_id===r.building_id&&node.floor_id===r.floor_id).map((node)=><option key={display(node.id)} value={display(node.id)}>{display(node.id)} · {display((node.label as {nl?:string})?.nl)}</option>)}</select></td><td>{display(r.verification_status)}</td><td><button className="text-link" onClick={()=>void save({...r,verification_status:'verified'}).catch(()=>{})}>Markeer verified</button><button className="text-link" onClick={()=>setEdit(JSON.stringify(r,null,2))}>Bewerken / Edit</button></td></tr>)}
                  </tbody></table>
                </div>
              ) : (
                <>
                  <div className="panel" style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Status / Label</th>
                          <th>Acties / Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={display(r.id ?? r.code)}>
                            <td>{display(r.id ?? r.code)}</td>
                            <td>
                              {display(
                                r.verification_status ??
                                  r.label ??
                                  r.code ??
                                  '',
                              )}
                            </td>
                            <td>
                              <button
                                className="text-link"
                                onClick={() =>
                                  setEdit(JSON.stringify(r, null, 2))
                                }
                              >
                                Bewerken / Edit
                              </button>
                              {table === 'qr_locations' && (
                                <button
                                  className="text-link"
                                  onClick={async () => {
                                    const url = await QRCode.toDataURL(
                                      window.location.origin +
                                        '/map?from=qr:' +
                                        encodeURIComponent(display(r.code)),
                                      { width: 500, margin: 3 },
                                    );
                                    setQr(url);
                                  }}
                                >
                                  QR export
                                </button>
                              )}
                              <button
                                className="icon-button"
                                aria-label="Verwijderen / Delete"
                                onClick={() => setRemove(r)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {table === 'floors' && (
                    <MapEditor
                      read={read}
                      save={save}
                      floors={rows as unknown as Floor[]}
                    />
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </main>
      <Dialog
        open={edit !== null}
        onOpenChange={(v) => {
          if (!v) setEdit(null);
        }}
      >
        <DialogContent className="dialog-form">
          <DialogTitle>Gegevens bewerken / Edit record</DialogTitle>
          <DialogDescription>
            NL/EN-velden en bronstatus blijven samen opgeslagen. / Translations
            and verification status are saved together.
          </DialogDescription>
          <label className="field-label">
            JSON
            <textarea
              className="field-input admin-json"
              value={edit ?? ''}
              onChange={(e) => setEdit(e.target.value)}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button
            className="primary-button"
            onClick={async () => {
              try {
                const row = JSON.parse(edit ?? '{}') as Row;
                await save(row);
                setEdit(null);
              } catch {
                setError(
                  'Ongeldige gegevens of opslaan mislukt / Invalid data or save failed',
                );
              }
            }}
          >
            <Save size={18} />
            Opslaan / Save
          </button>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!remove}
        onOpenChange={(v) => {
          if (!v) setRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Verwijderen? / Delete?</AlertDialogTitle>
          <AlertDialogDescription>
            Dit verwijdert de geselecteerde record. Verwijzingen kunnen
            verwijderen blokkeren. / This removes the selected record. Linked
            records may prevent deletion.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren / Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!remove) return;
                const r = await fetch('/api/admin/' + table, {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: remove.id ?? remove.code }),
                });
                if (!r.ok) setError('Verwijderen mislukt / Delete failed');
                else await refresh();
                setRemove(null);
              }}
            >
              Verwijderen / Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={!!qr}
        onOpenChange={(v) => {
          if (!v) setQr('');
        }}
      >
        <DialogContent>
          <DialogTitle>QR export</DialogTitle>
          <DialogDescription>
            Valideer het startpunt voordat je de code plaatst. / Validate the
            starting point before placement.
          </DialogDescription>
          {qr && (
            <>
              <Image unoptimized src={qr} alt="QR code" width={300} height={300} />
              <Link
                className="primary-button"
                href={qr}
                download="campuskompas-qr.png"
              >
                Download PNG
              </Link>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
function defaultRow(table: string): Row {
  const id = 'new-' + Date.now(),
    text = { nl: 'Nieuwe locatie', en: 'New location' };
  const defaults: Record<string, Row> = {
    locations: {
      id,
      name: text,
      description: { nl: 'Beschrijving', en: 'Description' },
      building_id: 'R8',
      floor_id: 'R8-0',
      category_id: 'study',
      aliases: [],
      node_id: null,
      x: 375,
      y: 280,
      status: 'pending',
      verification_status: 'unverified',
      source_id: 'campus',
      routing_status: 'needs_review',
      endpoint_source: null,
    },
    rooms: { id, code: '', location_id: '', public: false },
    floors: {
      id,
      building_id: 'R8',
      level: 4,
      geometry: [],
      verification_status: 'unverified',
    },
    route_nodes: {
      id,
      building_id: 'R8',
      floor_id: 'R8-0',
      x: 375,
      y: 280,
      node_type: 'waypoint',
      label: text,
      accessible: false,
      accessibility_status: 'unverified',
      verification_status: 'unverified',
    },
    route_edges: {
      id,
      from_node_id: '',
      to_node_id: '',
      weight: 1,
      edge_type: 'corridor',
      accessible: false,
      accessibility_status: 'unverified',
      verification_status: 'unverified',
      bidirectional: true,
    },
    first_year_tips: {
      id,
      title: text,
      body: text,
      icon: 'info',
      published: false,
    },
    opening_hours: {
      id,
      weekly: {},
      exceptions: {},
      verified_at: new Date().toISOString().slice(0, 10),
      verification_status: 'unverified',
      exceptions_reviewed_through: null,
      source_url: 'https://www.nhlstenden.com/locaties/leeuwarden',
    },
    qr_locations: {
      code: id,
      route_node_id: '',
      label: 'QR location',
      active: false,
    },
  };
  return defaults[table] ?? { id };
}

function display(value:unknown):string{return typeof value==='string'?value:typeof value==='number'||typeof value==='boolean'?String(value):value==null?'':JSON.stringify(value);}
