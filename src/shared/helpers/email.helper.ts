import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//types
interface EmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
}

//global email sender
export const sendEmail = async ({
  to,
  subject,
  templateName,
  templateData,
}: EmailOptions) => {
  try {
    const templatePath = path.join(
      process.cwd(),
      "src",
      "shared",
      "templates",
      `${templateName}.hbs`,
    );

    const templateSource = await fs.readFile(templatePath, "utf-8");

    const compiledTemplate = handlebars.compile(templateSource);

    const fullTemplateData = {
      ...templateData,
      year: new Date().getFullYear(),
    };

    const htmlToSend = compiledTemplate(fullTemplateData);

    const mailOptions = {
      from: `"APS" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlToSend,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(
      `[Email] Sent '${templateName}' to ${to} | ID: ${info.messageId}`,
    );

    return { success: true };
  } catch (error: any) {
    console.error(
      `[Email Error] Failed to send '${templateName}':`,
      error.message,
    );
    throw new Error("Could not send email");
  }
};
