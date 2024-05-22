export interface Transaction {
  index: number;
  updated_at: Date;
  from_account: string;
  to_account: string;
  amount: string;
  fee: string;
}

export interface TransactionResults {
  rows: Transaction[];
  pageCount: number;
  rowCount: number;
}
