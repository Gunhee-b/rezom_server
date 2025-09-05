#!/usr/bin/env npx ts-node

/**
 * Script to set up Today's Question and Analyzing the World features
 * Run with: npx ts-node setup-features.ts
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@rezom.org';
const ADMIN_PASSWORD = 'Admin!2345';

interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
}

async function login(): Promise<string> {
  try {
    const response = await axios.post<AuthResponse>(`${BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    
    console.log('✅ Logged in as admin');
    return response.data.accessToken;
  } catch (error) {
    console.error('❌ Failed to login:', error);
    throw error;
  }
}

async function setDailyQuestion(token: string, questionId: number): Promise<void> {
  try {
    const response = await axios.post(
      `${BASE_URL}/admin/daily-question`,
      { questionId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.data.ok) {
      console.log(`✅ Set question ${questionId} as Today's Question`);
    } else {
      console.error('❌ Failed to set daily question:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Error setting daily question:', error);
    throw error;
  }
}

async function setupAnalyzeWorld(token: string, questionIds: number[]): Promise<void> {
  try {
    const response = await axios.post(
      `${BASE_URL}/admin/define/analyze-world/top5`,
      { questionIds },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.data.ok) {
      console.log(`✅ Set up Analyzing the World with questions: ${questionIds.join(', ')}`);
    } else {
      console.error('❌ Failed to set up Analyzing the World:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Error setting up Analyzing the World:', error);
    throw error;
  }
}

async function getAvailableQuestions(token: string): Promise<any[]> {
  try {
    const response = await axios.get(`${BASE_URL}/questions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching questions:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Setting up Today\'s Question and Analyzing the World features\n');
  
  try {
    // Login as admin
    const token = await login();
    
    // Get available questions
    const questions = await getAvailableQuestions(token);
    console.log(`\n📋 Found ${questions.length} available questions`);
    
    if (questions.length === 0) {
      console.log('❌ No questions available. Please create some questions first.');
      return;
    }
    
    // Display available questions
    console.log('\nAvailable questions:');
    questions.slice(0, 10).forEach((q: any) => {
      console.log(`  ${q.id}: ${q.title}`);
    });
    
    // Set today's question (using the most recent question)
    const todaysQuestionId = questions[0].id;
    console.log(`\n📌 Setting Today's Question to: ${todaysQuestionId} - ${questions[0].title}`);
    await setDailyQuestion(token, todaysQuestionId);
    
    // Set up Analyzing the World with top 5 questions about world analysis
    const analyzeWorldQuestions = questions
      .filter((q: any) => 
        q.title.toLowerCase().includes('system') ||
        q.title.toLowerCase().includes('global') ||
        q.title.toLowerCase().includes('world') ||
        q.title.toLowerCase().includes('society') ||
        q.title.toLowerCase().includes('environment')
      )
      .slice(0, 5)
      .map((q: any) => q.id);
    
    if (analyzeWorldQuestions.length < 5) {
      // If not enough world-related questions, just use the top 5
      const topQuestions = questions.slice(0, 5).map((q: any) => q.id);
      console.log(`\n🌍 Setting up Analyzing the World with top 5 questions: ${topQuestions.join(', ')}`);
      await setupAnalyzeWorld(token, topQuestions);
    } else {
      console.log(`\n🌍 Setting up Analyzing the World with world-related questions: ${analyzeWorldQuestions.join(', ')}`);
      await setupAnalyzeWorld(token, analyzeWorldQuestions);
    }
    
    console.log('\n✨ Setup completed successfully!');
    console.log('\nYou can now:');
    console.log('1. Visit /todays to see Today\'s Question');
    console.log('2. Visit /analyze to see Analyzing the World');
    console.log('3. Use the Admin page to change these settings anytime');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);