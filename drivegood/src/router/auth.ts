// jafoy: uses cognito to determine if the user is authorized
import { fetchAuthSession } from 'aws-amplify/auth';

const Admin = 'Admin'
const Sponsor = 'Sponsor'
const Driver = 'Driver'

export async function cognitoCheckGroupAuth(groups: Array<string>): Promise<{ isAuthorized: boolean }> {
  try {
    const authSession = await fetchAuthSession();
    
    if (authSession.tokens) {
      const payload = authSession.tokens.accessToken.payload;
      
      if (payload['cognito:groups'] && Array.isArray(payload['cognito:groups'])) {
        return {
          isAuthorized: groups.some(group => (payload['cognito:groups'] as string[]).includes(group)),
        };
      }
    }
    return { isAuthorized: false };
  } catch (error) {
    console.error('Error checking authorization:', error);
    return { isAuthorized: false };
  }
}

// Usage:
// cognitoFetchUser() -> { id: string, username: string, groups: Array<string> }
// Throws an error if it doesn't find a user.
export async function cognitoFetchUser() {
  try {
    const authSession = await fetchAuthSession();
    
    if (authSession.tokens) {
      const payload = authSession.tokens.idToken?.payload;
      
      if (payload && payload['cognito:username'] && payload['cognito:sub'] && payload['cognito:groups']) {
        return {id: payload['cognito:sub'], username: payload['cognito:username'], groups: payload['cognito:groups']};
      }
    }
    throw new Error('There is no currently signed in user.');
  } catch (error) {
    console.error('Unidentified Error fetching user:', error);
    return null;
  }
}

export {
  Admin,
  Sponsor,
  Driver
}