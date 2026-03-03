import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDataSources } from "../../../hooks/useDataSources";
import Step1SelectHost from "./add-data-source-steps/Step1SelectHost";
import Step2SelectDataSourceType from "./add-data-source-steps/Step2SelectDataSourceType";
import Step3SelectDataSource from "./add-data-source-steps/Step3SelectDataSource";
import Step4ConfigureIngest from "./add-data-source-steps/Step4ConfigureIngest";
import Step5AddDataSource from "./add-data-source-steps/Step5AddDataSource";
import type { DataSourceType } from "./add-data-source-steps/Step2SelectDataSourceType";
import type { DataSourceConfig } from "./add-data-source-steps/Step3SelectDataSource";
import type { IngestConfig } from "./add-data-source-steps/Step4ConfigureIngest";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onDataSourceAdded?: (payload: AddedDataSourcePayload) => Promise<void> | void;
};

export type AddedDataSourcePayload = {
  hostName: string;
  dataSourceType: DataSourceType;
  dataSourceConfig?: DataSourceConfig;
  ingestConfig?: IngestConfig;
};

const steps = [
  "Select host",
  "Select data source type",
  "Select data source",
  "Configure ingest",
  "Add data source",
];

const AddDataSourceModal = ({ isOpen, onClose, onDataSourceAdded }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dataSourceType, setDataSourceType] = useState<DataSourceType>("disk-image-or-vm-file");
  const [selectedHostName, setSelectedHostName] = useState("");
  const [dataSourceConfig, setDataSourceConfig] = useState<DataSourceConfig | undefined>(undefined);
  const [ingestConfig, setIngestConfig] = useState<IngestConfig | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { dataSources, addDataSource, removeDataSource } = useDataSources();

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setSubmitError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const canGoBack = currentStep > 0;
  const canGoNext = currentStep < steps.length - 1;

  const stepTitle = useMemo(() => steps[currentStep], [currentStep]);
  const selectedDataSourceFiles = useMemo(
    () => dataSources.find((entry) => entry.name === selectedHostName)?.selectedFiles ?? [],
    [dataSources, selectedHostName],
  );

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <dialog className="modal modal-open z-[9999]" open>
      <div className="modal-box flex max-h-[90vh] max-w-5xl flex-col overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <h3 className="text-lg font-semibold">Add Data Source</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          <div className="py-4">
            <ul className="steps steps-vertical w-full lg:steps-horizontal">
              {steps.map((step, index) => (
                <li
                  key={step}
                  className={`step ${index <= currentStep ? "step-primary" : ""}`}
                >
                  <span className="text-xs lg:text-sm">{step}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex min-h-[280px] flex-col rounded-box border border-base-300 bg-base-100 p-4 lg:flex-row">
            <section className="w-full lg:w-72">
              <h4 className="mb-3 text-sm font-semibold text-base-content/80">
                Wizard Steps
              </h4>
              <ul className="menu gap-1 rounded-box bg-base-200/40 p-2">
                {steps.map((step, index) => (
                  <li key={step}>
                    <button
                      className={currentStep === index ? "active" : ""}
                      onClick={() => setCurrentStep(index)}
                    >
                      <span className="font-mono text-xs opacity-70">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>{step}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <div className="divider lg:divider-horizontal">STEP</div>

            <section className="flex-1">
              <h4 className="mb-3 text-base font-semibold">{stepTitle}</h4>

              {currentStep === 0 && (
                <Step1SelectHost
                  dataSources={dataSources}
                  onHostNameChange={setSelectedHostName}
                  onDeleteDataSource={removeDataSource}
                />
              )}
              {currentStep === 1 && (
                <Step2SelectDataSourceType
                  selectedType={dataSourceType}
                  onChange={setDataSourceType}
                  hostName={selectedHostName || undefined}
                />
              )}
              {currentStep === 2 && (
                <Step3SelectDataSource
                  dataSourceType={dataSourceType}
                  hostName={selectedHostName || undefined}
                  initialPaths={selectedDataSourceFiles}
                  onConfigChange={setDataSourceConfig}
                />
              )}
              {currentStep === 3 && (
                <Step4ConfigureIngest
                  hostName={selectedHostName || undefined}
                  dataSourceType={dataSourceType}
                  dataSourceConfig={dataSourceConfig}
                  onConfigChange={setIngestConfig}
                />
              )}
              {currentStep === 4 && (
                <Step5AddDataSource
                  hostName={selectedHostName || undefined}
                  dataSourceType={dataSourceType}
                  dataSourceConfig={dataSourceConfig}
                  ingestConfig={ingestConfig}
                />
              )}
            </section>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-base-300 bg-base-200/40 px-5 py-4">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              className="btn btn-outline"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={!canGoBack}
            >
              Back
            </button>

            {canGoNext ? (
              <button
                className="btn btn-primary"
                onClick={() => setCurrentStep((prev) => prev + 1)}
              >
                Next
              </button>
            ) : (
              <button
                className="btn btn-primary"
                disabled={isSubmitting}
                onClick={async () => {
                  if (!selectedHostName) {
                    setSubmitError("Please provide a data source name in Step 1.");
                    return;
                  }
                  setSubmitError("");
                  setIsSubmitting(true);
                  try {
                    addDataSource(selectedHostName, dataSourceConfig?.paths ?? []);
                    await onDataSourceAdded?.({
                      hostName: selectedHostName,
                      dataSourceType,
                      dataSourceConfig,
                      ingestConfig,
                    });
                    onClose();
                  } catch (error) {
                    const message =
                      error instanceof Error ? error.message : "Failed to add data source.";
                    setSubmitError(message);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                {isSubmitting ? "Adding..." : "Add Data Source"}
              </button>
            )}
          </div>
        </div>
        {submitError && (
          <div className="px-5 pb-3">
            <p className="text-sm text-error">{submitError}</p>
          </div>
        )}
      </div>

      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>,
    document.body,
  );
};

export default AddDataSourceModal;
