export interface IProposalVotes {
  yes: number;
  yesToString: string;
  noToString: string;
  no: number;
  total: string;
}
export interface IProposalResult {
  id: number;
  proposer: string;
  proposal_title: string;
  proposal_creation_timestamp_seconds: number;
  initial_voting_period_seconds: number;
  proposal_action_type: string;
  status: string;
  payload_text_rendering: string;
  latest_tally: {
    no: number;
    yes: number;
    total: number;
    timestamp_seconds: number;
  };
  wait_for_quiet_state_current_deadline_timestamp_seconds: number;
  reject_cost_e8s: number;
}

export interface IProposalData {
  id: number;
  proposer: string;
  title: string;
  proposed: string;
  timeRemaining: string;
  topic: string;
  status: string;
  payload?: string;
  votes: IProposalVotes;
  riskedOGY?: string;
}
