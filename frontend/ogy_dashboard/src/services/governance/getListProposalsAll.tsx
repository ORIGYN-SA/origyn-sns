import { DateTime } from "luxon";
import _capitalize from "lodash/capitalize";
import snsAPI from "@services/_api/sns/v1";
import { SNS_ROOT_CANISTER } from "@constants/index";

interface IListProposals {
  limit: number;
  offset: number;
}

interface IProposals {
  id: number;
  proposer: string;
  proposal_title: string;
  proposal_creation_timestamp_seconds: number;
  initial_voting_period_seconds: number;
  proposal_action_type: string;
  status: string;
}

interface IListProposalsResult {
  data: IProposals[];
}

export interface IProposalsData {
  id: number;
  proposer: string;
  title: string;
  proposed: string;
  timeRemaining: string;
  topic: string;
  status: string;
}

export const getListProposalsAll = async ({
  limit = 10,
  offset = 0,
}: IListProposals) => {
  const { data } = await snsAPI.get(
    `/snses/${SNS_ROOT_CANISTER}/proposals?offset=${offset}&limit=${limit}&sort_by=-proposal_creation_timestamp_seconds`
  );

  return {
    totalProposals: data.total,
    data:
      (data as IListProposalsResult)?.data?.map((data) => {
        const id = data.id;
        const proposer = data.proposer;
        const title = data.proposal_title;
        const proposed =
          Math.round(Date.now()) -
          Number(data.proposal_creation_timestamp_seconds);
        const timeRemaining =
          Math.round(Date.now()) - Number(data.initial_voting_period_seconds);
        const topic = data.proposal_action_type;
        const status = data.status;

        return {
          id,
          proposer,
          title,
          proposed: DateTime.fromMillis(proposed).toRelativeCalendar() ?? "",
          timeRemaining:
            DateTime.fromMillis(timeRemaining).toRelativeCalendar() ?? "",
          topic,
          status: _capitalize(status),
        } as IProposalsData;
      }) ?? [],
  };
};