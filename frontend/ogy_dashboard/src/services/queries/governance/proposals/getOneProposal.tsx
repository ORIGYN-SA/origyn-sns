import { DateTime } from 'luxon'
import _capitalize from 'lodash/capitalize'
import snsAPI from '@services/api/sns/v1'
import { IProposalResult, IProposalData } from '@services/types'
import { SNS_ROOT_CANISTER } from '@constants/index'
import { roundAndFormatLocale, divideBy1e8 } from '@helpers/numbers'

export const getOneProposal = async ({
  proposalId
}: {
  proposalId: string
}) => {
  const { data }: { data: IProposalResult } = await snsAPI.get(
    `/snses/${SNS_ROOT_CANISTER}/proposals/${proposalId}`
  )

  console.log(data)

  const id = data.id
  const proposer = data.proposer
  const title = data.proposal_title
  const proposed = Number(data.proposal_creation_timestamp_seconds)
  const timeRemaining = Number(
    data.wait_for_quiet_state_current_deadline_timestamp_seconds
  )
  const topic = data.proposal_action_type
  const status = data.status
  const payload = data.payload_text_rendering
  const votes = data.latest_tally
  const yes = (votes.yes * 100) / votes.total
  const no = (votes.no * 100) / votes.total

  return {
    id,
    proposer,
    title,
    proposed: DateTime.fromSeconds(proposed).toRelativeCalendar() ?? '',
    timeRemaining:
      DateTime.fromSeconds(timeRemaining).toRelativeCalendar() ?? '',
    topic,
    status: _capitalize(status),
    payload,
    votes: {
      yes,
      yesToString: yes.toFixed(3),
      no,
      noToString: no.toFixed(3),
      total: roundAndFormatLocale({ number: divideBy1e8(votes.total) })
    }
  } as IProposalData
}
