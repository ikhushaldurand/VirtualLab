import { createContext, useContext, useMemo, useRef, useState } from "react";

const BuoyancyExperimentContext = createContext(null);

export function BuoyancyExperimentProvider({ children }) {
  const [fluidDensity, setFluidDensity] = useState(1000);
  const fluidDensityRef = useRef(1000);
  fluidDensityRef.current = fluidDensity;

  const [selectedLabel, setSelectedLabel] = useState(/** @type {string | null} */ (null));
  const [tool, setTool] = useState(/** @type {string} */ ("pointer"));
  const [zoom, setZoom] = useState(1);
  const [pendingAdd, setPendingAdd] = useState(/** @type {null | "box" | "circle"} */ (null));

  const value = useMemo(
    () => ({
      fluidDensity,
      setFluidDensity,
      fluidDensityRef,
      selectedLabel,
      setSelectedLabel,
      tool,
      setTool,
      zoom,
      setZoom,
      pendingAdd,
      setPendingAdd,
    }),
    [fluidDensity, selectedLabel, tool, zoom, pendingAdd],
  );

  return (
    <BuoyancyExperimentContext.Provider value={value}>
      {children}
    </BuoyancyExperimentContext.Provider>
  );
}

export function useBuoyancyExperiment() {
  const ctx = useContext(BuoyancyExperimentContext);
  if (!ctx) throw new Error("useBuoyancyExperiment requires BuoyancyExperimentProvider");
  return ctx;
}
