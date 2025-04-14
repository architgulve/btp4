import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="">
        <div className="p-3 bg-linear-60 from-[#200070] via-[#570071] to-[#730000] h-screen w-screen items-center justify-center">
          <div className="h-full justify-between flex flex-col w-1/4">
            <div className="space-y-1">
              <div>
                <div className="bg-transparent p-2 items-center justify-center hover:bg-[#ffffff1f] rounded-lg">
                  <p>Search</p>
                </div>
              </div>
              <div className="bg-transparent p-2 hover:bg-[#ffffff1f] rounded-lg">
                <p className="text-sm">Home</p>
              </div>
              <div className="bg-transparent p-2 hover:bg-[#ffffff1f] rounded-lg">
                <p className="text-sm">Home</p>
              </div>
              <div className="bg-transparent p-2 hover:bg-[#ffffff1f] rounded-lg">
                <p className="text-sm">Home</p>
              </div>
              <div className="bg-transparent p-2 hover:bg-[#ffffff1f] rounded-lg">
                <p className="text-sm text-[#ffffff68] ">+ New Note</p>
              </div>
            </div>
            <div className="">
              <div className="bg-transparent p-2 hover:bg-[#ffffff1f] rounded-lg">
                <p className="text-sm">Mind Map</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-3/4 h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
