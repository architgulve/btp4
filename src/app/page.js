import { LucidePlus } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-transparent p-4 h-screen">
      <div className="bg-transparent w-full p-2 flex flex-col h-full rounded-lg items-center justify-center">
        <div className="h-full w-full justify-center items-center flex-col hover:bg-[#ffffff1f] rounded-lg flex space-y-5">
          <p className="text-2xl text-[#ffffff] ">Start by creating a new note</p>
          <div className="justify-center items-center flex flex-row space-x-2">
            <LucidePlus className="w-4 h-4" />
            <h1>New Note</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
