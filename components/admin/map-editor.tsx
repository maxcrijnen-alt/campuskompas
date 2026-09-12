'use client';
import { useEffect, useState, useRef } from 'react';
import type { Floor, RouteNode, RouteEdge, Location } from '@/lib/campus/types';
import { FloorLayer } from '@/components/campus/map';
import { Picker } from '@/components/campus/picker';
type Row = Record<string, unknown>;
export function MapEditor({
  floors,
  read,
  save,
}: {
  floors: Floor[];
  read: (t: string) => Promise<Row[]>;
  save: (r: Row, t: string) => Promise<void>;
}) {
  const [floorId, setFloor] = useState(floors[0]?.id ?? ''),
    [nodes, setNodes] = useState<RouteNode[]>([]),
    [edges, setEdges] = useState<RouteEdge[]>([]),
    [locations, setLocations] = useState<Location[]>([]),
    [mode, setMode] = useState('move'),
    [selected, setSelected] = useState(''),
    [edgeFrom, setEdgeFrom] = useState(''),
    [status, setStatus] = useState('');
  const svg = useRef<SVGSVGElement>(null),
    drag = useRef<string | null>(null);
  const floor = floors.find((f) => f.id === floorId);
  useEffect(() => {
    Promise.all([read('route_nodes'), read('route_edges'), read('locations')])
      .then(([n, e, l]) => {
        setNodes(n as unknown as RouteNode[]);
        setEdges(e as unknown as RouteEdge[]);
        setLocations(l as unknown as Location[]);
      })
      .catch(() => setStatus('Laden mislukt / Load failed'));
    // Load editor data once; saves update the local editor independently.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function point(e: React.PointerEvent<SVGSVGElement>) {
    const el = svg.current;
    if (!el) return { x: 0, y: 0 };
    const p = el.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const matrix = el.getScreenCTM();
    const q = matrix ? p.matrixTransform(matrix.inverse()) : p;
    return {
      x: Math.max(0, Math.min(800, Math.round(q.x))),
      y: Math.max(0, Math.min(600, Math.round(q.y))),
    };
  }
  async function persist(record: Row, table: string) {
    try {
      await save(record, table);
      setStatus('Opgeslagen / Saved');
    } catch {
      setStatus('Niet opgeslagen / Not saved');
    }
  }
  const selectedNode = nodes.find((n) => n.id === selected),
    selectedLocation = locations.find((l) => l.id === selected);
  return (
    <section className="panel" style={{ marginTop: 20 }}>
      <h2>Kaarteditor / Map editor</h2>
      <p>
        Sleep punten op de schematische kaart. Gebruik de recordeditor voor
        vectorgeometrie. / Drag markers; edit vector geometry in the record
        editor.
      </p>
      <div className="form-grid">
        <Picker
          label="Verdieping / Floor"
          value={floorId}
          onChange={setFloor}
          options={floors.map((f) => ({ value: f.id, label: f.id }))}
        />
        <Picker
          label="Gereedschap / Tool"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'move', label: 'Verplaatsen / Move' },
            { value: 'node', label: 'Node toevoegen / Add node' },
            { value: 'edge', label: 'Verbinden / Connect' },
          ]}
        />
      </div>
      {floor && (
        <svg
          ref={svg}
          viewBox="0 0 800 600"
          style={{
            width: '100%',
            background: '#f0f3ed',
            touchAction: 'none',
            borderRadius: 12,
          }}
          onPointerDown={(e) => {
            if (mode === 'node') {
              const p = point(e);
              const n: RouteNode = {
                id: 'node-' + crypto.randomUUID(),
                floor_id: floor.id,
                building_id: floor.building_id,
                ...p,
                node_type: 'waypoint',
                label: { nl: 'Waypoint', en: 'Waypoint' },
                accessible: false,
                accessibility_status: 'verified',
                verification_status: 'verified',
              };
              setNodes([...nodes, n]);
              setSelected(n.id);
              void persist(n as unknown as Row, 'route_nodes');
            }
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const p = point(e);
            setNodes((ns) =>
              ns.map((n) => (n.id === drag.current ? { ...n, ...p } : n)),
            );
            setLocations((ls) =>
              ls.map((l) => (l.id === drag.current ? { ...l, ...p } : l)),
            );
          }}
          onPointerUp={() => {
            const id = drag.current;
            drag.current = null;
            const n = nodes.find((n) => n.id === id),
              l = locations.find((l) => l.id === id);
            if (n) void persist(n as unknown as Row, 'route_nodes');
            if (l) void persist(l as unknown as Row, 'locations');
          }}
        >
          <FloorLayer floor={floor} />
          {edges.map((edge) => {
            const a = nodes.find(
                (n) => n.id === edge.from_node_id && n.floor_id === floorId,
              ),
              b = nodes.find(
                (n) => n.id === edge.to_node_id && n.floor_id === floorId,
              );
            return a && b ? (
              <line
                key={edge.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#187151"
                strokeWidth={5}
              />
            ) : null;
          })}
          {[
            ...nodes.filter((n) => n.floor_id === floorId),
            ...locations.filter((l) => l.floor_id === floorId),
          ].map((n) => (
            <circle
              key={n.id}
              cx={n.x}
              cy={n.y}
              r={selected === n.id ? 15 : 10}
              fill={'node_type' in n ? '#175d46' : '#3858bb'}
              stroke="white"
              strokeWidth={3}
              onPointerDown={(e) => {
                e.stopPropagation();
                setSelected(n.id);
                if (mode === 'move') {
                  drag.current = n.id;
                  svg.current?.setPointerCapture(e.pointerId);
                }
                if (mode === 'edge' && 'node_type' in n) {
                  if (!edgeFrom) setEdgeFrom(n.id);
                  else if (edgeFrom !== n.id) {
                    const edge: RouteEdge = {
                      id: 'edge-' + crypto.randomUUID(),
                      from_node_id: edgeFrom,
                      to_node_id: n.id,
                      weight: 1,
                      edge_type: 'corridor',
                      accessible: false,
                      accessibility_status: 'verified',
                      verification_status: 'verified',
                      bidirectional: true,
                    };
                    setEdges([...edges, edge]);
                    setEdgeFrom('');
                    void persist(edge as unknown as Row, 'route_edges');
                  }
                }
              }}
            >
              <title>{n.id}</title>
            </circle>
          ))}
        </svg>
      )}
      <Picker
        label="Selecteer punt (toetsenbord) / Select point"
        value={selected}
        onChange={setSelected}
        options={[
          ...nodes.filter((n) => n.floor_id === floorId),
          ...locations.filter((l) => l.floor_id === floorId),
        ].map((n) => ({ value: n.id, label: n.id }))}
      />
      {(selectedNode || selectedLocation) && (
        <div className="form-grid">
          {(['x', 'y'] as const).map((axis) => (
            <label key={axis} className="field-label">
              {axis.toUpperCase()}
              <input
                className="field-input"
                type="number"
                value={(selectedNode ?? selectedLocation)![axis]}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setNodes((ns) =>
                    ns.map((n) =>
                      n.id === selected ? { ...n, [axis]: value } : n,
                    ),
                  );
                  setLocations((ls) =>
                    ls.map((l) =>
                      l.id === selected ? { ...l, [axis]: value } : l,
                    ),
                  );
                }}
              />
            </label>
          ))}
          <button
            className="primary-button"
            onClick={() =>
              void persist(
                (selectedNode ?? selectedLocation) as unknown as Row,
                selectedNode ? 'route_nodes' : 'locations',
              )
            }
          >
            Coördinaten opslaan / Save coordinates
          </button>
        </div>
      )}
      {selectedLocation && (
        <Picker
          label="Route node koppelen / Link route node"
          value={selectedLocation.node_id ?? ''}
          options={nodes
            .filter((n) => n.floor_id === floorId)
            .map((n) => ({ value: n.id, label: n.id }))}
          onChange={(id) => {
            const l = { ...selectedLocation, node_id: id };
            setLocations((ls) => ls.map((old) => (old.id === l.id ? l : old)));
            void persist(l as unknown as Row, 'locations');
          }}
        />
      )}
      {edgeFrom && (
        <p className="notice">
          Selecteer tweede node / Select second node: {edgeFrom}
        </p>
      )}
      <p role="status">{status}</p>
    </section>
  );
}
