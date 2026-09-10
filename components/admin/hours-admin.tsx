'use client';

import { useMemo, useState } from 'react';
import {
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import type { Gem, Hours, Location } from '@/lib/campus/types';

type PeriodInput = { value: string; closed: boolean };
type ExceptionInput = PeriodInput & { date: string };
type Draft = Omit<Hours, 'weekly' | 'exceptions'> & {
  weekly: Record<string, PeriodInput>;
  exceptions: ExceptionInput[];
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
    source_url: 'https://www.nhlstenden.com/',
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

function fromDraft(draft: Draft): Hours {
  if (!draft.id.trim()) throw new Error('ID is verplicht / required');
  if (
    draft.verification_status === 'verified' &&
    !draft.source_url.startsWith('https://')
  ) {
    throw new Error(
      'Verified tijden vereisen een HTTPS-bron / require an HTTPS source',
    );
  }
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
  gems,
  onSave,
}: {
  hours: Hours[];
  locations: Location[];
  gems: Gem[];
  onSave: (hours: Hours) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
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
        {hours.map((record) => {
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
                <h2>{record.id}</h2>
                <p>
                  {record.hours_kind.replaceAll('_', ' ')} · {connections}{' '}
                  koppeling(en)
                </p>
              </div>
              <button
                className="secondary-button"
                onClick={() => {
                  setDraft(toDraft(record));
                  setError('');
                }}
              >
                <Clock3 size={17} /> Bewerken / Edit
              </button>
            </article>
          );
        })}
        <button
          className="hours-admin-new"
          onClick={() => {
            setDraft(newDraft());
            setError('');
          }}
        >
          <Plus size={20} /> Nieuw urenrecord / New hours record
        </button>
      </div>

      {draft && (
        <form
          className="panel hours-admin-form"
          onSubmit={(event) => {
            event.preventDefault();
            setError('');
            try {
              const record = fromDraft(draft);
              void onSave(record)
                .then(() => setDraft(toDraft(record)))
                .catch(() => setError('Opslaan mislukt / Save failed'));
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
              <h2>{draft.id}</h2>
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
              ID
              <input
                className="field-input"
                value={draft.id}
                onChange={(event) =>
                  setDraft({ ...draft, id: event.target.value })
                }
                required
              />
            </label>
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
                <option value="verified">verified</option>
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
          <label className="field-label">
            Officiële bron / Official source
            <input
              className="field-input"
              type="url"
              value={draft.source_url}
              onChange={(event) =>
                setDraft({ ...draft, source_url: event.target.value })
              }
              required
            />
          </label>
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
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button">
            <Save size={18} /> Openingstijden opslaan / Save hours
          </button>
        </form>
      )}
    </div>
  );
}
