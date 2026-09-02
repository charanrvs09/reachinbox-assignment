import {
    useRef,
    useState,
  } from "react";
  import Papa from "papaparse";
  
  interface LeadUploadProps {
    onEmailsParsed: (emails: string[]) => void;
  }
  
  function LeadUpload({
    onEmailsParsed,
  }: LeadUploadProps) {
    const fileInputRef =
      useRef<HTMLInputElement>(null);
  
    const [fileName, setFileName] =
      useState("");
  
    const [dragging, setDragging] =
      useState(false);
  
    const handleFile = (
      file: File
    ) => {
      setFileName(file.name);
  
      // Handle plain text files
      if (
        file.name
          .toLowerCase()
          .endsWith(".txt")
      ) {
        const reader =
          new FileReader();
  
        reader.onload = () => {
          const text = String(
            reader.result || ""
          );
  
          const emails = text
            .split(/[\n,;]+/)
            .map((email) =>
              email.trim()
            )
            .filter(
              (email) =>
                email.length > 0
            );
  
          onEmailsParsed(emails);
        };
  
        reader.readAsText(file);
  
        return;
      }
  
      // Handle CSV files
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
  
        complete: (results) => {
          const emails: string[] =
            [];
  
          results.data.forEach(
            (row: any) => {
              const email =
                row.email ||
                row.Email ||
                row.EMAIL;
  
              if (
                typeof email ===
                  "string" &&
                email.trim() !== ""
              ) {
                emails.push(
                  email.trim()
                );
              }
            }
          );
  
          onEmailsParsed(emails);
        },
      });
    };
  
    const handleFileChange = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];
  
      if (!file) {
        return;
      }
  
      handleFile(file);
    };
  
    const handleDrop = (
      event: React.DragEvent<HTMLDivElement>
    ) => {
      event.preventDefault();
      setDragging(false);
  
      const file =
        event.dataTransfer.files?.[0];
  
      if (!file) {
        return;
      }
  
      handleFile(file);
    };
  
    return (
      <div>
        <div className="mb-3">
          <label className="block text-sm font-semibold text-gray-900">
            Lead File
          </label>
  
          <p className="mt-1 text-xs text-gray-500">
            Upload your recipient list in CSV or TXT format.
          </p>
        </div>
  
        {/* Hidden native input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
  
        {/* Upload area */}
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() =>
            setDragging(false)
          }
          onDrop={handleDrop}
          onClick={() =>
            fileInputRef.current?.click()
          }
          className={`group cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition ${
            dragging
              ? "border-gray-900 bg-gray-50"
              : "border-gray-200 bg-gray-50/50 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg shadow-sm ring-1 ring-gray-200 transition group-hover:shadow">
            ↑
          </div>
  
          {fileName ? (
            <>
              <p className="mt-3 text-sm font-semibold text-gray-900">
                {fileName}
              </p>
  
              <p className="mt-1 text-xs text-green-600">
                File selected successfully
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm font-semibold text-gray-900">
                Click to upload
                <span className="font-normal text-gray-500">
                  {" "}
                  or drag and drop
                </span>
              </p>
  
              <p className="mt-1 text-xs text-gray-400">
                CSV or TXT · Email addresses only
              </p>
            </>
          )}
  
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
          >
            {fileName
              ? "Choose another file"
              : "Choose file"}
          </button>
        </div>
      </div>
    );
  }
  
  export default LeadUpload;