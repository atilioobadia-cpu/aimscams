import type { Metadata } from "next";

import { EditClientForm } from "@/components/clients/edit-client-form";

export const metadata: Metadata = {
  title: "Update client · AIMSCAMS",
};

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditClientForm id={id} />;
}
