export type LeadStatus =
  | "importado"
  | "nao_contatado"
  | "contatado"
  | "negociacao"
  | "convertido"
  | "descartado";

export type InteractionChannel = "whatsapp" | "ligacao" | "email";

export type ThemeMode = "dark" | "light";

export interface Interaction {
  id: string;
  channel: InteractionChannel;
  note: string;
  createdAt: string;
  userId: string;
  userName: string;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
  userName: string;
}

export interface Dataset {
  id: string;
  name: string;
  createdAt: string;
  createdByName: string | null;
}

export interface Lead {
  id: string;
  datasetId: string;
  placeId: string;
  title: string;
  phone: string;
  address: string;
  neighborhood: string;
  city: string;
  postalCode: string;
  totalScore: number | null;
  reviewsCount: number | null;
  status: LeadStatus;
  isCard: boolean;
  /** @deprecated use comments */
  notes: string;
  ownerId: string | null;
  ownerName: string | null;
  nextFollowUp: string | null;
  interactions: Interaction[];
  comments: Comment[];
  importedAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  messageTemplate: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  messageTemplate: string;
}

export interface UserSettings {
  displayName: string;
  messageTemplate: string;
}

/** Usuário exposto pela API — nunca inclui passwordHash */
export interface UserPublic {
  id: string;
  username: string;
  displayName: string;
  messageTemplate: string;
  createdAt: string;
}

export const DEFAULT_MESSAGE_TEMPLATE =
  "Olá! Tudo bem? Me chamo {vendedor}. Vi o trabalho da {empresa} em {cidade} e resolvi entrar em contato para me apresentar. Espero que esteja tendo um excelente dia! 😊";

export const KANBAN_STATUSES: LeadStatus[] = [
  "nao_contatado",
  "contatado",
  "negociacao",
  "convertido",
  "descartado",
];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  importado: "Importado",
  nao_contatado: "Não contatado",
  contatado: "Contatado",
  negociacao: "Em negociação",
  convertido: "Convertido",
  descartado: "Descartado",
};

export const COLUMN_META: Record<
  LeadStatus,
  { label: string; hint: string }
> = {
  importado: { label: "Importado", hint: "Aguardando promoção" },
  nao_contatado: { label: "Não contatado", hint: "Pronto para abordar" },
  contatado: { label: "Contatado", hint: "Primeiro contato feito" },
  negociacao: { label: "Em negociação", hint: "Conversa em andamento" },
  convertido: { label: "Convertido", hint: "Cliente fechado" },
  descartado: { label: "Descartado", hint: "Sem interesse" },
};

export const CHANNEL_LABELS: Record<InteractionChannel, string> = {
  whatsapp: "WhatsApp",
  ligacao: "Ligação",
  email: "E-mail",
};
