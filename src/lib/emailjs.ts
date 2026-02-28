import emailjs from '@emailjs/browser';

const PUBLIC_KEY   = 'IoyyR4GAPSffyyZi_';
const SERVICE_ID   = 'service_ctz7bt5';
const TEMPLATE_ID  = 'template_2fjy00i';

export function initEmailJs() {
  emailjs.init(PUBLIC_KEY);
}

interface SendOtpParams {
  to_email: string;
  otp: string;
}

export async function sendOtpEmail(params: SendOtpParams) {
  return emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    to_email: params.to_email,
    otp_code: params.otp,
  });
}