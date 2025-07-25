# SPECS FLOW

This repository is meant to create features from idea to full implementation.

## INPUTS

1. Idea
2. Spec Folder

### IDEA

User starts with an idea, AI receives it, does not make assumptions,ask as many questions as necessary

### SPECS FOLDER

AI uses specs folder to store .md files to the feature

## OUTPUTS

### USER-STORIES

AI generates user stories from the clarified idea and saves it to USER-STOREIS.md

### TECH DESIGN

AI reviews systems involved (web, api, infrastructure (this contains database schemas)), reviews current components and architecture, 
reviews CLAUDE.md of each system to understand its core principles. Also reads README.md to get up to SPEED.

AI asks if there is any reference feature or implementation

AI creates DESIGN.md with models, files, database (tables, colums, indexes, etc) to be created/modified.

### PLAN

AI generates a STEP BY STEP plan to complete the feature.
This is a sample PLAN: /home/negrito/src/projects/Museo/specs/FEATURES/general/AUTH-STABILIZATION/PLAN.md

PLAN CONTAINS:

- STEPS TO CREATE THE SYSTEM BY PARTS
- Actions to complete each steps
- Check Marks so there is control of what is done
- Needs to run "npm run build" or what applies to the specific system to verify code is not broken after step is implemented

- PLANS CAN RUN from start to end with or without user confirmation after each step, ask before the execution

## SUMARY

- User gives idea and folder
- AI asks questions to clarify the idea
- AI creates user stories
- User approves it
- AI creates design after deeply reviewing the system (NEED to review README.md to get up to speed)
- User approves it
- AI creates the plan
- User approves it
- AI starts the implementation, ask if this is a one go of needs to stop after each step.

- AFTER EACH STEP - AI MUST UPDATE PROGRESS AND RUN "npm run build", "npm run type-check", and "npm run lint" to verify the code compiles correctly, when it applies.
- IF ERRORS: They must be solved before moving to next STEP - You need to cycle: fix, check, fix, check

- FOR STYLES, this is key: You need to review full /styles: variables, mixins, etc and used them