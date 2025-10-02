import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  RespondToAuthChallengeCommand,
  AdminConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { Resource } from "sst/resource";

const client = new CognitoIdentityProviderClient({
  region: "eu-central-1",
});

const CLIENT_ID = Resource.AuthClient.id;
const USER_POOL_ID = Resource.UserPool.id;

export async function initiateCustomAuth(email: string) {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: "CUSTOM_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
      },
    });

    const response = await client.send(command);
    return {
      success: true,
      session: response.Session,
      challengeName: response.ChallengeName,
    };
  } catch (error: any) {
    // User doesn't exist, create them
    if (error.name === "UserNotFoundException") {
      return await createUserAndInitiateAuth(email);
    }
    throw error;
  }
}

async function createUserAndInitiateAuth(email: string) {
  try {
    // Create user
    const signUpCommand = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: generateRandomPassword(),
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
      ],
    });

    await client.send(signUpCommand);

    // Auto-confirm the user (since we're using custom auth)
    const confirmCommand = new AdminConfirmSignUpCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });

    await client.send(confirmCommand);

    // Now initiate auth
    const authCommand = new InitiateAuthCommand({
      AuthFlow: "CUSTOM_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
      },
    });

    const response = await client.send(authCommand);
    return {
      success: true,
      session: response.Session,
      challengeName: response.ChallengeName,
      newUser: true,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function verifyOTP(email: string, otp: string, session: string) {
  try {
    const command = new RespondToAuthChallengeCommand({
      ClientId: CLIENT_ID,
      ChallengeName: "CUSTOM_CHALLENGE",
      Session: session,
      ChallengeResponses: {
        USERNAME: email,
        ANSWER: otp,
      },
    });

    const response = await client.send(command);

    if (response.AuthenticationResult) {
      return {
        success: true,
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
      };
    }

    return { success: false, error: "Invalid OTP" };
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return { success: false, error: error.message };
  }
}

function generateRandomPassword(): string {
  // Generate a random password that meets Cognito requirements
  const length = 16;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
