import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../../../lib/auth";
import DeleteUploadButton from "../imports/DeleteUploadButton.client";

const prisma = new PrismaClient();

export default async function DataPage() {
  const session = await requireAuth();
  const userId = (session as any).user?.id as string;

  const membership = await prisma.membership.findFirst({ where: { userId } });
  const workspaceId = membership?.workspaceId ?? "";

  const uploads = await prisma.upload.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      _count: { select: { streams: true } },
    },
  });

  return (
    <div>
      <h1 className="h1 mb-4">Data</h1>
      <p className="muted mb-4 text-sm">
        Manage CSV uploads and delete specific datasets (admin or uploader only).
      </p>

      <div className="rounded border border-neutral-800 bg-[#0b0b0b]">
        <table className="w-full">
          <thead>
            <tr>
              <th>Uploaded</th>
              <th>By</th>
              <th className="text-right">Rows in file</th>
              <th className="text-right">Stream rows stored</th>
              <th className="w-28"></th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((u) => (
              <tr key={u.id}>
                <td>{u.createdAt.toISOString().slice(0, 19).replace("T", " ")}</td>
                <td>{u.uploadedBy?.name || u.uploadedBy?.email || "User"}</td>
                <td className="text-right">{u.rowCount.toLocaleString()}</td>
                <td className="text-right">{u._count.streams.toLocaleString()}</td>
                <td className="text-right">
                  <DeleteUploadButton uploadId={u.id} />
                </td>
              </tr>
            ))}
            {uploads.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-neutral-400">
                  No imports yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


