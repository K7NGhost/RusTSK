import { useState } from "react";

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

const ContentViewer = () => {
  const [selectedTab, setSelectedTab] = useState(2);

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

      <div className="grid flex-1 place-items-center p-4">
        <div className="grid h-40 w-60 place-items-center rounded-lg border border-base-300 bg-base-200/40 px-4 text-center text-sm text-base-content/60">
          Image Preview
        </div>
      </div>
    </section>
  );
};

export default ContentViewer;
