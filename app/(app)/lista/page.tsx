import { Suspense } from "react";
import { LeadList } from "@/components/LeadList";

export default function ListaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-20 text-muted">
          Carregando lista…
        </div>
      }
    >
      <LeadList />
    </Suspense>
  );
}
