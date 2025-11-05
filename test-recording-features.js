#!/usr/bin/env node

/**
 * Internal Test Script for Recording Features
 * Tests: Groq API, Task Extraction, Title Generation
 */

const https = require('https');
const http = require('http');

// Get API key from environment or use the one from memory
const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';

console.log('🧪 Starting Internal Test Suite for Recording Features\n');
console.log('=' .repeat(60));

// Test 1: Groq API Connection
async function testGroqAPI() {
  console.log('\n📡 Test 1: Groq API Connection');
  console.log('-'.repeat(60));
  
  return new Promise((resolve, reject) => {
    const testPrompt = 'Extract tasks from this meeting: "We need to finish the front office summit planning. Sarah will prepare the agenda. John should book the venue by Friday."';
    
    const postData = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are an expert task extraction AI.'
        },
        {
          role: 'user',
          content: testPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.choices && response.choices[0]) {
            const content = response.choices[0].message.content;
            console.log('✅ Groq API is working!');
            console.log(`   Response length: ${content.length} chars`);
            console.log(`   Model: ${response.model}`);
            console.log(`   First 200 chars: ${content.substring(0, 200)}...`);
            resolve({ success: true, response: content });
          } else {
            console.error('❌ Groq API returned error:');
            console.error('   Status:', res.statusCode);
            console.error('   Response:', JSON.stringify(response, null, 2));
            reject(new Error(`Groq API error: ${res.statusCode}`));
          }
        } catch (error) {
          console.error('❌ Failed to parse Groq response:', error.message);
          console.error('   Raw response:', data.substring(0, 500));
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Groq API request failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test 2: Task Extraction
async function testTaskExtraction() {
  console.log('\n📋 Test 2: Task Extraction');
  console.log('-'.repeat(60));
  
  const sampleTranscript = `
    Meeting: Front Office Summit Planning
    Date: November 5, 2025
    
    Participants: Sarah, John, Mike
    
    Discussion:
    - We need to finalize the front office summit agenda by next week
    - Sarah will prepare the presentation slides
    - John should book the conference room for Friday
    - Mike needs to send invitations to all stakeholders
    - We should follow up on the budget approval
    - Complete the venue selection by end of month
  `;
  
  const prompt = `You are an expert task extraction AI. Analyze this meeting transcript and extract ALL actionable tasks.

CRITICAL INSTRUCTIONS:
- Look for ANY mention of things to do, follow up on, or complete
- Extract tasks even if they're mentioned casually
- Each task MUST have a clear title and description

Meeting Transcript:
${sampleTranscript}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "tasks": [
    {
      "title": "Clear, specific task title",
      "description": "Detailed description",
      "priority": "medium",
      "estimatedHours": 2
    }
  ],
  "summary": "2-3 sentence summary",
  "confidence": 0.85
}`;

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are an expert task extraction AI.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.choices && response.choices[0]) {
            const content = response.choices[0].message.content;
            
            // Clean response
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```json')) {
              cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
            } else if (cleanContent.startsWith('```')) {
              cleanContent = cleanContent.replace(/```\s*/g, '').replace(/```\s*$/g, '').trim();
            }
            
            // Extract JSON
            const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              cleanContent = jsonMatch[0];
            }
            
            const parsed = JSON.parse(cleanContent);
            
            if (parsed.tasks && Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
              console.log('✅ Task extraction successful!');
              console.log(`   Tasks extracted: ${parsed.tasks.length}`);
              console.log(`   Summary: ${parsed.summary?.substring(0, 100)}...`);
              console.log(`   Confidence: ${parsed.confidence || 'N/A'}`);
              console.log('\n   Extracted Tasks:');
              parsed.tasks.forEach((task, idx) => {
                console.log(`   ${idx + 1}. ${task.title}`);
                console.log(`      ${task.description?.substring(0, 80)}...`);
                console.log(`      Priority: ${task.priority || 'medium'}`);
              });
              resolve({ success: true, tasks: parsed.tasks, summary: parsed.summary });
            } else {
              console.error('❌ Task extraction returned invalid format');
              console.error('   Response:', JSON.stringify(parsed, null, 2));
              reject(new Error('Invalid task extraction format'));
            }
          } else {
            console.error('❌ Groq API error:', response);
            reject(new Error('Groq API failed'));
          }
        } catch (error) {
          console.error('❌ Failed to parse task extraction:', error.message);
          console.error('   Raw response:', data.substring(0, 500));
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test 3: Title Generation
async function testTitleGeneration() {
  console.log('\n🎯 Test 3: Title Generation');
  console.log('-'.repeat(60));
  
  const sampleTranscript = `
    Meeting: Front Office Summit Planning
    We discussed the upcoming front office summit that will take place in December.
    Main topics included venue selection, agenda preparation, and stakeholder invitations.
    Sarah will handle the presentation, John will book the venue, and Mike will send invitations.
  `;
  
  const prompt = `You are an expert meeting title generator. Analyze this meeting transcript and generate a concise, professional title.

CRITICAL REQUIREMENTS:
- Title must be between 10-60 characters
- Capture the MAIN topic or purpose of the meeting
- Be specific and descriptive (not generic like "Meeting" or "Recording")
- Use professional, business-appropriate language
- Return ONLY the title text, nothing else

Meeting Transcript Excerpt:
${sampleTranscript.substring(0, 500)}

Generate ONLY the title (no quotes, no JSON, no explanation):`;

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are an expert meeting title generator.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.choices && response.choices[0]) {
            const content = response.choices[0].message.content.trim();
            
            // Clean title
            let cleanedTitle = content
              .replace(/^["']|["']$/g, '')
              .replace(/^Title:\s*/i, '')
              .replace(/^Meeting Title:\s*/i, '')
              .replace(/```json\s*/g, '')
              .replace(/```\s*/g, '')
              .replace(/\n.*/g, '')
              .trim();
            
            if (cleanedTitle && cleanedTitle.length >= 5 && cleanedTitle.length <= 100) {
              const lowerTitle = cleanedTitle.toLowerCase();
              const isGeneric = ['meeting', 'recording', 'call'].includes(lowerTitle);
              
              if (!isGeneric) {
                console.log('✅ Title generation successful!');
                console.log(`   Generated title: "${cleanedTitle}"`);
                console.log(`   Title length: ${cleanedTitle.length} chars`);
                resolve({ success: true, title: cleanedTitle });
              } else {
                console.warn('⚠️  Generated title is too generic:', cleanedTitle);
                reject(new Error('Title too generic'));
              }
            } else {
              console.error('❌ Generated title has invalid length:', cleanedTitle.length);
              console.error('   Raw title:', content);
              reject(new Error('Invalid title length'));
            }
          } else {
            console.error('❌ Groq API error:', response);
            reject(new Error('Groq API failed'));
          }
        } catch (error) {
          console.error('❌ Failed to parse title:', error.message);
          console.error('   Raw response:', data.substring(0, 500));
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run all tests
async function runAllTests() {
  const results = {
    groqAPI: { success: false, error: null },
    taskExtraction: { success: false, error: null, tasksCount: 0 },
    titleGeneration: { success: false, error: null, title: null }
  };

  try {
    // Test 1: Groq API
    await testGroqAPI();
    results.groqAPI.success = true;
  } catch (error) {
    results.groqAPI.error = error.message;
    console.error(`\n❌ Test 1 failed: ${error.message}`);
  }

  try {
    // Test 2: Task Extraction
    const taskResult = await testTaskExtraction();
    results.taskExtraction.success = true;
    results.taskExtraction.tasksCount = taskResult.tasks?.length || 0;
  } catch (error) {
    results.taskExtraction.error = error.message;
    console.error(`\n❌ Test 2 failed: ${error.message}`);
  }

  try {
    // Test 3: Title Generation
    const titleResult = await testTitleGeneration();
    results.titleGeneration.success = true;
    results.titleGeneration.title = titleResult.title;
  } catch (error) {
    results.titleGeneration.error = error.message;
    console.error(`\n❌ Test 3 failed: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n1. Groq API Connection: ${results.groqAPI.success ? '✅ PASS' : '❌ FAIL'}`);
  if (results.groqAPI.error) console.log(`   Error: ${results.groqAPI.error}`);
  
  console.log(`\n2. Task Extraction: ${results.taskExtraction.success ? '✅ PASS' : '❌ FAIL'}`);
  if (results.taskExtraction.success) {
    console.log(`   Tasks extracted: ${results.taskExtraction.tasksCount}`);
  }
  if (results.taskExtraction.error) console.log(`   Error: ${results.taskExtraction.error}`);
  
  console.log(`\n3. Title Generation: ${results.titleGeneration.success ? '✅ PASS' : '❌ FAIL'}`);
  if (results.titleGeneration.success) {
    console.log(`   Generated: "${results.titleGeneration.title}"`);
  }
  if (results.titleGeneration.error) console.log(`   Error: ${results.titleGeneration.error}`);

  const allPassed = results.groqAPI.success && results.taskExtraction.success && results.titleGeneration.success;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('='.repeat(60) + '\n');

  return allPassed;
}

// Run tests
runAllTests().catch(console.error);

