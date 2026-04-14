import axios from "axios";

const singleUrl = process.env.SMS_API_SINGLE_URL;
const manyUrl = process.env.SMS_API_MANY_URL;
const api_key = process.env.SMS_API_KEY;
const senderid = process.env.SMS_SENDER_ID;

//send one to many
export const sendSingleSMS = async (number: string, message: string) => {
  const formattedNumber = number.startsWith("88") ? number : `88${number}`;

  const payload = {
    api_key,
    senderid,
    number: formattedNumber,
    message: message,
    type: "text",
  };

  try {
    const { data } = await axios.post(singleUrl!, payload);

    if (data.response_code === 202) {
      return { success: true, data };
    }
    const errorMap: Record<number, string> = {
      1001: "Invalid Number format (Ensure 88 prefix)",
      1002: "Invalid or disabled Sender ID",
      1007: "Insufficient Balance",
      1011: "API Key / User ID not found",
    };

    console.error("BulkSMSBD Error:", data);
    return {
      success: false,
      error:
        errorMap[data.response_code] ||
        data.success_message ||
        "SMS Gateway Error",
    };
  } catch (error: any) {
    console.error("SMS Helper Connection Error:", error.message);
    return { success: false, error: "Connection to SMS Gateway failed" };
  }
};

/*--------------------------------------------------------------------------------------------*/

//send many to many
export const sendManySMS = async (
  smsList: { number: string; message: string }[],
) => {
  const formattedMessages = smsList.map((sms) => ({
    to: sms.number.startsWith("88") ? sms.number : `88${sms.number}`,
    message: sms.message,
  }));

  const payload = {
    api_key,
    senderid,
    messages: formattedMessages,
  };

  try {
    const { data } = await axios.post(manyUrl!, payload);

    if (data.response_code === 202) {
      return { success: true, data };
    }

    const errorMap: Record<number, string> = {
      1001: "Invalid Number format (Ensure 88 prefix)",
      1002: "Invalid or disabled Sender ID",
      1007: "Insufficient Balance",
      1011: "API Key / User ID not found",
    };

    console.error("BulkSMSBD Error:", data);
    return {
      success: false,
      error:
        errorMap[data.response_code] ||
        data.success_message ||
        "SMS Gateway Error",
    };
  } catch (error: any) {
    console.error("SMS Helper Connection Error:", error.message);
    return { success: false, error: "Connection to SMS Gateway failed" };
  }
};
