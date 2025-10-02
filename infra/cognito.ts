export const userPool = new sst.aws.CognitoUserPool("UserPool", {
  usernames: ["email"],
  triggers: {
    defineAuthChallenge: "packages/functions/src/cognito.defineAuthChallenge",
    createAuthChallenge: "packages/functions/src/cognito.createAuthChallenge",
    verifyAuthChallengeResponse:
      "packages/functions/src/cognito.verifyAuthChallengeResponse",
  },
  transform: {
    userPool: {
      signInPolicy: {
        allowedFirstAuthFactors: ["EMAIL_OTP", "PASSWORD"],
      },
    },
  },
});
export const userPoolClient = userPool.addClient("AuthClient", {
  transform: {
    client: {
      explicitAuthFlows: ["ALLOW_CUSTOM_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"],
    },
  },
});
