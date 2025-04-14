"use client";

import dynamic from "next/dynamic";

const GraphView = dynamic(() => import("../../../components/graphView"), {
  ssr: false,
});

export default function MindMap() {
  return (
    <div className="bg-transparent p-4 h-screen">
      <div className="bg-[#0c0c0c] w-full p-2 flex flex-col h-full rounded-lg items-center overflow-hidden">
        <div className="p-2 justify-center items-center fixed ">
          <p className="text-sm text-[#ffffff68]">Mind Map</p>
        </div>
        <GraphView />
      </div>
    </div>
  );
}
