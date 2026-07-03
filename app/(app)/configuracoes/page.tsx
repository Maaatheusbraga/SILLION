import { getSession } from "@/lib/auth";
import { SettingsForm } from "@/components/SettingsForm";

export default async function ConfiguracoesPage() {
  const user = await getSession();
  if (!user) return null;

  return <SettingsForm user={user} />;
}
