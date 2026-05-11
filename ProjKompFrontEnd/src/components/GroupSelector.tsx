import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { apiGet } from "../utils/apiClient";

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
  const toastRef = React.useRef<Toast>(null);

  // Ładuj grupy z API gdy modal się otwiera
  useEffect(() => {
    if (!visible) {
      return;
    }

    const loadGroups = async () => {
      setIsLoading(true);
      try {
        const data = await apiGet<any>('/api/semester/faculties');
        const weeiaGroups = data?.WEEIA;

        if (!weeiaGroups || typeof weeiaGroups !== "object") {
          throw new Error("Brak danych o grupach");
        }

        // Konwertuj obiekty na tablicę z id i name
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
  }, [selectedGroupIds, visible]);

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
        style={{ width: "90vw", maxWidth: "500px" }}
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
          <div className="group-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
            {groups.map((group) => (
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
                />
                <span className="flex-grow-1">{group.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 justify-content-end mt-4">
          <Button
            label="Anuluj"
            severity="secondary"
            onClick={onHide}
            disabled={isLoading}
          />
          <Button
            label="Potwierdź"
            onClick={handleConfirm}
            disabled={isLoading || groups.length === 0}
          />
        </div>
      </Dialog>
    </>
  );
};

export default GroupSelector;
