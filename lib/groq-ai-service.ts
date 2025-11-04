import Groq from 'groq-sdk'

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description: string
  status: string
  progress: number
  due_date?: string
  created_at: string
}

export interface AIInsight {
  id: string
  type: 'optimization' | 'risk' | 'achievement' | 'prediction'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  actionable: boolean
  category: string
  created_at: string
}

export async function analyzeTasksAndProjects(
  tasks: Task[],
  projects: Project[]
): Promise<AIInsight[]> {
  try {
    // Prepare data summary for AI
    const tasksSummary = {
      total: tasks.length,
      byStatus: {
        todo: tasks.filter(t => t.status === 'todo').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length
      },
      byPriority: {
        urgent: tasks.filter(t => t.priority === 'urgent').length,
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      },
      overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length,
      recentTasks: tasks.slice(0, 10).map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date
      }))
    }

    const projectsSummary = {
      total: projects.length,
      avgProgress: projects.reduce((acc, p) => acc + p.progress, 0) / projects.length || 0,
      recentProjects: projects.slice(0, 5).map(p => ({
        name: p.name,
        status: p.status,
        progress: p.progress,
        due_date: p.due_date
      }))
    }

    const prompt = `You are an AI project management analyst. Analyze the following project and task data and generate 4-6 actionable insights.

Tasks Summary:
- Total: ${tasksSummary.total}
- To Do: ${tasksSummary.byStatus.todo}
- In Progress: ${tasksSummary.byStatus.in_progress}
- Completed: ${tasksSummary.byStatus.completed}
- Urgent: ${tasksSummary.byPriority.urgent}
- High Priority: ${tasksSummary.byPriority.high}
- Overdue: ${tasksSummary.overdue}

Projects Summary:
- Total: ${projectsSummary.total}
- Average Progress: ${projectsSummary.avgProgress.toFixed(1)}%

Recent Tasks:
${JSON.stringify(tasksSummary.recentTasks, null, 2)}

Recent Projects:
${JSON.stringify(projectsSummary.recentProjects, null, 2)}

Generate 4-6 insights in the following JSON format. Each insight should be specific, actionable, and relevant to the data:
[
  {
    "type": "optimization|risk|achievement|prediction",
    "title": "Brief insight title",
    "description": "Detailed description with specific recommendations",
    "impact": "high|medium|low",
    "confidence": 75-95,
    "actionable": true|false,
    "category": "Category name"
  }
]

Focus on:
1. Identifying risks (overdue tasks, bottlenecks)
2. Optimization opportunities (productivity patterns)
3. Achievements (milestones reached)
4. Predictions (future trends)

Return ONLY the JSON array, no additional text.`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000
    })

    const response = completion.choices[0]?.message?.content || '[]'
    
    // Parse the AI response
    let insights: any[] = []
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0])
      } else {
        insights = JSON.parse(response)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.log('Raw response:', response)
      // Return empty array if parsing fails
      return []
    }

    // Add IDs and timestamps to insights
    return insights.map((insight, index) => ({
      ...insight,
      id: `ai-${Date.now()}-${index}`,
      created_at: new Date().toISOString()
    }))

  } catch (error) {
    console.error('Error analyzing with Groq AI:', error)
    throw error
  }
}

export async function generateDailySummary(
  tasks: Task[],
  projects: Project[]
): Promise<string> {
  try {
    const todayCompleted = tasks.filter(t => 
      t.status === 'completed' && 
      new Date(t.updated_at).toDateString() === new Date().toDateString()
    ).length

    const overdueTasks = tasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    )

    const prompt = `Generate a brief daily summary for a project manager based on this data:

Tasks completed today: ${todayCompleted}
Total tasks: ${tasks.length}
Overdue tasks: ${overdueTasks.length}
Active projects: ${projects.length}

Overdue tasks:
${overdueTasks.slice(0, 5).map(t => `- ${t.title} (Due: ${t.due_date})`).join('\n')}

Provide 2-3 actionable recommendations for today in a friendly, concise format.`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500
    })

    return completion.choices[0]?.message?.content || 'No summary available.'
  } catch (error) {
    console.error('Error generating daily summary:', error)
    return 'Unable to generate summary at this time.'
  }
}

export async function analyzeProjectHealth(
  project: Project,
  projectTasks: Task[]
): Promise<{
  healthScore: number
  risks: string[]
  recommendations: string[]
}> {
  try {
    const completedTasks = projectTasks.filter(t => t.status === 'completed').length
    const totalTasks = projectTasks.length
    const overdueTasks = projectTasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    ).length

    const prompt = `Analyze this project's health:

Project: ${project.name}
Progress: ${project.progress}%
Status: ${project.status}
Due Date: ${project.due_date || 'Not set'}
Total Tasks: ${totalTasks}
Completed Tasks: ${completedTasks}
Overdue Tasks: ${overdueTasks}

Provide analysis in this JSON format:
{
  "healthScore": 0-100,
  "risks": ["risk1", "risk2"],
  "recommendations": ["rec1", "rec2", "rec3"]
}

Return ONLY the JSON, no additional text.`

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 800
    })

    const response = completion.choices[0]?.message?.content || '{}'
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      healthScore: 50,
      risks: ['Unable to analyze'],
      recommendations: ['Please try again later']
    }

    return analysis
  } catch (error) {
    console.error('Error analyzing project health:', error)
    return {
      healthScore: 50,
      risks: ['Analysis unavailable'],
      recommendations: ['Please try again later']
    }
  }
}

