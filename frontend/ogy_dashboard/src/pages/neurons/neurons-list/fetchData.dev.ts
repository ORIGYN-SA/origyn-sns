export interface Neuron {
  id: string
  state: 'dissolving' | 'not dissolving' | string
  stakedOGY: string
  maturity: number
  dissolveDelay: string
  age: string
  votingPower: number
}

export interface Data {
  rows: Neuron[]
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

function getRandomArrayElement(array: string[]) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateTableData(numberOfRows:number) : Neuron[] {
  const data: Neuron[] = [];

  for (let i = 0; i < numberOfRows; i++) {
    data.push({
      id: generateRandomHexId(40),
      state: getRandomArrayElement(["dissolving", "not dissolving"]),
      stakedOGY: (Math.random() * 1400 + 100).toFixed(3),
      maturity: 0,
      dissolveDelay: getRandomArrayElement(["2 years", "1 year", "3 years"]),
      age: getRandomArrayElement(["3 months", "6 months"]),
      votingPower: Math.floor(Math.random() * (3200 - 2000) + 2000),
    });
  }

  return data;
}

const data: Neuron[] = generateTableData(1000);

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
