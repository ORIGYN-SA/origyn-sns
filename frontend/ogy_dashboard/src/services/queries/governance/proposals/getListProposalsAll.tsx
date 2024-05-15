import { DateTime } from "luxon";
import _capitalize from "lodash/capitalize";
import snsAPI from "@services/api/sns/v1";
import { SNS_ROOT_CANISTER } from "@constants/index";
import { IListProps, IProposalResult, IProposalData } from "@services/types";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers";

export const getListProposalsAll = async ({
  limit = 10,
  offset = 0,
}: IListProps) => {
  const { data } = await snsAPI.get(
    `/snses/${SNS_ROOT_CANISTER}/proposals?offset=${offset}&limit=${limit}&sort_by=-proposal_creation_timestamp_seconds`
  );

  return {
    totalProposals: data.total,
    data:
      (data as { data: IProposalResult[] })?.data?.map((data) => {
        const votes = data.latest_tally;
        const yes = (votes.yes * 100) / votes.total;
        const no = (votes.no * 100) / votes.total;
        const id = data.id;
        const proposer = data.proposer;
        const title = data.proposal_title;
        const proposed = Number(data.proposal_creation_timestamp_seconds);
        const timeRemaining = Number(
          data.wait_for_quiet_state_current_deadline_timestamp_seconds
        );
        const topic = data.proposal_action_type;
        const status = data.status;

        return {
          id,
          proposer,
          title,
          proposed: DateTime.fromSeconds(proposed).toRelativeCalendar() ?? "",
          timeRemaining:
            DateTime.fromSeconds(timeRemaining).toRelativeCalendar() ?? "",
          topic,
          status: _capitalize(status),
          votes: {
            yes,
            yesToString: yes.toFixed(3),
            no,
            noToString: no.toFixed(3),
            total: roundAndFormatLocale({ number: divideBy1e8(votes.total) }),
          },
        } as IProposalData;
      }) ?? [],
  };
};
