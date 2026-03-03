import { useState, useCallback, useMemo } from "react";
import HexEditor from "react-hex-editor";
import oneDarkPro from "react-hex-editor/themes/oneDarkPro";

const tabs = [
  "Hex",
  "Strings",
  "Application",
  "Indexed Text",
  "Message",
  "File Metadata",
  "Results",
  "Other Occurrences",
];

// Sample data: a mix of ASCII text bytes and binary values for testing
const SAMPLE_DATA = new Uint8Array([
  // "RusTSK Sample File\0" as ASCII
  0x52, 0x75, 0x73, 0x54, 0x53, 0x4b, 0x20, 0x53, 0x61, 0x6d, 0x70, 0x6c,
  0x65, 0x20, 0x46, 0x69, 0x6c, 0x65, 0x00, 0x00,
  // PNG magic bytes
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  // Some binary data
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x10,
  0x00, 0x00, 0x00, 0x10, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x91, 0x68,
  // Fill rest with incrementing bytes
  ...Array.from({ length: 100 }, (_, i) => i % 256),
]);

const HexTab = () => {
  const data = useMemo(() => SAMPLE_DATA, []);
  const [nonce, setNonce] = useState(0);

  const handleSetValue = useCallback(
    (offset: number, value: number) => {
      data[offset] = value;
      setNonce((v) => v + 1);
    },
    [data],
  );

  return (
    <div className="h-full w-full overflow-auto">
      <HexEditor
        columns={0x10}
        data={data}
        nonce={nonce}
        onSetValue={handleSetValue}
        theme={{ hexEditor: oneDarkPro }}
        showAscii
        showRowLabels
      />
    </div>
  );
};

const ContentViewer = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl bg-base-100 ring-1 ring-base-300 shadow-2xl">
      <div className="border-b border-base-300 px-2 pt-2">
        <div className="tabs tabs-sm tabs-box overflow-x-auto">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              className={`tab whitespace-nowrap ${selectedTab === index ? "tab-active" : ""}`}
              onClick={() => setSelectedTab(index)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-2">
        {selectedTab === 0 ? (
          <HexTab />
        ) : (
          <div className="grid h-full place-items-center">
            <div className="grid h-40 w-60 place-items-center rounded-lg border border-base-300 bg-base-200/40 px-4 text-center text-sm text-base-content/60">
              {tabs[selectedTab]}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ContentViewer;
