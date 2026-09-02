"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Icon } from "@/components/icon";

export type SearchSelectOption = {
  value: string;
  label: string;
  hint?: string | null;
};

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Выберите…",
  searchPlaceholder = "Поиск…",
  emptyText = "Ничего не найдено",
  noneText = "Список пуст",
  disabled,
  invalid,
  id,
}: {
  options: SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  noneText?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
}) {
  const generatedId = useId();
  const listId = `${id ?? generatedId}-list`;
  const searchId = `${id ?? generatedId}-search`;
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = options.find((option) => option.value === value) ?? null;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => {
      const haystack = `${option.label} ${option.hint ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = options.findIndex((option) => option.value === value);
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
    // Highlight and focus only when the list opens, not on every filter keystroke.
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(option: SearchSelectOption) {
    onChange(option.value);
    setOpen(false);
    setQuery("");
  }

  function onTriggerKey(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled || options.length === 0) return;
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function onSearchKey(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[active];
      if (option) pick(option);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(Math.max(filtered.length - 1, 0));
    }
  }

  const empty = options.length === 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled || empty}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (empty) return;
          setOpen((current) => !current);
        }}
        onKeyDown={onTriggerKey}
        className={[
          "flex w-full items-center gap-3 rounded border bg-surface-lowest px-3 py-2.5 text-left transition-colors",
          invalid ? "border-error" : open ? "border-gold" : "border-border hover:border-gold/60",
          disabled || empty ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        <Icon name="local_shipping" size={18} className={selected ? "text-gold" : "text-secondary"} />
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block truncate text-body text-on-surface">{selected.label}</span>
              {selected.hint ? (
                <span className="block truncate text-[11px] text-secondary">{selected.hint}</span>
              ) : null}
            </>
          ) : (
            <span className="text-body text-secondary">{empty ? noneText : placeholder}</span>
          )}
        </span>
        <Icon
          name="expand_more"
          size={20}
          className={`text-secondary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-[0_16px_40px_rgba(28,27,24,0.16)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Icon name="search" size={18} className="text-gold" />
            <input
              ref={searchRef}
              id={searchId}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onSearchKey}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent py-1 text-body text-on-surface outline-none placeholder:text-secondary"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls={listId}
              aria-activedescendant={filtered[active] ? `${listId}-${filtered[active].value}` : undefined}
            />
            {query ? (
              <button
                type="button"
                className="text-secondary hover:text-on-surface"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                aria-label="Очистить поиск"
              >
                <Icon name="close" size={16} />
              </button>
            ) : null}
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-label={placeholder}
            className="premium-scroll max-h-60 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-body text-secondary">{emptyText}</li>
            ) : (
              filtered.map((option, index) => {
                const isActive = index === active;
                const isSelected = option.value === value;
                return (
                  <li key={option.value} role="none">
                    <button
                      type="button"
                      id={`${listId}-${option.value}`}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => pick(option)}
                      className={[
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        isActive ? "bg-surface-low" : "",
                        isSelected ? "text-on-surface" : "text-on-surface",
                      ].join(" ")}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${
                          isSelected ? "bg-gold/20 text-gold" : "bg-surface-high text-secondary"
                        }`}
                      >
                        {initials(option.label)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body">
                          {highlight(option.label, query)}
                        </span>
                        {option.hint ? (
                          <span className="block truncate text-[11px] text-secondary">
                            {highlight(option.hint, query)}
                          </span>
                        ) : null}
                      </span>
                      {isSelected ? <Icon name="check" size={18} className="text-gold" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function initials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return letters.toUpperCase() || "•";
}

function highlight(text: string, query: string) {
  const needle = query.trim();
  if (!needle) return text;
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-gold/20 text-inherit">{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  );
}
