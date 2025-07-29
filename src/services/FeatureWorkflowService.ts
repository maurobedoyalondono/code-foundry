import { claudeCodeClient } from './ClaudeCodeClientService'

export interface FeatureWorkflowState {
  id: string
  featureName: string
  currentStep: 'idea' | 'user-stories' | 'design' | 'plan' | 'implementation' | 'completed'
  idea?: string
  userStories?: string
  design?: string
  plan?: string
  folderPath?: string
  questions: string[]
  answers: string[]
}

export class FeatureWorkflowService {
  private workflowStates: Map<string, FeatureWorkflowState> = new Map()
  private specsBasePath = '/home/negrito/src/projects/code-foundry/specs'

  async startFeatureWorkflow(sessionId: string, initialIdea: string): Promise<{
    questions: string[]
    state: FeatureWorkflowState
  }> {
    // Generate questions to clarify the idea
    const questionsPrompt = `I have an idea for a new feature in an industrial automation IDE:

"${initialIdea}"

As an expert in industrial automation and software development, ask me 3-5 clarifying questions to better understand:
1. The specific requirements and use cases
2. Technical constraints or preferences
3. Integration points with existing systems
4. Expected outcomes and success criteria
5. Any safety or compliance considerations

Format your response as a numbered list of questions only.`

    const response = await claudeCodeClient.sendMessage(questionsPrompt, {
      mode: 'conversation'
    })

    const questions = response.finalMessage?.split('\n')
      .filter(line => line.trim())
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.trim()) || []

    const state: FeatureWorkflowState = {
      id: sessionId,
      featureName: this.extractFeatureName(initialIdea),
      currentStep: 'idea',
      idea: initialIdea,
      questions,
      answers: []
    }

    this.workflowStates.set(sessionId, state)
    return { questions, state }
  }

  async processAnswers(sessionId: string, answers: string[]): Promise<{
    clarifiedIdea: string
    nextStep: string
  }> {
    const state = this.workflowStates.get(sessionId)
    if (!state) throw new Error('Workflow state not found')

    state.answers = answers

    // Create clarified idea based on Q&A
    const clarifyPrompt = `Based on this industrial automation IDE feature idea and the Q&A below, create a clear, comprehensive feature description.

Original idea: "${state.idea}"

Questions and Answers:
${state.questions.map((q, i) => `${q}\nAnswer: ${answers[i] || 'Not answered'}`).join('\n\n')}

Create a clear, concise feature description (2-3 paragraphs) that incorporates all the clarifications.`

    const response = await claudeCodeClient.sendMessage(clarifyPrompt, {
      mode: 'conversation'
    })

    const clarifiedIdea = response.finalMessage || state.idea || ''
    
    // Update state
    state.idea = clarifiedIdea
    state.currentStep = 'user-stories'
    
    // Create feature folder
    const folderName = this.sanitizeFolderName(state.featureName)
    state.folderPath = `${this.specsBasePath}/${folderName}`
    
    return {
      clarifiedIdea,
      nextStep: 'user-stories'
    }
  }

  async generateUserStories(sessionId: string): Promise<string> {
    const state = this.workflowStates.get(sessionId)
    if (!state || !state.idea) throw new Error('Workflow state not found or idea missing')

    const prompt = `Create user stories for this industrial automation IDE feature:

${state.idea}

Follow this format:
- Write 5-10 user stories
- Use the standard format: "As a [role], I want to [action], So that [benefit]"
- Include acceptance criteria for each story
- Consider different user roles (control engineer, maintenance tech, operator, etc.)
- Address safety and compliance where relevant

Reference the format used in: /home/negrito/src/projects/code-foundry/specs/BASE/user-stories.md`

    const response = await claudeCodeClient.sendMessage(prompt, {
      mode: 'feature'
    })

    const userStories = response.finalMessage || ''
    state.userStories = userStories
    state.currentStep = 'design'

    // Save to file
    await this.saveSpecFile(state, 'user-stories.md', userStories)

    return userStories
  }

  async generateDesign(sessionId: string): Promise<string> {
    const state = this.workflowStates.get(sessionId)
    if (!state || !state.userStories) throw new Error('Workflow state not found or user stories missing')

    const prompt = `Create a technical design document for this industrial automation IDE feature.

Feature Description:
${state.idea}

User Stories:
${state.userStories}

Create a technical design following the structure in /home/negrito/src/projects/code-foundry/specs/BASE/design.md:
- Architecture Overview
- Data Models (TypeScript interfaces)
- Component Architecture
- State Management
- Services Architecture
- File System Structure
- SCSS Design System considerations
- Key Technical Decisions
- Performance Considerations
- Security Measures

Focus on:
- 7+1 Clean Architecture
- SCSS-only styling (no Tailwind)
- Zustand state management
- Industrial automation standards (IEC 61131-3)
- Integration with existing codebase`

    const response = await claudeCodeClient.sendMessage(prompt, {
      mode: 'feature'
    })

    const design = response.finalMessage || ''
    state.design = design
    state.currentStep = 'plan'

    // Save to file
    await this.saveSpecFile(state, 'design.md', design)

    return design
  }

  async generatePlan(sessionId: string): Promise<string> {
    const state = this.workflowStates.get(sessionId)
    if (!state || !state.design) throw new Error('Workflow state not found or design missing')

    const prompt = `Create a step-by-step implementation plan for this industrial automation IDE feature.

Feature Description:
${state.idea}

Technical Design Summary:
${state.design.substring(0, 1000)}...

Create an implementation plan following the format in /home/negrito/src/projects/code-foundry/specs/BASE/plan.md:
- Break down into phases and steps
- Each step should have clear actions
- Include checkboxes for tracking progress
- Add build/test commands after each major step
- Consider the existing codebase structure
- Follow the pattern of manual file creation before npm install

Format:
### Phase X: [Phase Name]
#### Step X: [Step Name]
- [ ] Action item 1
- [ ] Action item 2
- [ ] Run: npm run build
- [ ] Run: npm run type-check`

    const response = await claudeCodeClient.sendMessage(prompt, {
      mode: 'feature'
    })

    const plan = response.finalMessage || ''
    state.plan = plan
    state.currentStep = 'implementation'

    // Save all spec files
    if (state.idea) {
      await this.saveSpecFile(state, 'idea.md', state.idea)
    }
    await this.saveSpecFile(state, 'plan.md', plan)

    return plan
  }

  async saveSpecFile(state: FeatureWorkflowState, filename: string, content: string): Promise<void> {
    if (!state.featureName) return

    try {
      const response = await globalThis.fetch('/api/feature-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          featureName: state.featureName,
          filename,
          content
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        if (typeof globalThis.console !== 'undefined') {
          globalThis.console.error(`Error saving spec file ${filename}:`, error)
        }
      } else {
        const result = await response.json()
        // Update state with the actual path
        state.folderPath = result.path
      }
    } catch (error) {
      if (typeof globalThis.console !== 'undefined') {
        globalThis.console.error(`Error saving spec file ${filename}:`, error)
      }
    }
  }

  getWorkflowState(sessionId: string): FeatureWorkflowState | undefined {
    return this.workflowStates.get(sessionId)
  }

  private extractFeatureName(idea: string): string {
    // Extract a feature name from the idea (first few words)
    const words = idea.split(' ').slice(0, 5).join(' ')
    return words.length > 30 ? words.substring(0, 30) + '...' : words
  }

  private sanitizeFolderName(name: string): string {
    // Convert to uppercase with hyphens, remove special chars
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
  }
}

export const featureWorkflowService = new FeatureWorkflowService()