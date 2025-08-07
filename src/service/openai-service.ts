"use server"
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

export async function handleImproveWritingOpenAI(input: string) {

    console.log(`input = ${input}`)
    const response = await client.responses.create({
        model: "gpt-4o-mini",
        instructions: 
        `
        You are a professional writing assistant.
        Improve the tone, grammar, and wording of the task description to make it more effective, actionable, and clear. Do not change the meaning or add unnecessary detail.   
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