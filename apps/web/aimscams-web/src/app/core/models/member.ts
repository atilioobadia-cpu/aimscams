export interface Member {
  id: string;
  memberNo: string;
  first: string;
  last: string;
  phone: string;
  branch: string;
  kyc: 'Verified' | 'Pending';
  status: 'Active' | 'Dormant';
  savings: number;
  shares?: number;
  loanBalance: number;
  joined: string; // ISO date
}

export interface MemberSummary {
  totalMembers: number;
  activeMembers: number;
  pendingKyc: number;
  totalSavings: number;
}
