/**
 * EnhancedCollection
 *
 * Renders dynamic content records from an enhanced collection in one of four
 * display modes: data-table, list, accordion, or grid.
 *
 * The display mode and options (search, filters, map) are read from the
 * element's `config.displaySettings` or passed directly as props.
 *
 * @example
 * ```tsx
 * <EnhancedCollection
 *   records={records}
 *   schema={schema}
 *   displayType="grid"
 *   showSearch
 * />
 * ```
 */

import { useState, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import { CollectionMap } from "./CollectionMap";

export interface EnhancedCollectionField {
  id: string;
  name: string;
  type: string;
  required?: boolean;
}

export interface DisplaySettings {
  displayType: "data-table" | "list" | "accordion" | "grid";
  showSearch?: boolean;
  showFilters?: boolean;
  showMap?: boolean;
}

interface EnhancedCollectionProps {
  /** The records to display */
  records: Record<string, any>[];
  /** Schema fields for the collection */
  fields: EnhancedCollectionField[];
  /** Display configuration */
  displayType?: DisplaySettings["displayType"];
  showSearch?: boolean;
  showFilters?: boolean;
  showMap?: boolean;
  /** Collection title (optional heading) */
  title?: string;
  className?: string;
}

export function EnhancedCollection({
  records,
  fields,
  displayType = "list",
  showSearch = false,
  showFilters = false,
  showMap = false,
  title,
  className = "",
}: EnhancedCollectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Get filterable fields (select/multiselect types)
  const filterableFields = useMemo(
    () => fields.filter((f) => f.type === "select" || f.type === "multiselect"),
    [fields],
  );

  // Filter and search records
  const filteredRecords = useMemo(() => {
    let result = records;

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((record) =>
        Object.values(record).some(
          (val) => typeof val === "string" && val.toLowerCase().includes(q),
        ),
      );
    }

    // Apply filters
    Object.entries(filterValues).forEach(([fieldId, value]) => {
      if (!value) return;
      result = result.filter((record) => {
        const fieldVal = record[fieldId];
        if (Array.isArray(fieldVal)) return fieldVal.includes(value);
        return String(fieldVal) === value;
      });
    });

    return result;
  }, [records, searchQuery, filterValues]);

  // Extract unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const opts: Record<string, string[]> = {};
    filterableFields.forEach((field) => {
      const values = new Set<string>();
      records.forEach((record) => {
        const val = record[field.id];
        if (Array.isArray(val)) val.forEach((v) => values.add(String(v)));
        else if (val) values.add(String(val));
      });
      opts[field.id] = Array.from(values).sort();
    });
    return opts;
  }, [records, filterableFields]);

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
      )}

      {/* Search + Filters toolbar */}
      {(showSearch || showFilters) && (
        <div className="flex flex-wrap gap-3 mb-4">
          {showSearch && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          )}
          {showFilters &&
            filterableFields.map((field) => (
              <select
                key={field.id}
                value={filterValues[field.id] || ""}
                onChange={(e) =>
                  setFilterValues((prev) => ({
                    ...prev,
                    [field.id]: e.target.value,
                  }))
                }
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">{field.name}: All</option>
                {(filterOptions[field.id] || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ))}
        </div>
      )}

      {/* No results */}
      {filteredRecords.length === 0 && (
        <p className="text-sm text-gray-500 py-6 text-center">
          {searchQuery || Object.values(filterValues).some(Boolean)
            ? "No results match your filters."
            : "No records to display."}
        </p>
      )}

      {/* Map view — shown above the list/grid when enabled and geopoint fields exist */}
      {showMap &&
        filteredRecords.length > 0 &&
        (() => {
          const geopointField = fields.find((f) => f.type === "geopoint");
          if (!geopointField) return null;
          const titleField = fields.find((f) => f.type === "text");
          const descField = fields.find(
            (f) => f.id !== titleField?.id && f.type === "text",
          );
          return (
            <CollectionMap
              records={filteredRecords}
              geopointField={geopointField.id}
              titleField={titleField?.id}
              descriptionField={descField?.id}
              height="350px"
              className="mb-4"
            />
          );
        })()}

      {/* Render by display type */}
      {filteredRecords.length > 0 && displayType === "data-table" && (
        <DataTableView records={filteredRecords} fields={fields} />
      )}
      {filteredRecords.length > 0 && displayType === "list" && (
        <ListView records={filteredRecords} fields={fields} />
      )}
      {filteredRecords.length > 0 && displayType === "accordion" && (
        <AccordionView records={filteredRecords} fields={fields} />
      )}
      {filteredRecords.length > 0 && displayType === "grid" && (
        <GridView records={filteredRecords} fields={fields} />
      )}
    </div>
  );
}

