/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
export interface Proposal {
  id: string
  title: string
  proposed: string
  timeRemaining: string
  topic: string
  status: 'open' | 'passed' | "no quorum" | string
  votes: string
  adopted: string
  rejected: string
  
}

export interface Data {
  rows: Proposal[]
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

function getRandomTitleTopicElement() {
  const array = [{title: "Send System Fund [{}]", topic: "Send System Fund"}, {title: "Set XDR Ration to 5.8", topic: "Set XDR ratio"}]
  return array[Math.floor(Math.random() * array.length)];
}

function generateTableData(numberOfRows:number) : Proposal[] {
  const data: Proposal[] = [];

  for (let i = 0; i < numberOfRows; i++) {
    const titleTopic = getRandomTitleTopicElement()
    data.push({
      id: generateRandomHexId(9),
      title: titleTopic.title,
      topic: titleTopic.topic,
      status: getRandomArrayElement(['open','passed',"no quorum"]),
      proposed: "Mar 26, 2024, 2:10 PM",
      timeRemaining: "45 minutes ago",
    });
  }

  return data;
}

const data: Proposal[] = generateTableData(1000);

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
