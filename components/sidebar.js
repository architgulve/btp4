"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LucideSearch } from "lucide-react";

export default function Sidebar() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data) => setNotes(data.nodes));
  }, []);

  return (
    <div className="h-full justify-between flex flex-col w-1/4">
      <div className="space-y-1">
        <div>
          <div className="bg-[#ffffff16] border-2 border-transparent p-2 items-center justify-center hover:border-[#ffffff1f] border-inset rounded-lg flex flex-row space-x-2">
            <LucideSearch className="w-4 h-4" />
            <p>Search</p>
          </div>
        </div>
        {notes.map((note) => (
          <Link href={`/notes/${note.id}`} key={note.id}>
          <div className="bg-transparent p-2 hover:bg-[#ffffff1f] rounded-lg">
            <p className="text-sm">{note.title || note.label || note.id}</p>
          </div>
        </Link>
        ))}
        <Link href="/">
          <div className="bg-transparent p-2 hover:bg-[#ffffff1f] rounded-lg">
            <p className="text-sm text-[#ffffff68] ">+ New Note</p>
          </div>
        </Link>
      </div>
      <div className="">
        <Link href="/mindmap">
          <div className="bg-[#ffffff16] border-2 border-transparent p-2 hover:border-[#ffffff1f] rounded-lg justify-center flex">
            <p className="text-sm">Mind Map</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