// ─── Data Table ───────────────────────────────────────────────────────────────

function DataTableView({
  records,
  fields,
}: {
  records: Record<string, any>[];
  fields: EnhancedCollectionField[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>
            {fields.map((field) => (
              <th key={field.id} className="px-4 py-3 font-medium">
                {field.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {records.map((record, i) => (
            <tr key={record.id || i} className="hover:bg-gray-50">
              {fields.map((field) => (
                <td key={field.id} className="px-4 py-3">
                  <CellValue value={record[field.id]} type={field.type} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({
  records,
  fields,
}: {
  records: Record<string, any>[];
  fields: EnhancedCollectionField[];
}) {
  // Use first text field as title, rest as details
  const titleField = fields.find((f) => f.type === "text") || fields[0];
  const detailFields = fields.filter((f) => f.id !== titleField?.id);

  return (
    <div className="space-y-3">
      {records.map((record, i) => (
        <div
          key={record.id || i}
          className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
        >
          {titleField && (
            <h4 className="font-medium text-gray-900">
              {String(record[titleField.id] || "")}
            </h4>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {detailFields.map((field) => {
              const val = record[field.id];
              if (!val && val !== 0) return null;
              return (
                <span key={field.id}>
                  <span className="text-gray-400">{field.name}:</span>{" "}
                  <CellValue value={val} type={field.type} />
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Accordion View ───────────────────────────────────────────────────────────

function AccordionView({
  records,
  fields,
}: {
  records: Record<string, any>[];
  fields: EnhancedCollectionField[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const titleField = fields.find((f) => f.type === "text") || fields[0];
  const detailFields = fields.filter((f) => f.id !== titleField?.id);

  return (
    <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
      {records.map((record, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={record.id || i}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">
                {String(record[titleField?.id || ""] || `Record ${i + 1}`)}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-1 bg-gray-50">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {detailFields.map((field) => {
                    const val = record[field.id];
                    if (!val && val !== 0) return null;
                    return (
                      <div key={field.id}>
                        <dt className="text-gray-500">{field.name}</dt>
                        <dd className="text-gray-900 font-medium">
                          <CellValue value={val} type={field.type} />
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Grid View ────────────────────────────────────────────────────────────────

function GridView({
  records,
  fields,
}: {
  records: Record<string, any>[];
  fields: EnhancedCollectionField[];
}) {
  const titleField = fields.find((f) => f.type === "text") || fields[0];
  const imageField = fields.find(
    (f) => f.type === "image" || f.type === "media",
  );
  const detailFields = fields.filter(
    (f) => f.id !== titleField?.id && f.id !== imageField?.id,
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {records.map((record, i) => (
        <div
          key={record.id || i}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          {imageField && record[imageField.id] && (
            <img
              src={record[imageField.id]}
              alt={String(record[titleField?.id || ""] || "")}
              className="w-full h-40 object-cover"
              loading="lazy"
            />
          )}
          <div className="p-4">
            {titleField && (
              <h4 className="font-semibold text-gray-900 mb-2">
                {String(record[titleField.id] || "")}
              </h4>
            )}
            <div className="space-y-1 text-sm text-gray-600">
              {detailFields.slice(0, 3).map((field) => {
                const val = record[field.id];
                if (!val && val !== 0) return null;
                return (
                  <p key={field.id}>
                    <span className="text-gray-400">{field.name}:</span>{" "}
                    <CellValue value={val} type={field.type} />
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Cell Value Renderer ──────────────────────────────────────────────────────

function CellValue({ value, type }: { value: any; type: string }) {
  if (value === null || value === undefined)
    return <span className="text-gray-300">—</span>;

  if (type === "boolean") {
    return <span>{value ? "✓" : "—"}</span>;
  }

  if (type === "image" || type === "media") {
    if (typeof value === "string" && value.startsWith("http")) {
      return (
        <img
          src={value}
          alt=""
          className="w-8 h-8 rounded object-cover inline-block"
          loading="lazy"
        />
      );
    }
  }

  if (type === "url" && typeof value === "string") {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {value.replace(/^https?:\/\//, "").slice(0, 30)}
      </a>
    );
  }

  if (Array.isArray(value)) {
    return <span>{value.join(", ")}</span>;
  }

  return <span>{String(value)}</span>;
}
