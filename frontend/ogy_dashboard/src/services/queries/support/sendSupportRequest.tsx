import ogyAPI from "@services/api/ogy";

type supportRequestProps = {
  name: string;
  email: string;
  details: string;
  principal: string;
}

const sendSupportRequest = async ({name, email, details, principal}: supportRequestProps) => {
  const { data } = await ogyAPI.post(`/contact`, {
    name,
    email,
    message: `${details} User Principal:${principal}`
  }, {
    headers: {
      "Content-Type": "application/json",
    }
   });

  return {
    data,
  };
};

export default sendSupportRequest;
