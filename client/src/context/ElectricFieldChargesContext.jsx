import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

/** @typedef {{ id: string; x: number; y: number; qMicroC: number; color: string }} PointCharge */

export const DEFAULT_EF_CHARGES = /** @type {PointCharge[]} */ ([
  { id: "ef-1", x: -1.4, y: 0, qMicroC: 1, color: "#EF4444" },
  { id: "ef-2", x: 1.4, y: 0, qMicroC: -1, color: "#2563EB" },
]);

const ElectricFieldChargesContext = createContext(null);

/** @typedef {'select' | 'pan' | 'move' | 'addPlus' | 'addMinus' | 'delete'} EfTool */

/**
 * @param {{ children: import('react').ReactNode; initialCharges?: PointCharge[] }} props
 */
export function ElectricFieldChargesProvider({ children, initialCharges }) {
  const [charges, setCharges] = useState(() => initialCharges ?? DEFAULT_EF_CHARGES);
  const [selectedId, setSelectedId] = useState(/** @type {string | null} */ (null));
  const [tool, setTool] = useState(/** @type {EfTool} */ ("select"));
  /** Center of the viewport in world coordinates (meters). */
  const [viewCenter, setViewCenter] = useState({ x: 0, y: 0 });
  const idRef = useRef(2);

  const updateCharge = useCallback((id, patch) => {
    setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const moveCharge = useCallback((id, x, y) => {
    setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));
  }, []);

  const addCharge = useCallback((partial) => {
    idRef.current += 1;
    const id = `ef-${idRef.current}`;
    const next = {
      id,
      x: partial.x,
      y: partial.y,
      qMicroC: partial.qMicroC,
      color: partial.color ?? (partial.qMicroC > 0 ? "#EF4444" : "#2563EB"),
    };
    setCharges((prev) => [...prev, next]);
    setSelectedId(id);
    return id;
  }, []);

  const deleteCharge = useCallback((id) => {
    setCharges((prev) => prev.filter((c) => c.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  const resetCharges = useCallback(() => {
    setCharges(initialCharges ?? DEFAULT_EF_CHARGES);
    setSelectedId(null);
    setViewCenter({ x: 0, y: 0 });
  }, [initialCharges]);

  const value = useMemo(
    () => ({
      charges,
      setCharges,
      selectedId,
      setSelectedId,
      selected: charges.find((c) => c.id === selectedId) ?? null,
      tool,
      setTool,
      viewCenter,
      setViewCenter,
      updateCharge,
      moveCharge,
      addCharge,
      deleteCharge,
      resetCharges,
    }),
    [
      charges,
      selectedId,
      tool,
      viewCenter,
      updateCharge,
      moveCharge,
      addCharge,
      deleteCharge,
      resetCharges,
    ],
  );

  return (
    <ElectricFieldChargesContext.Provider value={value}>
      {children}
    </ElectricFieldChargesContext.Provider>
  );
}

export function useElectricFieldCharges() {
  const ctx = useContext(ElectricFieldChargesContext);
  if (!ctx) {
    throw new Error("useElectricFieldCharges must be used within ElectricFieldChargesProvider");
  }
  return ctx;
}
