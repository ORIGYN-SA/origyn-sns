export interface Transaction {
  index: string
  date: string
  from: string
  to: string
  amount: string
  fee: string
}

export interface Data {
  rows: Transaction[]
  pageCount: number
  rowCount: number
}

function generateRandomHexId(length:number) {
  const characters = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function generateTableData(numberOfRows:number) : Transaction[] {
  const data: Transaction[] = [];

  for (let i = 0; i < numberOfRows; i++) {
    data.push({
      index: generateRandomHexId(4),
      date: "Mar 26, 2024, 2:10 PM",
      from: generateRandomHexId(32),
      to: generateRandomHexId(32),
      amount: "6302.5",
      fee: "0.002"
    });
  }

  return data;
}

const data: Transaction[] = generateTableData(1000);

export async function fetchData(options: {
  pageIndex: number
  pageSize: number
}) {
  // Simulate some network latency
  await new Promise(r => setTimeout(r, 500))

  return {
    rows: data.slice(
      options.pageIndex * options.pageSize,
      (options.pageIndex + 1) * options.pageSize
    ),
    pageCount: Math.ceil(data.length / options.pageSize),
    rowCount: data.length,
  }
}
