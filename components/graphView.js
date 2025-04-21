"use client";

import React, { useEffect, useState } from "react";
import ReactForceGraph2D from "react-force-graph-2d";

export default function GraphView() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/notes")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch graph data");
        return res.json();
      })
      .then((data) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Graph fetch error:", err);
        setError("Could not load graph");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-white p-4">Loading mind map...</p>;
  if (error) return <p className="text-red-400 p-4">{error}</p>;

  return (
    <div className="overflow-hidden h-full">
      <ReactForceGraph2D
        graphData={graphData}
        linkVisibility={true}
        linkColor={() => "#ffffff3d"}
        nodeColor={() => "#ffffff"}
        nodeRelSize={2}
        nodeLabel="label"
      />
    </div>
  );
}
