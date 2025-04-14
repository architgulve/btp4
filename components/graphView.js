import React from "react";
import ReactForceGraph2D from "react-force-graph-2d";

export default function GraphView() {
  return (
    <div className="overflow-hidden">
      <ReactForceGraph2D
        graphData={{
          nodes: [
            { id: "a", label: "A" },
            { id: "b", label: "B" },
            { id: "c", label: "C" },
            { id: "d", label: "D" },
            { id: "e", label: "E" },
            { id: "f", label: "F" },
            { id: "g", label: "G" },
            { id: "h", label: "H" },
          ],
          links: [
            { source: "a", target: "b" },
            { source: "a", target: "c" },
            { source: "g", target: "d" },
            { source: "c", target: "e" },
            { source: "a", target: "f" },
            { source: "b", target: "g" },
            { source: "a", target: "h" },
            { source: "g", target: "h" },
          ],
        }}
        linkVisibility={true}
        linkColor={() => "#ffffff3d"}
        nodeColor={() => "#ffffff"}
        nodeRelSize={2}
        // linkCurvature={}
      />
    </div>
  );
}
