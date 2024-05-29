export interface Transaction {
  index: number;
  updated_at: string;
  from_account: string;
  to_account: string;
  amount: string;
  fee: string;
  memo: string;
  kind: string;
}
