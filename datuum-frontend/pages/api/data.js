import { getAccessToken, withApiAuthRequired } from '@auth0/nextjs-auth0';

export default withApiAuthRequired(async function handler(req, res) {
  try {
    const { accessToken } = await getAccessToken(req, res);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    
    const apiRes = await fetch(`${apiBaseUrl}/api/items`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!apiRes.ok) {
      throw new Error(`Backend API returned ${apiRes.status}`);
    }

    const data = await apiRes.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data from backend:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Failed to fetch data from backend',
    });
  }
});

