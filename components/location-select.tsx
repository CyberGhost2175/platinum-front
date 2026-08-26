"use client";

import { LOCATION_TYPE_LABEL } from "@/lib/labels";
import type { Location } from "@/lib/types";

export function LocationSelect({
  name = "locationId",
  value,
  defaultValue,
  locations,
  className,
  allowEmpty = true,
  emptyLabel = "Без точки",
  onChange,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  locations: Location[];
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  onChange?: (id: string) => void;
}) {
  return (
    <select
      name={name}
      value={value}
      defaultValue={value === undefined ? defaultValue ?? "" : undefined}
      onChange={(event) => onChange?.(event.target.value)}
      className={className}
    >
      {allowEmpty ? <option value="">{emptyLabel}</option> : null}
      {locations.map((location) => (
        <option key={location.id} value={location.id}>
          {location.name} · {LOCATION_TYPE_LABEL[location.type]}
        </option>
      ))}
    </select>
  );
}
