import type { CreateAuthChallengeTriggerHandler, DefineAuthChallengeTriggerHandler, VerifyAuthChallengeResponseTriggerHandler } from "aws-lambda";
import { SESClient, SendEmailCommand, type SendEmailCommandInput } from '@aws-sdk/client-ses';

// Initialize SES client
const sesClient = new SESClient({
  region: 'eu-central-1'
});

// Configuration
const CONFIG = {
  SENDER_EMAIL: process.env.SENDER_EMAIL || 'no-reply@verificationemail.com',
  CODE_LENGTH: 6,
  EXPIRY_MINUTES: 5,
};

/**
 * Generate a random numeric OTP code
 */
function generateOTPCode(length: number = CONFIG.CODE_LENGTH): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

/**
 * Create email HTML template
 */
function createEmailTemplate(code: string, email: string): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .code-container {
            background-color: #ffffff;
            border: 2px solid #4CAF50;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #4CAF50;
            font-family: 'Courier New', monospace;
          }
          .expiry {
            color: #666;
            font-size: 14px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            color: #888;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
            <p>Hello,</p>
            <p>You requested to sign in to your account. Use the verification code below:</p>
          </div>

          <div class="code-container">
            <div class="code">${code}</div>
            <div class="expiry">This code will expire in ${CONFIG.EXPIRY_MINUTES} minutes</div>
          </div>

          <p style="text-align: center;">
            If you didn't request this code, please ignore this email.
          </p>

          <div class="footer">
            <p>This is an automated message, please do not reply.</p>
            <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Email Verification

Your verification code is: ${code}

This code will expire in ${CONFIG.EXPIRY_MINUTES} minutes.

If you didn't request this code, please ignore this email.

This is an automated message, please do not reply.
© ${new Date().getFullYear()} Your Company. All rights reserved.
  `;

  return { html, text };
}

/**
 * Send OTP email using AWS SES
 */
async function sendOTPEmail(email: string, code: string): Promise<void> {
  const { html, text } = createEmailTemplate(code, email);

  const params: SendEmailCommandInput = {
    Source: CONFIG.SENDER_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: `Your Verification Code: ${code}`,
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: text,
          Charset: 'UTF-8',
        },
        Html: {
          Data: html,
          Charset: 'UTF-8',
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    console.log('Email sent successfully:', response.MessageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
}

export const defineAuthChallenge: DefineAuthChallengeTriggerHandler = async (event) => {
  console.log('Define Auth Challenge Event:', JSON.stringify(event, null, 2));

  const { request, response } = event;
  const { session } = request;

  // First authentication attempt - issue custom challenge
  if (session.length === 0) {
    response.issueTokens = false;
    response.failAuthentication = false;
    response.challengeName = 'CUSTOM_CHALLENGE';
    console.log('First attempt - issuing CUSTOM_CHALLENGE');
  }
  // Second attempt - check if previous challenge was answered correctly
  else if (
    session.length === 1 &&
    session[0].challengeName === 'CUSTOM_CHALLENGE' &&
    session[0].challengeResult === true
  ) {
    response.issueTokens = true;
    response.failAuthentication = false;
    console.log('Challenge answered correctly - issuing tokens');
  }
  // Failed attempt or too many tries
  else if (
    session.length === 1 &&
    session[0].challengeName === 'CUSTOM_CHALLENGE' &&
    session[0].challengeResult === false
  ) {
    response.issueTokens = false;
    response.failAuthentication = false;
    response.challengeName = 'CUSTOM_CHALLENGE';
    console.log('Challenge answered incorrectly - allowing retry');
  }
  // Too many failed attempts
  else {
    response.issueTokens = false;
    response.failAuthentication = true;
    console.log('Too many failed attempts - failing authentication');
  }

  console.log('Define Auth Challenge Response:', JSON.stringify(response, null, 2));
  return event;
};

  /**
   * Create Auth Challenge Lambda Trigger
   * Generates OTP and sends it via email
   */
  export const createAuthChallenge: CreateAuthChallengeTriggerHandler = async (event) => {
    console.log('Create Auth Challenge Event:', JSON.stringify(event, null, 2));

    const { request, response } = event;
    const email = request.userAttributes.email;

    let secretCode: string;

    // Check if this is a retry (session already exists)
    if (request.session && request.session.length > 0) {
      // Extract code from previous challenge metadata
      const previousChallenge = request.session[request.session.length - 1];
      const metadata = previousChallenge.challengeMetadata;

      if (metadata) {
        const match = metadata.match(/CODE-(\d+)/);
        if (match && match[1]) {
          secretCode = match[1];
          console.log('Reusing existing OTP for retry attempt');
        } else {
          // If we can't extract the code, generate a new one
          secretCode = generateOTPCode();
          await sendOTPEmail(email, secretCode);
          console.log('Generated new OTP for retry (metadata extraction failed)');
        }
      } else {
        // No metadata found, generate new code
        secretCode = generateOTPCode();
        await sendOTPEmail(email, secretCode);
        console.log('Generated new OTP for retry (no metadata)');
      }
    } else {
      // First attempt - generate new code and send email
      secretCode = generateOTPCode();
      await sendOTPEmail(email, secretCode);
      console.log('Generated and sent new OTP for first attempt');
    }

    // Set response parameters
    response.publicChallengeParameters = {
      email: email,
      message: 'Please check your email for the verification code',
    };

    response.privateChallengeParameters = {
      answer: secretCode,
    };

    response.challengeMetadata = `CODE-${secretCode}`;

    console.log('Create Auth Challenge Response:', {
      publicChallengeParameters: response.publicChallengeParameters,
      challengeMetadata: response.challengeMetadata,
    });

    return event;
  };

export const verifyAuthChallengeResponse: VerifyAuthChallengeResponseTriggerHandler = async (event) => {
  console.log('Verify Auth Challenge Event:', JSON.stringify(event, null, 2));

  const { request, response } = event;
  const expectedAnswer = request.privateChallengeParameters?.answer;
  const userAnswer = request.challengeAnswer;

  console.log('Verification Details:', {
    expectedAnswer: expectedAnswer ? '***' + expectedAnswer.slice(-2) : 'undefined',
    userAnswer: userAnswer ? '***' + userAnswer.slice(-2) : 'undefined',
    userEmail: request.userAttributes.email,
  });

  // Validate the answer
  if (!expectedAnswer || !userAnswer) {
    response.answerCorrect = false;
    console.log('Verification failed: Missing answer');
  } else if (userAnswer.trim() === expectedAnswer.trim()) {
    response.answerCorrect = true;
    console.log('Verification successful: Correct OTP');
  } else {
    response.answerCorrect = false;
    console.log('Verification failed: Incorrect OTP');
  }

  console.log('Verify Auth Challenge Response:', {
    answerCorrect: response.answerCorrect,
  });

  return event;
};
