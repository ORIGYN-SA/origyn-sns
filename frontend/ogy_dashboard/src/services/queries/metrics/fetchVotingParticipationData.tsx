const fetchVotingParticipationData = async ({
  period
}: {
  period: string
}): Promise<Array<[bigint, { participation: number }]>> => {
  const fakeData: Array<[bigint, { participation: number }]> = []
  const days = period === 'weekly' ? 7 : period === 'monthly' ? 30 : 365

  for (let i = 0; i < days; i++) {
    fakeData.push([BigInt(i), { participation: 20 + Math.random() * 80 }])
  }

  return fakeData
}

export default fetchVotingParticipationData
