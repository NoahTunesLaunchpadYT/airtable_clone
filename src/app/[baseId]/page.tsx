// app/[baseId]/page.tsx

import { redirect } from "next/navigation";
import { api } from "~/trpc/server";

export default async function BaseIndexPage({
  params
}: {
  params: Promise<{ baseId: string }>;
}) {
  const { baseId } = await params; // params is a Promise in Next.js 13

  const tables = await api.base.getTablesForBase({ baseId });

  if (!tables || tables.length === 0) {
    return <div className="p-4">This base has no tables yet</div>;
  }

  const firstTable = tables[0];
  if (!firstTable) {
    return <div className="p-4">This base has no tables yet</div>;
  }

  redirect(`/${baseId}/${firstTable.id}`);
}
