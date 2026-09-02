import "dotenv/config";

const GOOGLE_AUTH_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";

const GOOGLE_TOKEN_URL =
  "https://oauth2.googleapis.com/token";

const GOOGLE_USERINFO_URL =
  "https://www.googleapis.com/oauth2/v2/userinfo";

export function getGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri:
      process.env.GOOGLE_REDIRECT_URI || "",
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  code: string
) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret:
      process.env.GOOGLE_CLIENT_SECRET || "",
    code,
    redirect_uri:
      process.env.GOOGLE_REDIRECT_URI || "",
    grant_type: "authorization_code",
  });

  const response = await fetch(
    GOOGLE_TOKEN_URL,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    console.error(
      "Google token exchange failed:",
      data
    );

    throw new Error(
      "Failed to exchange Google authorization code"
    );
  }

  return data.access_token as string;
}

export async function getGoogleUser(
  accessToken: string
) {
  const response = await fetch(
    GOOGLE_USERINFO_URL,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok || !data.id || !data.email) {
    console.error(
      "Google user info request failed:",
      data
    );

    throw new Error(
      "Failed to retrieve Google user"
    );
  }

  return {
    googleId: data.id as string,
    email: data.email as string,
    name:
      (data.name as string) ||
      data.email.split("@")[0],
    avatarUrl:
      (data.picture as string) || null,
  };
}