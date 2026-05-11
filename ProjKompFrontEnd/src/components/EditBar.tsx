import React, { useEffect, useRef, useState } from "react";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { ColorPicker } from "primereact/colorpicker";
import { Button } from "primereact/button";
import { Slider } from "primereact/slider";
import { InputTextarea } from "primereact/inputtextarea";
import { BlockData } from "../utils/ClassBlockUtils";
import { cloneBlockData, hasDraftChanges } from "../utils/EditBarUtils";

const NUMBERED_TERMS = Array.from({ length: 15 }, (_, index) => index + 1);

function findClosestSelectedTerm(selectedTerms: number[], targetTerm: number) {
  let closest = selectedTerms[0];
  let closestDistance = Math.abs(targetTerm - closest);

  for (let index = 1; index < selectedTerms.length; index++) {
    const candidate = selectedTerms[index];
    const distance = Math.abs(targetTerm - candidate);

    if (distance < closestDistance || (distance === closestDistance && candidate < closest)) {
      closest = candidate;
      closestDistance = distance;
    }
  }

  return closest;
}

function buildRange(fromTerm: number, toTerm: number) {
  const start = Math.min(fromTerm, toTerm);
  const end = Math.max(fromTerm, toTerm);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export type EditBarData = {
  blockData?: BlockData | null;
  onSave: (updated: BlockData, options?: { silent?: boolean }) => void;
  onHide: () => void;
  onRestoreFromDisk: (blockId: number) => void;
};


const EditBar: React.FC<EditBarData> = ({ blockData, onSave, onHide, onRestoreFromDisk }) => {
  const [draft, setDraft] = useState<BlockData | null>(cloneBlockData(blockData));
  const onSaveRef = useRef(onSave);
  const defaultClassColor = typeof window === "undefined"
    ? "#5f9fd1"
    : getComputedStyle(document.documentElement).getPropertyValue("--class-color-default").trim() || "#5f9fd1";
  const previousIdRef = useRef<number | null>(blockData?.id ?? null);
  const previousBlockRef = useRef<BlockData | null>(cloneBlockData(blockData));
  const draftRef = useRef<BlockData | null>(cloneBlockData(blockData));

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    const previousId = previousIdRef.current;
    const nextId = blockData?.id ?? null;
    const previousBlock = previousBlockRef.current;
    const currentDraft = draftRef.current;

    if (previousId !== nextId && previousBlock && currentDraft && hasDraftChanges(previousBlock, currentDraft)) {
      onSaveRef.current(currentDraft, { silent: true });
    }

    const cloned = cloneBlockData(blockData);
    setDraft(cloned);
    draftRef.current = cloned;
    previousIdRef.current = nextId;
    previousBlockRef.current = cloned;
  }, [blockData]);

  const disabled = !draft;

  const handleFieldChange = <K extends keyof BlockData>(key: K, value: BlockData[K]) => {
    if (!draft) {
      return;
    }

    const nextDraft = {
      ...draft,
      [key]: value,
    };

    setDraft(nextDraft);
    draftRef.current = nextDraft;
    onSave(nextDraft, { silent: true });
  };

  const handleReplayDraft = () => {
    if (!draft) {
      return;
    }

    onRestoreFromDisk(draft.id);
  };

  const handleToggleNumberedTerm = (term: number) => {
    if (disabled || !draft) {
      return;
    }

    const isSelected = draft.terms.includes(term);
    if (isSelected) {
      const nextTerms = draft.terms.filter((value) => value !== term);
      handleFieldChange("terms", nextTerms);
      return;
    }

    if (draft.terms.length === 0) {
      handleFieldChange("terms", [term]);
      return;
    }

    const closestSelectedTerm = findClosestSelectedTerm(draft.terms, term);
    const rangeToAdd = buildRange(closestSelectedTerm, term);
    const nextTerms = [...new Set([...draft.terms, ...rangeToAdd])].sort((left, right) => left - right);

    handleFieldChange("terms", nextTerms);
  };

  const handleToggleAllNumberedTerms = () => {
    if (disabled || !draft) {
      return;
    }

    const hasAllTerms = NUMBERED_TERMS.every((term) => draft.terms.includes(term));
    handleFieldChange("terms", hasAllTerms ? [] : [...NUMBERED_TERMS]);
  };

  const handleTermModeChange = (mode: "x1" | "x2") => {
    if (disabled || !draft || draft.termMode === mode) {
      return;
    }

    handleFieldChange("termMode", mode);
  };

  const hasAllNumberedTermsSelected = draft
    ? NUMBERED_TERMS.every((term) => draft.terms.includes(term))
    : false;

  const currentInfo = draft
    ? [
        draft.extraInfo ? `${draft.extraInfo}` : null,
      ].filter(Boolean).join("\n")
    : "";

  return (
    <div className="tt-edit-panel">
      <div className="editbar-top-row">
        <Button
          icon="pi pi-refresh"
          rounded
          outlined
          className="tt-icon-btn tt-refresh-btn"
          onClick={handleReplayDraft}
          disabled={!draft}
          aria-label="Przywroc dane z dysku"
        />
      </div>
      <div className="editbar-form">
        <div className="editbar-field">
          <label htmlFor="block-name">Nazwa przedmiotu</label>
          <InputText
            id="block-name"
            value={draft?.text ?? ""}
            disabled={disabled}
            onChange={(e) => handleFieldChange("text", e.target.value)}
          />
        </div>

        <div className="editbar-field">
          <label htmlFor="block-extra">informacje dodatkowe</label>
          <InputTextarea
            id="block-extra"
            value={currentInfo}
            disabled
            rows={1}
          />
        </div>

        <div className="editbar-field">
          <label htmlFor="block-hours">dlugosc: {draft?.hourSpan ?? "-"}</label>
          <InputNumber
            id="block-hours"
            value={draft?.hourSpan ?? 1}
            disabled={disabled}
            onValueChange={(e) => handleFieldChange("hourSpan", Math.max(1, e.value ?? 1))}
            min={1}
            max={12}
          />
          <Slider
            value={draft?.hourSpan ?? 1}
            min={1}
            max={12}
            disabled={disabled}
            onChange={(e) => handleFieldChange("hourSpan", Math.max(1, Number(e.value) || 1))}
          />
        </div>

        <div className="editbar-field">
          <label>terminy</label>
          <div className="tt-term-grid">
            {NUMBERED_TERMS.map((term) => (
              <button
                key={term}
                type="button"
                className={`tt-term-cell ${draft?.terms.includes(term) ? "is-selected" : ""}`.trim()}
                disabled={disabled}
                aria-pressed={draft?.terms.includes(term) ?? false}
                onClick={() => handleToggleNumberedTerm(term)}
              >
                {term}
              </button>
            ))}
            <button
              type="button"
              className={`tt-term-cell tt-term-cell--all ${hasAllNumberedTermsSelected ? "is-selected" : ""}`.trim()}
              disabled={disabled}
              aria-pressed={hasAllNumberedTermsSelected}
              onClick={handleToggleAllNumberedTerms}
            >
              *
            </button>
            <button
              type="button"
              className={`tt-term-cell tt-term-cell--mode ${draft?.termMode === "x1" ? "is-selected" : ""}`.trim()}
              disabled={disabled}
              aria-pressed={draft?.termMode === "x1"}
              onClick={() => handleTermModeChange("x1")}
            >
              x1
            </button>
            <button
              type="button"
              className={`tt-term-cell tt-term-cell--mode ${draft?.termMode === "x2" ? "is-selected" : ""}`.trim()}
              disabled={disabled}
              aria-pressed={draft?.termMode === "x2"}
              onClick={() => handleTermModeChange("x2")}
            >
              x2
            </button>
          </div>
        </div>

        <div className="editbar-field">
          <label htmlFor="block-note">notatka</label>
          <InputTextarea
            id="block-note"
            rows={2}
            value={draft?.note ?? ""}
            disabled={disabled}
            onChange={(e) => handleFieldChange("note", e.target.value)}
          />
        </div>

        <div className="editbar-field tt-color-row">
          <label htmlFor="block-color">kolor</label>
          <div className="tt-color-controls">
            <ColorPicker
              id="block-color"
              format="hex"
              value={(draft?.color ?? defaultClassColor).replace("#", "")}
              disabled={disabled}
              onChange={(e) => handleFieldChange("color", `#${String(e.value)}`)}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default EditBar;