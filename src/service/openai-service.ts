"use server"
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

export async function handleImproveWritingOpenAI(input: string) {
    const response = await client.responses.create({
        model: "gpt-4o-mini",
        instructions:
            `
        You are a professional writing assistant.
        Improve the tone, grammar, and wording of the task description to make it more effective, 
        actionable, and clear. Do not change the meaning or add unnecessary detail.   
        `,
        input: input,
    });

    return response.output_text;
}

export async function handleMakeLongerOpenAI(input: string) {
    const response = await client.responses.create({
        model: "gpt-4o-mini",
        instructions: `
        Act like a professional task manager. Your role is to help provide longer task descriptions for the users. Ensure not to change the original meaning, or make it more than what it needs to be. Ensure not to missspell any words.
        `,
        input: input,
    });

    return response.output_text;
}

export async function handleMakeShorterOpenAI(input: string) {
    const response = await client.responses.create({
        model: "gpt-4o-mini",
        instructions:
            `
        You are a writing assistant helping users shorten their task descriptions.
        Rewrite the following task in a more concise, clear, and impactful way without losing essential information.

        For eg. 
        input: "Complete all assigned tasks from the project backlog by Friday at 5 PM, prioritizing critical bugs and client-facing issues, and track progress in the task board."
        output: "Complete all tasks by Friday"

        input: "Prepare a healthy dinner (grilled chicken, vegetables, and rice) by 7:00 PM today for two people, ensuring all ingredients are ready and the kitchen is cleaned afterward."
        output: "Prepare dinner by 7:00 PM"
        `,
        input: input,
    });

    return response.output_text;
}

export async function handleMakeSMARTOpenAI(input: string) {
    const response = await client.responses.create({
        model: "gpt-4o-mini",
        instructions: `
        You are a productivity coach assistant.

        Transform the following task description into a SMART goal. It should be:
        - Specific
        - Measurable
        - Achievable
        - Relevant
        - Time-bound

        Make sure to retain the intent but rewrite it with clarity and structure.

        For eg. 
        input: "Get all the tasks done"
        output: "Complete all assigned tasks from the project backlog by Friday at 5 PM, prioritizing critical bugs and client-facing issues, and track progress in the task board."

        input: "Cook dinner"
        output: "Prepare a healthy dinner (grilled chicken, vegetables, and rice) by 7:00 PM today for two people, ensuring all ingredients are ready and the kitchen is cleaned afterward."
        `,
        input: input,
    });

    return response.output_text;
}


export async function handleMakeSMARTDescriptoinOpenAI(input: string) {

    const response = await client.responses.create({
        model: "gpt-4o-mini",
        instructions: `
        You are a productivity coach assistant.

Task:
- Transform the provided task description into a SMART goal (Specific, Measurable, Achievable, Relevant, Time-bound).
- Keep the original intent but rewrite it with clarity, structure, and a concrete deadline or timeframe.

Output requirements:
- Return **only** an HTML fragment (no explanatory text, no markdown, no surrounding commentary).
- Fill the placeholders with concise, user-friendly sentences.
- Keep the HTML minimal and valid. Do not include inline scripts or styles.

Examples:

Input: "<p>Get all the tasks done</p>"
Output (HTML only):
<div>
  <p>Complete all assigned tasks from the project backlog by Friday at 5 PM, prioritizing critical bugs and client-facing issues, and track progress in the task board.</p>
  <ul>
    <li><strong>Specific:</strong> Finish every assigned backlog item, with priority on critical bugs and client-facing work.</li>
    <li><strong>Measurable:</strong> All assigned tickets show status "Done" in the board; zero critical bugs remain.</li>
    <li><strong>Achievable:</strong> Workload fits the team’s capacity this sprint.</li>
    <li><strong>Relevant:</strong> Addresses release readiness and client commitments.</li>
    <li><strong>Time-bound:</strong> By Friday at 5 PM this week.</li>
  </ul>
</div>

Input: "Cook dinner"
Output (HTML only):
<div>
  <p>Prepare a healthy dinner (grilled chicken, vegetables, and rice) for two people by 7:00 PM tonight, with ingredients ready and the kitchen cleaned afterward.</p>
  <ul>
    <li><strong>Specific:</strong> Grill chicken, roast vegetables, cook rice, serve for two.</li>
    <li><strong>Measurable:</strong> Meal plated and served by 7:00 PM; kitchen cleaned within 30 minutes after serving.</li>
    <li><strong>Achievable:</strong> Ingredients are on hand and recipe takes ~45 minutes.</li>
    <li><strong>Relevant:</strong> Supports healthy eating and planned family meal.</li>
    <li><strong>Time-bound:</strong> By 7:00 PM tonight.</li>
  </ul>
</div>
        `,
        input: input,
    });
    return response.output_text;
}

