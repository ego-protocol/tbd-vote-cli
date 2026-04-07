export interface CampaignOption {
  id: number;
  label: string;
  image?: string;
  betAmount: number;
  betAmountPercentage: number;
  betCount: number;
  betCountPercentage: number;
  odds: number | null;
}

// Status returned in bet responses (DB enum)
export enum BetStatus {
  Active = "active",
  Won = "won",
  Lost = "lost",
  Cancelled = "cancelled",
}

// Filter values accepted by GET /agents/bets ?status=
export enum BetStatusFilter {
  Active = "active",
  Settled = "settled",
}

export interface UserBet {
  id: string;
  campaignId: number;
  question?: string;
  questionImage?: string;
  shareImageUrl?: string | null;
  optionId: number;
  label: string;
  image?: string;
  betAmount: number;
  status: BetStatus;
  actualPayoutAmount?: number | null;
  endTime?: string;
  settledTime?: string | null;
  createdAt: string;
  odds?: number | null;
  potentialWin?: number | null;
}

export interface BetsListResponse {
  bets: UserBet[];
  nextCursor: string | null;
}

export interface BetStatsResponse {
  totalBets: number;
  activeBets: number;
  settledBets: number;
  winningBets: number;
  totalWon: number;
  totalLost: number;
  totalActive: number;
}

export interface CampaignTarget {
  countries?: string[];
  genders?: string[];
  yob_ranges?: { start: number; end: number }[];
  groups?: string[];
}

export interface Campaign {
  id: number;
  question: string;
  questionImage: string | null;
  status: string;
  category: string;
  totalBetAmount: number;
  totalBetCount: number;
  startTime: string;
  endTime: string;
  options: CampaignOption[];
  userBets: UserBet[];
  liveVoteCount?: number;
  target?: CampaignTarget | null;
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
  "max-bet-per-campaign": string;
}
