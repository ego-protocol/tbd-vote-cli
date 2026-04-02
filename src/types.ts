export interface CampaignOption {
  id: string;
  title: string;
  odds: number;
}

export interface UserBet {
  optionId: string;
  optionTitle: string;
  amount: number;
  txSignature: string;
}

export interface Campaign {
  id: string;
  title: string;
  description?: string;
  status: string;
  endDate: string;
  category: string;
  options: CampaignOption[];
  userBets: UserBet[];
}

export interface CampaignListResponse {
  campaigns: Campaign[];
  cursor: string | null;
  total: number;
}

export interface PlaceBetResponse {
  txSignature: string;
  campaignId: string;
  campaignTitle: string;
  optionId: string;
  optionTitle: string;
  amount: number;
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
