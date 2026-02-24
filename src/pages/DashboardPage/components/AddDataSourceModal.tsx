import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Step1SelectHost from "./add-data-source-steps/Step1SelectHost";
import Step2SelectDataSourceType from "./add-data-source-steps/Step2SelectDataSourceType";
import Step3SelectDataSource from "./add-data-source-steps/Step3SelectDataSource";
import Step4ConfigureIngest from "./add-data-source-steps/Step4ConfigureIngest";
import Step5AddDataSource from "./add-data-source-steps/Step5AddDataSource";
import type { DataSourceType } from "./add-data-source-steps/Step2SelectDataSourceType";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const steps = [
  "Select host",
  "Select data source type",
  "Select data source",
  "Configure ingest",
  "Add data source",
];

const AddDataSourceModal = ({ isOpen, onClose }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dataSourceType, setDataSourceType] = useState<DataSourceType>(
    "disk-image-or-vm-file",
  );

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const canGoBack = currentStep > 0;
  const canGoNext = currentStep < steps.length - 1;

  const stepTitle = useMemo(() => steps[currentStep], [currentStep]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <dialog className="modal modal-open z-[9999]" open>
      <div className="modal-box max-w-5xl overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <h3 className="text-lg font-semibold">Add Data Source</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
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

        <div className="px-5 pb-5">
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

              {currentStep === 0 && <Step1SelectHost dataSourceName="Demo_HD.E01" />}
              {currentStep === 1 && (
                <Step2SelectDataSourceType
                  selectedType={dataSourceType}
                  onChange={setDataSourceType}
                />
              )}
              {currentStep === 2 && <Step3SelectDataSource dataSourceType={dataSourceType} />}
              {currentStep === 3 && <Step4ConfigureIngest />}
              {currentStep === 4 && <Step5AddDataSource />}
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
              <button className="btn btn-primary" onClick={onClose}>
                Add Data Source
              </button>
            )}
          </div>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>,
    document.body,
  );
};

export default AddDataSourceModal;
