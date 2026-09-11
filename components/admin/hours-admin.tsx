'use client';

import { useMemo, useState } from 'react';
import {
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Link2,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { OpeningHours } from '@/components/campus/opening-hours';
import type { Category, Gem, Hours, Location } from '@/lib/campus/types';

type PeriodInput = { value: string; closed: boolean };
type ExceptionInput = PeriodInput & { date: string };
type Draft = Omit<Hours, 'weekly' | 'exceptions'> & {
  weekly: Record<string, PeriodInput>;
  exceptions: ExceptionInput[];
};
export type HoursLinkTarget = {
  target_type: 'location' | 'hidden_gem';
  target_id: string;
};
type TargetOption = HoursLinkTarget & {
  key: string;
  label: string;
  meta: string;
  hours_id: string | null;
  search: string;
};

const weekdayNames = [
  'Zondag',
  'Maandag',
  'Dinsdag',
  'Woensdag',
  'Donderdag',
  'Vrijdag',
  'Zaterdag',
];
const orderedDays = [1, 2, 3, 4, 5, 6, 0];
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function periodsToText(periods: [string, string][] | null | undefined) {
  return periods?.map(([start, end]) => `${start}–${end}`).join(', ') ?? '';
}

function toDraft(hours: Hours): Draft {
  return {
    ...hours,
    weekly: Object.fromEntries(
      orderedDays.map((day) => {
        const periods = hours.weekly[String(day)];
        return [
          String(day),
          {
            value: periodsToText(periods),
            closed: Array.isArray(periods) && periods.length === 0,
          },
        ];
      }),
    ),
    exceptions: Object.entries(hours.exceptions)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, periods]) => ({
        date,
        value: periodsToText(periods),
        closed: Array.isArray(periods) && periods.length === 0,
      })),
  };
}

function newDraft(): Draft {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `hours-${Date.now()}`,
    weekly: Object.fromEntries(
      orderedDays.map((day) => [String(day), { value: '', closed: false }]),
    ),
    exceptions: [],
    verified_at: today,
    verification_status: 'unverified',
    exceptions_reviewed_through: null,
    source_url: null,
    source_type: 'manual_admin',
    source_description: '',
    hours_kind: 'physical_opening',
    display_note: { nl: '', en: '' },
    timezone: 'Europe/Amsterdam',
  };
}

function parsePeriods(input: PeriodInput, label: string) {
  if (input.closed) return [];
  if (!input.value.trim()) return null;
  const periods = input.value.split(',').map((part) => {
    const values = part.trim().split(/\s*[–-]\s*/);
    if (
      values.length !== 2 ||
      !values.every((value) => timePattern.test(value))
    ) {
      throw new Error(`${label}: gebruik HH:mm–HH:mm / use HH:mm–HH:mm`);
    }
    const [start, end] = values as [string, string];
    if (start >= end)
      throw new Error(`${label}: eindtijd moet later zijn / end must be later`);
    return [start, end] as [string, string];
  });
  periods.sort(([a], [b]) => a.localeCompare(b));
  periods.slice(1).forEach(([start], index) => {
    if (start < periods[index][1])
      throw new Error(`${label}: tijdsblokken overlappen / periods overlap`);
  });
  return periods;
}

export function fromDraft(draft: Draft): Hours {
  if (!draft.id.trim()) throw new Error('ID is verplicht / required');
  if (
    draft.source_type === 'official_web' &&
    !draft.source_url?.startsWith('https://')
  ) {
    throw new Error(
      'Een officiële webbron vereist een HTTPS-URL / requires an HTTPS URL',
    );
  }
  if (draft.source_url && !draft.source_url.startsWith('https://'))
    throw new Error('Bron-URL moet HTTPS gebruiken / must use HTTPS');
  if (draft.source_description.trim().length < 3)
    throw new Error('Beschrijf de bron kort / briefly describe the source');
  if (
    draft.source_type === 'manual_admin' &&
    draft.verification_status === 'verified'
  )
    throw new Error(
      'Een handmatige beheernotitie kan niet verified zijn / cannot be verified',
    );
  if (
    draft.exceptions_reviewed_through &&
    draft.exceptions_reviewed_through < draft.verified_at
  ) {
    throw new Error(
      'Exception review date cannot be before the verification date',
    );
  }
  const weekly = Object.fromEntries(
    orderedDays.map((day) => [
      String(day),
      parsePeriods(draft.weekly[String(day)], weekdayNames[day]),
    ]),
  );
  const exceptions: Hours['exceptions'] = {};
  for (const exception of draft.exceptions) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(exception.date) ||
      Number.isNaN(Date.parse(`${exception.date}T12:00:00Z`))
    ) {
      throw new Error(
        'Uitzondering heeft een ongeldige datum / invalid exception date',
      );
    }
    if (Object.hasOwn(exceptions, exception.date))
      throw new Error(
        'Een datum mag maar één uitzondering hebben / duplicate exception date',
      );
    exceptions[exception.date] = parsePeriods(exception, exception.date);
  }
  return {
    ...draft,
    weekly,
    exceptions,
    exceptions_reviewed_through: draft.exceptions_reviewed_through || null,
  };
}

