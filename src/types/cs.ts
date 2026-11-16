export enum ScenarioCategory {
  ALL = "All",
  DELIVERY = "Delivery",
  DELAYED = "Delayed",
  PRODUCT = "Product",
  REFUND = "Refund",
  GENERAL = "General",
  PLATFORM = "Platform",
}

export enum ToneOption {
  STANDARD = "Standard Polite",
  EMPATHETIC = "Extra Empathetic",
  FIRM = "Firm Policy",
}

export interface ScriptRow {
  section: string;
  english: string;
  portuguese: string;
  highlight?: boolean;
}

export interface ScriptPath {
  id: string;
  label: string;
  cxTrigger?: string;
  rows: ScriptRow[];
}

export interface ScriptScenario {
  id: string;
  number: number;
  sortOrder?: number;
  title: string;
  category: ScenarioCategory;
  whenToUse: string;
  policyRule: string;
  sampleInput: string;
  rows: ScriptRow[];
  paths?: ScriptPath[];
  isCustom?: boolean;
}

export interface GeneratedRow {
  section: string;
  english: string;
  portuguese: string;
  isKeyRule: boolean;
}

export interface GeneratedPathReply {
  pathId: string;
  pathLabel: string;
  cxTrigger?: string;
  policySummary: string;
  rows: GeneratedRow[];
  fullEnglishMessage: string;
  fullPortugueseMessage: string;
}

export interface LearnedRuleUpdate {
  action: "create" | "update";
  existingRuleId?: string;
  topic: string;
  english: string;
  portuguese: string;
  reason: string;
  isPrimary: boolean;
}

export interface AppliedRuleChange {
  action: "create" | "update";
  ruleId: string;
  topic: string;
  reason: string;
}

export interface LearnedScriptUpdate {
  action: "create" | "update";
  existingScenarioId?: string;
  title: string;
  category: ScenarioCategory;
  whenToUse: string;
  policyRule: string;
  sampleInput: string;
  rows: ScriptRow[];
  reason: string;
}

export interface AppliedScriptChange {
  action: "create" | "update";
  scenarioId: string;
  title: string;
  reason: string;
}

export interface GeneratedReply {
  detectedScenario: string;
  category: string;
  policySummary: string;
  rows: GeneratedRow[];
  fullEnglishMessage: string;
  fullPortugueseMessage: string;
  pathReplies?: GeneratedPathReply[];
  learnedRuleUpdates?: LearnedRuleUpdate[];
  learnedScriptUpdates?: LearnedScriptUpdate[];
}

export interface ProbingQuestion {
  english: string;
  portuguese: string;
}

export type ChatFlowChoiceKind = "choice" | "probing-answer" | "escalate" | "resolve";

export interface ChatFlowChoice {
  id: string;
  label: string;
  cxMessage: string;
  kind: ChatFlowChoiceKind;
}

export interface ChatFlowTurn {
  id: string;
  turnNumber: number;
  cxLabel: string;
  cxMessage: string;
  detectedScenario: string;
  category: string;
  policySummary: string;
  rows: GeneratedRow[];
  probingQuestions: ProbingQuestion[];
  nextChoices: ChatFlowChoice[];
  fullEnglishMessage: string;
  fullPortugueseMessage: string;
  editedPortuguese?: string;
}

export interface ChatFlowSessionEntry {
  id: string;
  title: string;
  orderInput: string;
  trackingNumber?: string;
  carrierName?: string;
  estimatedDate?: string;
  lastUpdateDate?: string;
  latestStatus?: string;
  issueTopic?: string;
  productSpec?: string;
  voucherTier?: string;
  tone: ToneOption;
  turns: ChatFlowTurn[];
  createdAt: string;
  updatedAt: string;
}

export interface StoreRuleEntry {
  id: string;
  topic: string;
  english: string;
  portuguese: string;
  isPrimary: boolean;
  sortOrder: number;
}
