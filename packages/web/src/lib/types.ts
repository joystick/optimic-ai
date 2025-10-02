export interface CognitoAuthResponse {
  Session: string;
  ChallengeName: string;
  ChallengeParameters: {
    email: string;
  };
}

export interface User {
  id: string;
  email: string;
  name?: string;
}
