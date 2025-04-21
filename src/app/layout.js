import "./globals.css";
import Link from "next/link";
import { LucideIcon, LucidePlus, LucideSearch } from "lucide-react";
import Sidebar from "../../components/sidebar";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="">
        {/* <div className="p-3 bg-linear-60 from-[#200070] via-[#570071] to-[#730000] h-screen w-screen items-center justify-center"> */}
          {/* <Sidebar/> */}
        {/* </div> */}
        <div className="absolute top-0 right-0 w-full h-full">{children}</div>
      </body>
    </html>
  );
}
