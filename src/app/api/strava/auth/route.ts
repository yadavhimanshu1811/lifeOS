import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Missing STRAVA_CLIENT_ID" }, { status: 500 });
  }

  const redirectUri = "http://localhost:3000/api/strava/callback";
  const scope = "read,activity:read_all";
  
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=${scope}`;
  
  return NextResponse.redirect(authUrl);
}
