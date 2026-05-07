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
  const { data } = await ogyAPI.post(`/contact`, {
    name,
    email,
    message: `${description} User Principal:${principal}`,
  });

  return data;
};

const useCreateSupportTicket = () => {
  return useMutation({
    mutationFn: (data: supportRequestProps) => sendSupportRequest(data),
  });
};

export default useCreateSupportTicket;
