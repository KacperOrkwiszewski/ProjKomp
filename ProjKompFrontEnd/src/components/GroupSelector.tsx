import React, { useState, useEffect, useMemo } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { scheduleApiUrl } from "../config/scheduleApi";

export type GroupInfo = {
  id: string;
  name: string;
};

type GroupSelectorProps = {
  visible: boolean;
  onHide: () => void;
  onGroupsSelected: (groups: GroupInfo[]) => void;
  selectedGroupIds?: string[];
};

const GroupSelector: React.FC<GroupSelectorProps> = ({
  visible,
  onHide,
  onGroupsSelected,
  selectedGroupIds = [],
}) => {
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(selectedGroupIds));
  const [searchQuery, setSearchQuery] = useState("");
  const toastRef = React.useRef<Toast>(null);

  // Ładuj grupy z API gdy modal się otwiera
  useEffect(() => {
    if (!visible) {
      return;
    }

    const loadGroups = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(scheduleApiUrl('/semester/faculties'));
        if (!response.ok) {
          throw new Error(`Nie udało się pobrać listy grup (HTTP ${response.status})`);
        }

        const data = await response.json();
        const weeiaGroups = data?.WEEIA;

        if (!weeiaGroups || typeof weeiaGroups !== "object") {
          throw new Error("Brak danych o grupach");
        }

        const groupsList: GroupInfo[] = Object.entries(weeiaGroups).map(([id, groupData]: [string, any]) => ({
          id,
          name: typeof groupData?.name === "string" ? groupData.name : `Grupa ${id}`,
        }));

        setGroups(groupsList.sort((a, b) => a.name.localeCompare(b.name)));
        setIsLoading(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nie udało się pobrać listy grup";
        console.error(message);
        setGroups([]);
        setIsLoading(false);

        toastRef.current?.show({
          severity: "error",
          summary: "Błąd",
          detail: message,
          life: 3000,
        });
      }
    };

    loadGroups();
  }, [visible]);

  // Synchronizuj selectedIds z props
  useEffect(() => {
    setSelectedIds(new Set(selectedGroupIds));
    if (visible) {
      setSearchQuery("");
    }
  }, [selectedGroupIds, visible]);

  const filteredGroups = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return groups;
    }

    return groups.filter((group) => (
      group.name.toLowerCase().includes(normalizedQuery) ||
      group.id.toLowerCase().includes(normalizedQuery)
    ));
  }, [groups, searchQuery]);

  const handleGroupToggle = (groupId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirm = () => {
    if (selectedIds.size === 0) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Ostrzeżenie",
        detail: "Wybierz co najmniej jedną grupę",
        life: 2000,
      });
      return;
    }

    const selectedGroups = groups.filter((group) => selectedIds.has(group.id));

    onGroupsSelected(selectedGroups);
    onHide();
  };

  return (
    <>
      <Toast ref={toastRef} />
      <Dialog
        visible={visible}
        onHide={onHide}
        header="Wybierz grupy do dodania"
        modal
        style={{ width: "30rem", maxWidth: "40rem" }}
        className="group-selector-dialog"
        maskClassName="group-selector-dialog-mask"
      >
        {isLoading ? (
          <div className="flex justify-content-center p-5">
            <ProgressSpinner style={{ width: "50px", height: "50px" }} strokeWidth="4" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center p-4">
            <p>Brak dostępnych grup</p>
          </div>
        ) : (
          <>
            <div className="group-search">
              <i className="pi pi-search" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Szukaj grupy"
                aria-label="Szukaj grupy"
                className="group-search-input"
              />
            </div>

            {filteredGroups.length === 0 ? (
              <div className="group-list-empty">
                <p>Brak grup pasujacych do wyszukiwania</p>
              </div>
            ) : (
              <div className="group-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    className="group-item p-3 border-bottom flex align-items-center gap-3"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleGroupToggle(group.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(group.id)}
                      onChange={() => handleGroupToggle(group.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="group-list-checkbox"
                    />
                    <span className="flex-grow-1">{group.name}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="group-list-buttons">
          <Button
            icon="pi pi-times"
            label="Anuluj"
            severity="secondary"
            className="group-list-cancel"
            onClick={onHide}
            disabled={isLoading}
          />
          <Button
            icon="pi pi-check"
            label="Potwierdź"
            onClick={handleConfirm}
            className="group-list-confirm"
            disabled={isLoading || groups.length === 0}
          />
        </div>
      </Dialog>
    </>
  );
};

export default GroupSelector;
