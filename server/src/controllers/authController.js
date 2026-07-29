import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { createUserIfNotExists, ensureUsername, serializeUser } from './userController.js';

export const githubCallback = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      console.error('GitHub credentials not configured');
      console.log(process.env.GITHUB_CLIENT_SECRET);
      console.log(process.env.GITHUB_CLIENT_ID);
      return res.status(500).json({ message: 'GitHub configuration error' });
    }

    // Exchange code for GitHub access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('GitHub token exchange failed:', tokenResponse.status, tokenResponse.statusText);
      return res.status(400).json({ message: 'Failed to exchange code for token' });
    }

    const tokenData = await tokenResponse.json();
    console.log(tokenData);

    if (tokenData.error) {
      console.error('GitHub token error:', tokenData.error_description);
      return res.status(400).json({ message: 'Failed to authenticate with GitHub', error: tokenData.error_description });
    }

    if (!tokenData.access_token) {
      console.error('No access token in response');
      return res.status(400).json({ message: 'No access token received from GitHub' });
    }

    // Fetch user data from GitHub API
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      console.error('GitHub user fetch failed:', userResponse.status, userResponse.statusText);
      return res.status(400).json({ message: 'Failed to fetch GitHub user data' });
    }

    const githubUser = await userResponse.json();
    console.log(githubUser);

    if (githubUser.error) {
      return res.status(400).json({ message: 'Failed to fetch GitHub user data' });
    }

    // Fetch user's emails from GitHub API to get verified email
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    let primaryEmail = githubUser.email;
    if (emailsResponse.ok) {
      const emails = await emailsResponse.json();
      console.log('GitHub emails:', emails);
      const primaryVerifiedEmail = emails.find(e => e.primary && e.verified);
      if (primaryVerifiedEmail) {
        primaryEmail = primaryVerifiedEmail.email;
      }
    }

    // Attach the primary email to githubUser
    githubUser.email = primaryEmail;

    // Create or get user in MongoDB
    const user = await createUserIfNotExists(githubUser);

    if (!user) {
      return res.status(500).json({ message: 'Failed to create user' });
    }

    // Create JWT token
    const jwtToken = jwt.sign(
      { id: user._id.toString(), email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      user: serializeUser(user),
      token: jwtToken,
    });
  } catch (error) {
    console.error('GitHub authentication error:', error);
    res.status(500).json({ message: 'GitHub authentication failed' });
  }
};

export const healthCheck = (req, res) => {
  res.json({ status: 'ok', message: 'Auth service is running' });
};

export const mockLogin = async (req, res) => {
  try {
    const mockUserData = {
      githubId: 'mock-github-id-12345',
      email: 'student.msit@example.com',
      name: 'Dev Student',
      college: 'MSIT',
      branch: 'CSE',
      semester: 4,
      rollNumber: '00115002722',
      theme: 'light',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120',
      bio: 'Engineering student in MSIT. Building cool projects.'
    };
    
    let user = await User.findOne({ githubId: mockUserData.githubId });
    if (!user) {
      user = await User.create(mockUserData);
    }
    await ensureUsername(user, "dev_student");
    
    const jwtToken = jwt.sign(
      { id: user._id.toString(), email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      user: serializeUser(user),
      token: jwtToken,
    });
  } catch (error) {
    console.error('Mock login error:', error);
    res.status(500).json({ message: 'Mock login failed' });
  }
};

