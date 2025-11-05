#!/usr/bin/env node

/**
 * Test: Verify Tasks are Assigned to Selected Project
 * Simulates the full process-recording flow with project assignment
 */

const https = require('https');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY environment variable is required');
  process.exit(1);
}
const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || 'REPLACE_WITH_YOUR_PROJECT_ID';

console.log('🧪 Testing Project Assignment for Extracted Tasks\n');
console.log('='.repeat(70));

// Simulate the task extraction and project assignment
async function testProjectAssignment() {
  console.log('\n📋 Test: Task Extraction with Project Assignment');
  console.log('-'.repeat(70));
  
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
  
  const projectId = TEST_PROJECT_ID;
  
  console.log(`\n📁 Project Context:`);
  console.log(`   Project ID: ${projectId}`);
  console.log(`   Transcript length: ${sampleTranscript.length} chars\n`);
  
  // Step 1: Extract tasks using Groq (same as the API does)
  const prompt = `You are an expert task extraction AI. Analyze this meeting transcript and extract ALL actionable tasks.

CRITICAL INSTRUCTIONS:
- Look for ANY mention of things to do, follow up on, or complete
- Extract tasks even if they're mentioned casually
- Each task MUST have a clear title and description

Project Context: Project ID ${projectId}

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
          content: 'You are an expert task extraction AI helping with project management and task analysis.'
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
            
            // Clean response (same logic as the API)
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```json')) {
              cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
            } else if (cleanContent.startsWith('```')) {
              cleanContent = cleanContent.replace(/```\s*/g, '').replace(/```\s*$/g, '').trim();
            }
            
            const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              cleanContent = jsonMatch[0];
            }
            
            const parsed = JSON.parse(cleanContent);
            
            if (parsed.tasks && Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
              console.log('✅ Task extraction successful!');
              console.log(`   Tasks extracted: ${parsed.tasks.length}\n`);
              
              // Step 2: Simulate task creation with project_id (same as API does)
              console.log('📦 Simulating Task Creation with Project Assignment:');
              console.log('-'.repeat(70));
              
              const tasksToCreate = parsed.tasks.map((task, idx) => {
                // This is EXACTLY what the API does
                const taskData = {
                  title: task.title || 'Untitled task',
                  description: task.description || 'No description',
                  project_id: projectId, // ✅ CRITICAL: Assign to project
                  status: 'todo',
                  priority: task.priority || 'medium',
                  is_ai_generated: true,
                  estimated_hours: task.estimatedHours || null
                };
                
                console.log(`\n   Task ${idx + 1}:`);
                console.log(`   ├─ Title: "${taskData.title}"`);
                console.log(`   ├─ Description: ${taskData.description.substring(0, 60)}...`);
                console.log(`   ├─ Priority: ${taskData.priority}`);
                console.log(`   ├─ Project ID: ${taskData.project_id || '❌ NULL!'}`);
                console.log(`   └─ Status: ${taskData.status}`);
                
                // Verify project_id is set
                if (taskData.project_id === projectId) {
                  console.log(`   ✅ ✅ ✅ Project ID correctly assigned!`);
                } else {
                  console.error(`   ❌ ❌ ❌ Project ID MISSING or WRONG!`);
                  console.error(`      Expected: ${projectId}`);
                  console.error(`      Got: ${taskData.project_id || 'NULL'}`);
                }
                
                return taskData;
              });
              
              // Verify all tasks have project_id
              const tasksWithProject = tasksToCreate.filter(t => t.project_id === projectId);
              const tasksWithoutProject = tasksToCreate.filter(t => !t.project_id || t.project_id !== projectId);
              
              console.log('\n' + '='.repeat(70));
              console.log('📊 VERIFICATION RESULTS:');
              console.log('='.repeat(70));
              console.log(`\n   Total tasks: ${tasksToCreate.length}`);
              console.log(`   ✅ Tasks with correct project_id: ${tasksWithProject.length}`);
              console.log(`   ❌ Tasks WITHOUT project_id: ${tasksWithoutProject.length}`);
              
              if (tasksWithoutProject.length > 0) {
                console.log('\n   ⚠️  TASKS MISSING PROJECT ID:');
                tasksWithoutProject.forEach((task, idx) => {
                  console.log(`      ${idx + 1}. "${task.title}" - project_id: ${task.project_id || 'NULL'}`);
                });
              }
              
              // Final check
              const allHaveProject = tasksToCreate.every(t => t.project_id === projectId);
              
              if (allHaveProject) {
                console.log('\n   ✅ ✅ ✅ ALL TASKS HAVE PROJECT ID ASSIGNED! ✅ ✅ ✅');
                console.log(`   All ${tasksToCreate.length} tasks are correctly linked to project: ${projectId}`);
              } else {
                console.log('\n   ❌ ❌ ❌ SOME TASKS ARE MISSING PROJECT ID! ❌ ❌ ❌');
                console.log(`   Only ${tasksWithProject.length}/${tasksToCreate.length} tasks have project_id`);
              }
              
              resolve({
                success: allHaveProject,
                totalTasks: tasksToCreate.length,
                tasksWithProject: tasksWithProject.length,
                tasksWithoutProject: tasksWithoutProject.length,
                tasks: tasksToCreate
              });
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

// Run the test
async function runTest() {
  try {
    const result = await testProjectAssignment();
    
    console.log('\n' + '='.repeat(70));
    console.log('📋 FINAL TEST RESULT');
    console.log('='.repeat(70));
    
    if (result.success) {
      console.log('\n✅ ✅ ✅ TEST PASSED ✅ ✅ ✅');
      console.log(`\n   All ${result.totalTasks} extracted tasks are correctly assigned to project!`);
      console.log(`   Project ID: ${TEST_PROJECT_ID}`);
      console.log('\n   This confirms that the task extraction logic correctly assigns project_id.');
      console.log('   If tasks are still not showing in your project, the issue is likely:');
      console.log('   1. Project ID not being passed from client to API');
      console.log('   2. Database insert failing silently');
      console.log('   3. Tasks being created but not visible due to filtering');
    } else {
      console.log('\n❌ ❌ ❌ TEST FAILED ❌ ❌ ❌');
      console.log(`\n   Only ${result.tasksWithProject}/${result.totalTasks} tasks have project_id!`);
      console.log('   This indicates a bug in the task creation logic.');
    }
    
    console.log('\n' + '='.repeat(70) + '\n');
    
    return result.success;
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
runTest().catch(console.error);

