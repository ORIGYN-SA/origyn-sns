import { useMutation } from "@tanstack/react-query";
import ogyAPI from "@services/api/ogy";

export type supportRequestProps = {
  name: string;
  email: string;
  description: string;
  principal: string;
};

const sendSupportRequest = async ({
  name,
  email,
  description,
  principal,
}: supportRequestProps) => {
  const result = (await ogyAPI.post(
    `/contact`,
    {
      name,
      email,
      message: `${description} User Principal:${principal}`,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  )) as Response;

  return result;
};

const useCreateSupportTicket = () => {
  return useMutation({
    mutationFn: (data: supportRequestProps) => sendSupportRequest(data),
  });
};

export default useCreateSupportTicket;
