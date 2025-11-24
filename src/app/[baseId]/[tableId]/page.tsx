// app/[baseId]/[tableId]/page.tsx

import { api } from "~/trpc/server";
import Link from "next/link";
import TableClient from "./TableClient";

export default async function TablePage({
  params
}: {
  params: Promise<{ baseId: string; tableId: string }>;
}) {
  const { baseId, tableId } = await params; // params is a Promise in Next.js 13

  const tables = await api.base.getTablesForBase({ baseId });
  const cols = await api.table.getColumns({ tableId });

  if (!tables || tables.length === 0) {
    return <div className="p-4">No tables in this base</div>;
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Tabs */}
      <div className="flex space-x-2 border-b p-2">
        {tables.map(t => (
          <Link
            key={t.id}
            href={`/${baseId}/${t.id}`}
            className={`rounded px-3 py-1 text-sm ${
              t.id === tableId
                ? "bg-white font-semibold shadow"
                : "bg-gray-100"
            }`}
          >
            {t.name}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <TableClient tableId={tableId} columnsMeta={cols} />
      </div>
    </div>
  );
}