export function HoursAdmin({
  hours,
  locations,
  categories,
  gems,
  onSave,
}: {
  hours: Hours[];
  locations: Location[];
  categories: Category[];
  gems: Gem[];
  onSave: (hours: Hours, target: HoursLinkTarget | null) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [targetQuery, setTargetQuery] = useState('');
  const [selectedTargetKey, setSelectedTargetKey] = useState<string | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const hoursRelevantCategoryIds = useMemo(
    () =>
      new Set(
        categories
          .filter((category) => category.hours_relevant)
          .map((category) => category.id),
      ),
    [categories],
  );
  const targetOptions = useMemo<TargetOption[]>(
    () =>
      [
        ...locations
          .filter(
            (location) =>
              location.status === 'approved' &&
              hoursRelevantCategoryIds.has(location.category_id),
          )
          .map((location) => {
            const label = location.name.nl || location.name.en;
            const meta = [
              location.building_id,
              location.floor_id,
              location.room_code,
            ]
              .filter(Boolean)
              .join(' · ');
            return {
              key: `location:${location.id}`,
              target_type: 'location' as const,
              target_id: location.id,
              label,
              meta,
              hours_id: location.hours_id ?? null,
              search:
                `${label} ${location.name.en} ${meta} ${location.aliases.join(' ')}`.toLocaleLowerCase(
                  'nl',
                ),
            };
          }),
        ...gems
          .filter((gem) => gem.status === 'approved')
          .map((gem) => ({
            key: `hidden_gem:${gem.id}`,
            target_type: 'hidden_gem' as const,
            target_id: gem.id,
            label: gem.title,
            meta: 'Hidden Gem',
            hours_id: gem.hours_id ?? null,
            search: `${gem.title} hidden gem`.toLocaleLowerCase('nl'),
          })),
      ].sort((a, b) => a.label.localeCompare(b.label, 'nl')),
    [locations, gems, hoursRelevantCategoryIds],
  );
  const selectedTarget =
    targetOptions.find((target) => target.key === selectedTargetKey) ?? null;
  const hoursRecordLabels = useMemo(
    () =>
      new Map(
        hours.map((record) => {
          const names = [
            ...locations
              .filter((location) => location.hours_id === record.id)
              .map((location) => location.name.nl),
            ...gems
              .filter((gem) => gem.hours_id === record.id)
              .map((gem) => gem.title),
          ];
          const subject =
            names.join(', ') || `${record.source_description.slice(0, 55)}…`;
          return [
            record.id,
            `${subject} · ${record.hours_kind.replaceAll('_', ' ')} · ${record.verification_status}`,
          ] as const;
        }),
      ),
    [gems, hours, locations],
  );
  const matchingTargets = useMemo(() => {
    const query = targetQuery.trim().toLocaleLowerCase('nl');
    if (query.length < 2 || selectedTarget?.label === targetQuery) return [];
    return targetOptions
      .filter((target) => target.search.includes(query))
      .slice(0, 8);
  }, [selectedTarget, targetOptions, targetQuery]);
  const preview = useMemo(() => {
    if (!draft) return undefined;
    try {
      return fromDraft(draft);
    } catch {
      return undefined;
    }
  }, [draft]);
  const linked = useMemo(() => {
    if (!draft) return [];
    return [
      ...locations
        .filter((location) => location.hours_id === draft.id)
        .map((location) => `${location.name.nl} · ${location.building_id}`),
      ...gems
        .filter((gem) => gem.hours_id === draft.id)
        .map((gem) => `${gem.title} · Hidden Gem`),
    ];
  }, [draft, locations, gems]);

  return (
    <div className="hours-admin">
      <div className="hours-admin-list">
        <section className="panel hours-target-picker">
          <span className="eyebrow">KOPPELING / LINK</span>
          <h2>Zoek een voorziening</h2>
          <p className="form-note">
            Zoek op naam en kies daarna bestaande of nieuwe openingstijden.
          </p>
          <label className="field-label">
            Voorziening of Hidden Gem / Facility or Hidden Gem
            <span className="hours-target-search">
              <Search size={17} aria-hidden="true" />
              <input
                className="field-input"
                type="search"
                value={targetQuery}
                placeholder="Bijv. Bibliotheek of BRUZE"
                onChange={(event) => {
                  setTargetQuery(event.target.value);
                  if (event.target.value !== selectedTarget?.label)
                    setSelectedTargetKey(null);
                }}
              />
            </span>
          </label>
          {matchingTargets.length > 0 && (
            <div
              className="hours-target-results"
              aria-label="Zoekresultaten / Search results"
            >
              {matchingTargets.map((target) => (
                <button
                  type="button"
                  key={target.key}
                  onClick={() => {
                    setSelectedTargetKey(target.key);
                    setTargetQuery(target.label);
                    const current = hours.find(
                      (record) => record.id === target.hours_id,
                    );
                    setDraft(current ? toDraft(current) : newDraft());
                    setError('');
                  }}
                >
                  <strong>{target.label}</strong>
                  <span>{target.meta}</span>
                </button>
              ))}
            </div>
          )}
          {selectedTarget && (
            <div className="hours-target-selected" role="status">
              <strong>{selectedTarget.label}</strong>
              <span>{selectedTarget.meta}</span>
              <label className="field-label">
                Urenrecord / Hours record
                <select
                  className="field-input"
                  value={
                    draft && hours.some((record) => record.id === draft.id)
                      ? draft.id
                      : '__new__'
                  }
                  onChange={(event) => {
                    const record = hours.find(
                      (entry) => entry.id === event.target.value,
                    );
                    setDraft(record ? toDraft(record) : newDraft());
                    setError('');
                  }}
                >
                  <option value="__new__">Nieuwe tijden invoeren</option>
                  {hours.map((record) => (
                    <option key={record.id} value={record.id}>
                      {hoursRecordLabels.get(record.id)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </section>
        {hours.map((record) => {
          const connectedNames = [
            ...locations
              .filter((location) => location.hours_id === record.id)
              .map((location) => location.name.nl),
            ...gems
              .filter((gem) => gem.hours_id === record.id)
              .map((gem) => gem.title),
          ];
          const connections =
            locations.filter((location) => location.hours_id === record.id)
              .length + gems.filter((gem) => gem.hours_id === record.id).length;
          return (
            <article className="hours-admin-card" key={record.id}>
              <div>
                <span
                  className={`status-chip ${record.verification_status === 'verified' ? 'status-success' : 'status-warning'}`}
                >
                  {record.verification_status === 'verified' && (
                    <CheckCircle2 size={14} />
                  )}
                  {record.verification_status}
                </span>
                <h2>{connectedNames.join(', ') || 'Nog niet gekoppeld'}</h2>
                <p>
                  {record.hours_kind.replaceAll('_', ' ')} · {connections}{' '}
                  koppeling(en)
                </p>
              </div>
              <button
                className="secondary-button"
                onClick={() => {
                  setSelectedTargetKey(null);
                  setTargetQuery('');
                  setDraft(toDraft(record));
                  setError('');
                }}
              >
                <Clock3 size={17} /> Bewerken / Edit
              </button>
            </article>
          );
        })}
      </div>

      {draft && (
        <form
          className="panel hours-admin-form"
          onSubmit={(event) => {
            event.preventDefault();
            setError('');
            try {
              const record = fromDraft(draft);
              if (
                !selectedTarget &&
                !hours.some((entry) => entry.id === record.id)
              )
                throw new Error(
                  'Kies eerst een voorziening / Select a facility first',
                );
              setSaving(true);
              void onSave(
                record,
                selectedTarget
                  ? {
                      target_type: selectedTarget.target_type,
                      target_id: selectedTarget.target_id,
                    }
                  : null,
              )
                .then(() => setDraft(toDraft(record)))
                .catch((caught) =>
                  setError(
                    caught instanceof Error
                      ? caught.message
                      : 'Opslaan mislukt / Save failed',
                  ),
                )
                .finally(() => setSaving(false));
            } catch (caught) {
              setError(
                caught instanceof Error
                  ? caught.message
                  : 'Ongeldige tijden / Invalid hours',
              );
            }
          }}
        >
          <div className="hours-admin-heading">
            <div>
              <span className="eyebrow">OPERATIONELE DATA</span>
              <h2>
                {selectedTarget?.label ??
                  linked[0] ??
                  'Openingstijden bewerken / Edit hours'}
              </h2>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Editor sluiten / Close editor"
              onClick={() => setDraft(null)}
            >
              ×
            </button>
          </div>
          <div className="form-grid">
            <label className="field-label">
              Soort / Scope
              <select
                className="field-input"
                value={draft.hours_kind}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    hours_kind: event.target.value as Hours['hours_kind'],
                  })
                }
              >
                <option value="physical_opening">
                  Fysieke opening / Physical opening
                </option>
                <option value="building_access">
                  Toegang gebouw / Building access
                </option>
                <option value="service_contact">Service/contact</option>
              </select>
            </label>
            <label className="field-label">
              Status
              <select
                className="field-input"
                value={draft.verification_status}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    verification_status: event.target
                      .value as Hours['verification_status'],
                  })
                }
              >
                <option
                  value="verified"
                  disabled={draft.source_type === 'manual_admin'}
                >
                  verified
                </option>
                <option value="needs_review">needs_review</option>
                <option value="unverified">unverified</option>
              </select>
            </label>
            <label className="field-label">
              Tijdzone / Timezone
              <input className="field-input" value={draft.timezone} readOnly />
            </label>
            <label className="field-label">
              Gecontroleerd op / Verified date
              <input
                className="field-input"
                type="date"
                value={draft.verified_at}
                onChange={(event) =>
                  setDraft({ ...draft, verified_at: event.target.value })
                }
                required
              />
            </label>
            <label className="field-label">
              Uitzonderingen gecontroleerd t/m / Exceptions reviewed through
              <input
                className="field-input"
                type="date"
                value={draft.exceptions_reviewed_through ?? ''}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    exceptions_reviewed_through: event.target.value || null,
                  })
                }
              />
            </label>
          </div>
          <fieldset className="hours-editor-section">
            <legend>Bron en herkomst / Source and provenance</legend>
            <div className="form-grid">
              <label className="field-label">
                Brontype / Source type
                <select
                  className="field-input"
                  value={draft.source_type}
                  onChange={(event) => {
                    const source_type = event.target
                      .value as Hours['source_type'];
                    setDraft({
                      ...draft,
                      source_type,
                      verification_status:
                        source_type === 'manual_admin' &&
                        draft.verification_status === 'verified'
                          ? 'needs_review'
                          : draft.verification_status,
                    });
                  }}
                >
                  <option value="official_web">
                    Officiële website / Official website
                  </option>
                  <option value="physical_signage">
                    Bord of poster op locatie / On-site signage
                  </option>
                  <option value="staff_confirmation">
                    Medewerkerbevestiging / Staff confirmation
                  </option>
                  <option value="manual_admin">
                    Handmatige beheernotitie / Manual admin note
                  </option>
                </select>
              </label>
              <label className="field-label">
                Bron-URL / Source URL{' '}
                {draft.source_type === 'official_web'
                  ? '(verplicht / required)'
                  : '(optioneel / optional)'}
                <input
                  className="field-input"
                  type="url"
                  value={draft.source_url ?? ''}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      source_url: event.target.value || null,
                    })
                  }
                  required={draft.source_type === 'official_web'}
                  placeholder="https://…"
                />
              </label>
            </div>
            <label className="field-label">
              Korte bronbeschrijving / Short source description
              <textarea
                className="field-input"
                rows={2}
                minLength={3}
                maxLength={500}
                value={draft.source_description}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    source_description: event.target.value,
                  })
                }
                placeholder="Waar en hoe zijn deze tijden gecontroleerd?"
                required
              />
            </label>
            {draft.source_type === 'manual_admin' && (
              <p className="form-note">
                Een handmatige notitie blijft needs_review of unverified en
                wordt publiek nooit als bevestigde open/gesloten-status getoond.
              </p>
            )}
          </fieldset>
          {linked.length > 0 && (
            <p className="hours-admin-links">
              <strong>Gekoppeld / Linked:</strong> {linked.join(', ')}
            </p>
          )}

          <fieldset className="hours-editor-section">
            <legend>Regulier weekschema / Regular week</legend>
            <p className="form-note">
              Meerdere blokken: 08:30–12:00, 13:00–17:00. Leeg betekent
              onbekend.
            </p>
            <div className="hours-week-editor">
              {orderedDays.map((day) => {
                const value = draft.weekly[String(day)];
                return (
                  <div key={day}>
                    <label htmlFor={`weekday-${day}`}>
                      {weekdayNames[day]}
                    </label>
                    <input
                      id={`weekday-${day}`}
                      className="field-input"
                      value={value.value}
                      disabled={value.closed}
                      placeholder="08:30–17:00"
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          weekly: {
                            ...draft.weekly,
                            [String(day)]: {
                              ...value,
                              value: event.target.value,
                            },
                          },
                        })
                      }
                    />
                    <label className="hours-closed-control">
                      <input
                        type="checkbox"
                        checked={value.closed}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            weekly: {
                              ...draft.weekly,
                              [String(day)]: {
                                ...value,
                                closed: event.target.checked,
                              },
                            },
                          })
                        }
                      />{' '}
                      Gesloten / Closed
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="hours-editor-section">
            <legend>Uitzonderingen / Exceptions</legend>
            <div className="hours-exception-editor">
              {draft.exceptions.map((exception, index) => (
                <div key={`${exception.date}-${index}`}>
                  <input
                    aria-label="Uitzonderingsdatum / Exception date"
                    className="field-input"
                    type="date"
                    value={exception.date}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        exceptions: draft.exceptions.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, date: event.target.value }
                            : item,
                        ),
                      })
                    }
                    required
                  />
                  <input
                    aria-label="Uitzonderingstijden / Exception periods"
                    className="field-input"
                    value={exception.value}
                    disabled={exception.closed}
                    placeholder="09:00–13:00"
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        exceptions: draft.exceptions.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, value: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                  <label className="hours-closed-control">
                    <input
                      type="checkbox"
                      checked={exception.closed}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          exceptions: draft.exceptions.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, closed: event.target.checked }
                              : item,
                          ),
                        })
                      }
                    />{' '}
                    Gesloten / Closed
                  </label>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Uitzondering verwijderen / Remove exception"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        exceptions: draft.exceptions.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      })
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setDraft({
                  ...draft,
                  exceptions: [
                    ...draft.exceptions,
                    { date: '', value: '', closed: false },
                  ],
                })
              }
            >
              <CalendarPlus size={17} /> Uitzondering toevoegen / Add exception
            </button>
          </fieldset>

          <div className="form-grid">
            <label className="field-label">
              Toelichting NL
              <textarea
                className="field-input"
                rows={3}
                value={draft.display_note.nl}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    display_note: {
                      ...draft.display_note,
                      nl: event.target.value,
                    },
                  })
                }
              />
            </label>
            <label className="field-label">
              Note EN
              <textarea
                className="field-input"
                rows={3}
                value={draft.display_note.en}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    display_note: {
                      ...draft.display_note,
                      en: event.target.value,
                    },
                  })
                }
              />
            </label>
          </div>
          <fieldset className="hours-editor-section hours-admin-preview">
            <legend>Publieke preview / Public preview</legend>
            {preview ? (
              <OpeningHours hours={preview} locale="nl" />
            ) : (
              <p className="form-note">
                Vul geldige tijden en broninformatie in om de publieke weergave
                te bekijken.
              </p>
            )}
          </fieldset>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button" disabled={saving}>
            {selectedTarget ? <Link2 size={18} /> : <Save size={18} />}{' '}
            {saving
              ? 'Opslaan… / Saving…'
              : selectedTarget
                ? 'Opslaan en koppelen / Save and link'
                : 'Openingstijden opslaan / Save hours'}
          </button>
        </form>
      )}
    </div>
  );
}
