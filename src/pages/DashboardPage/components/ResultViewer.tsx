import { Camera, FileImage } from "lucide-react";

const rows = [
  [
    "100_6228.JPG",
    "2011-10-25 06:27:23",
    "KODAK Z650 ZOOM DIGITAL CAMERA",
    "EASTMAN KODAK COMP.",
  ],
  [
    "100_6184.JPG",
    "2011-10-25 05:09:12",
    "KODAK Z650 ZOOM DIGITAL CAMERA",
    "EASTMAN KODAK COMP.",
  ],
  [
    "100_6290.JPG",
    "2011-10-25 10:58:19",
    "KODAK Z650 ZOOM DIGITAL CAMERA",
    "EASTMAN KODAK COMP.",
  ],
  [
    "12-198241 LG VX8350 5.jpg",
    "2011-09-06 23:35:39",
    "Canon PowerShot SX110 IS",
    "Canon",
  ],
  [
    "12-198241 LG VX8350 1.jpg",
    "2011-09-06 23:30:15",
    "Canon PowerShot SX110 IS",
    "Canon",
  ],
  [
    "100_6342.JPG",
    "2011-10-27 12:15:00",
    "KODAK Z650 ZOOM DIGITAL CAMERA",
    "EASTMAN KODAK COMP.",
  ],
];

const ResultViewer = () => {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl bg-base-100 ring-1 ring-base-300 shadow-2xl">
      <div className="border-b border-base-300 bg-base-200/35 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Camera size={16} />
            <h2 className="text-sm font-semibold tracking-wide text-base-content/90">
              EXIF Metadata
            </h2>
          </div>
          <span className="rounded-full border border-base-300 bg-base-100 px-2 py-0.5 text-xs font-medium text-base-content/70">
            {rows.length} results
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-base-100/95 backdrop-blur">
            <tr className="border-b border-base-300 text-left text-xs font-semibold tracking-wider text-base-content/70">
              <th className="px-4 py-2">SOURCE FILE</th>
              <th className="px-4 py-2">DATE CREATED</th>
              <th className="px-4 py-2">DEVICE MODEL</th>
              <th className="px-4 py-2">DEVICE MAKE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row[0]}
                className="border-b border-base-300/70 transition hover:bg-base-200/40"
              >
                <td
                  className={`px-4 py-2 text-base-content ${idx % 2 === 0 ? "bg-base-100" : "bg-base-200/20"}`}
                >
                  <div className="flex items-center gap-2">
                    <FileImage size={14} />
                    {row[0]}
                  </div>
                </td>
                <td
                  className={`px-4 py-2 text-base-content/80 ${idx % 2 === 0 ? "bg-base-100" : "bg-base-200/20"}`}
                >
                  {row[1]}
                </td>
                <td
                  className={`px-4 py-2 text-base-content/80 ${idx % 2 === 0 ? "bg-base-100" : "bg-base-200/20"}`}
                >
                  {row[2]}
                </td>
                <td
                  className={`px-4 py-2 text-base-content/80 ${idx % 2 === 0 ? "bg-base-100" : "bg-base-200/20"}`}
                >
                  {row[3]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ResultViewer;
