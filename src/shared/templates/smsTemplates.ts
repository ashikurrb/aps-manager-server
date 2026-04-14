//send otp to register and login
export const otpSMS = (name: string, otp: string | number): string => {
  return `Dear ${name}, Your APS verification code is: ${otp}`;
};

/*-----------------------------------------------------------------------------------------------*/

//send passowrd reset otp
export const passwordResetSMS = (
  name: string,
  otp: string | number,
): string => {
  return `Dear ${name}, Your password reset code is: ${otp}. Do not share this with anyone.`;
};

/*-----------------------------------------------------------------------------------------------*/

//send welcome after suscesfully verification
export const welcomeSMS = (name: string): string => {
  return `Dear ${name}, Welcome to APS! Your account is now active.`;
};

/*-----------------------------------------------------------------------------------------------*/
