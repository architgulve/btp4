import "./globals.css";
import Link from "next/link";
import { LucideIcon, LucidePlus, LucideSearch } from "lucide-react";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="">
        <div className="p-3 bg-linear-60 from-[#200070] via-[#570071] to-[#730000] h-screen w-screen items-center justify-center">
          <div className="h-full justify-between flex flex-col w-1/4">
            <div className="space-y-1">
              <div>
                <div className="bg-[#ffffff16] border-2 border-transparent p-2 items-center justify-center hover:border-[#ffffff1f] border-inset rounded-lg flex flex-row space-x-2">
                  <LucideSearch className="w-4 h-4" />
                  <p>Search</p>
                </div>
              </div>
              <Link href="/notes">
                <div className="bg-transparent p-2 hover:bg-[#ffffff1f] rounded-lg">
                  <p className="text-sm">Home</p>
                </div>
              </Link>
              <div className="bg-transparent p-2 hover:bg-[#ffffff1f] rounded-lg">
                <p className="text-sm">Home</p>
              </div>
              <div className="bg-transparent p-2 hover:bg-[#ffffff1f] rounded-lg">
                <p className="text-sm">Home</p>
              </div>
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
        </div>
        <div className="absolute top-0 right-0 w-3/4 h-full">{children}</div>
      </body>
    </html>
  );
}