export async function handleImproveWritingDescriptionOpenAI(input: string) {
    const response = await client.responses.create({
        model: "gpt-4o-mini",
        instructions: `
       You are a professional writing assistant.

Task:
- Improve the tone, grammar, and wording of the provided task description to make it more effective, actionable, and clear.
- Do NOT change the original meaning or add unnecessary details.
- Keep the result concise and ready to paste into a task field.

    Output requirements:
    - Return **only** an HTML fragment (no extra commentary, no markdown).
    - Replace the placeholder with the improved version of the task.
    - Keep HTML minimal and valid. Do not include inline styles, scripts, or any content outside the 
    <div>...</div>

    Example:
    Input: "Get all the tasks done"
    Output (HTML only):
    <div>
    <p>Complete all assigned backlog tasks by Friday at 5 PM, prioritizing critical bugs and client-facing items, and update each ticket's status on the board.</p>
    </div>
        `,
        input: input,
    });

    return response.output_text;
}


// handle make longer description

export async function handleMakeLongerDescriptionOpenAI(input: string) {
    const response = await client.responses.create({
        model: "gpt-4o-mini",
        instructions: `
        You are a professional task manager assistant.

Role:
- Expand the provided task description into a slightly longer, clearer, and more actionable description.
- Do NOT change the original meaning, add unnecessary details, or exceed what is needed.
- Do NOT introduce spelling mistakes.

Output rules:
- Return **only** an HTML fragment (no commentary, no markdown, no extra text).
- The HTML must **not** include any class attributes.
- Keep the expanded description concise — add clarity and useful detail only when it directly helps make the task actionable.
- Preserve any core constraints or deadlines from the original text.
- Use correct grammar and spelling.

Examples:
    Input: "Cook dinner"
    Output:
    <div>
    <h3>Task</h3>
    <p>Prepare a healthy dinner for two by 7:00 PM today, including a protein, a vegetable side, and a grain; ensure ingredients are ready before cooking and clean the kitchen after serving.</p>
    </div>

    Input: "Get all the tasks done"
    Output:
    <div>
    <h3>Task</h3>
    <p>Complete all assigned tasks from the current backlog by Friday at 5 PM, prioritizing critical bugs and client-facing items, and update each ticket's status on the board when finished.</p>
    </div>
        `,
        input: input,
    });

    return response.output_text;
}

// handle make shorter description
export async function handleMakeShorterDescriptionOpenAI(input: string) {
    const response = await client.responses.create({
        model: "gpt-4o-mini",
        instructions: `
        
        You are a professional writing assistant.

Task:
- Make the provided task description shorter and more concise.
- Do NOT change the original meaning or add any unnecessary details.
- Preserve grammar, punctuation, and correct spelling.

Output rules:
- Return **only** an HTML fragment (no commentary, no markdown, no extra text).
- The HTML must **not** include any class attributes.
- Keep the output concise — reduce wordiness while retaining the full intent.
- Do not invent deadlines or requirements that are not present in the original text.
- If the original text already is concise, return a cleaned-up, equally short version.

    Examples:

    Input: "Get all the tasks done"
    Output:
    <div>
        <h3>Task</h3>
        <p>Complete all assigned backlog tasks and update their status on the board.</p>
    </div>

    Input: "Cook dinner"
    Output:
    <div>
        <p>Prepare dinner for two, including a protein, a vegetable, and a grain.</p>
    </div>
    `,
        input: input,
    });

    return response.output_text;
}

export async function handleMakeSoftwareTicketDescriptionOpenAI(input: string) {
    try {
        const response = await client.responses.create({
            model: "gpt-4o-mini",
            temperature: 0.5,
            input: [
                {
                    role: "system",
                    content: `
Act as a technical lead, product manager, or project manager.
Your task is to create a detailed software ticket based on the user's provided input. Adhere to the following rules:

**Content Rules:**
* Preserve the original meaning, grammar, punctuation, and spelling.
* Do not add any unnecessary details.
* Do not invent deadlines, dependencies, or acceptance criteria that are not present in the user's input.
* Reduce wordiness while retaining the full intent of the provided text.

**Ticket Structure:**
* **Feature Description:**
    * **Summary:** A concise summary of the feature.
    * **Problem/User Need:** An easy-to-read description of the user need.
    * **Proposed Solution:** A list of the required components (e.g., Full Name (text field), Email Address (text field with validation)).
* **Requirements & Specifications:**
    * **Dependencies:** List all identified dependencies.
    * **Acceptance Criteria:** List all identified and appropriate acceptance criteria.

**Output Rules:**
* Return **only** a single HTML fragment.
* The HTML must **not** contain any class attributes.
* Do not include any commentary, markdown, or extra text.
* Always return the software ticket struture. 
* Always ensure the each section is filled with the correct information.
                    `
                },
                {
                    role: "user",
                    content: input,
                }
            ],
        });

        // The generated content is now located in the response.output_text property
        return response.output_text;
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        // You might want to handle this error more gracefully in a real application
        return "An error occurred while generating the software ticket.";
    }
}