export interface CampaignOption {
  id: number;
  label: string;
  odds: number | null;
}

export interface UserBet {
  optionId: number;
  optionLabel: string;
  amount: number;
  txSignature: string;
}

export interface Campaign {
  id: number;
  question: string;
  status: string;
  endTime: string;
  category: string | null;
  options: CampaignOption[];
  userBets?: UserBet[];
}

export interface CampaignListResponse {
  campaigns: Campaign[];
  nextCursor: string | null;
}

export interface PlaceBetApiResponse {
  txSignature: string;
  campaignId: number;
  optionId: number;
  amount: number;
}

export interface PlaceBetResult {
  txSignature: string;
  campaignId: number;
  campaignTitle: string;
  optionId: number;
  optionTitle: string;
  amount: number;
}

export interface BalanceResponse {
  balance: number;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}

export interface Config {
  "api-url": string;
  "api-key": string | null;
  "bet-size": string;
  "default-status": string;
  "default-limit": string;
}
