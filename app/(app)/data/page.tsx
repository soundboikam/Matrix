import DeleteUploadButton from "../imports/DeleteUploadButton.client";

export default async function DataPage() {
  // Remove server-side auth check - let client-side handle it
  return (
    <div>
      <h1 className="h1 mb-4">Data</h1>
      <p className="muted mb-4 text-sm">
        Manage CSV uploads and delete specific datasets (admin or uploader only).
      </p>

      <div className="rounded border border-neutral-800 bg-[#0b0b0b]">
        <div className="p-6 text-center text-sm text-neutral-400">
          Data will load here when authenticated
        </div>
      </div>
    </div>
  );
}


