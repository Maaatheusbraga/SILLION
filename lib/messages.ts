import { DEFAULT_MESSAGE_TEMPLATE } from "./types";

export function buildContactMessage(
  template: string,
  vars: { vendedor: string; empresa: string; cidade: string }
): string {
  return template
    .replace(/\{vendedor\}/gi, vars.vendedor)
    .replace(/\{empresa\}/gi, vars.empresa)
    .replace(/\{cidade\}/gi, vars.cidade);
}

export function previewContactMessage(
  template: string,
  displayName: string
): string {
  return buildContactMessage(template || DEFAULT_MESSAGE_TEMPLATE, {
    vendedor: displayName || "Seu Nome",
    empresa: "Clínica Exemplo",
    cidade: "João Pessoa",
  });
}
