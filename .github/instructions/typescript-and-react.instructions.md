---
applyTo: "**/*.tsx, **/*.ts"
---
## Experitse
- You are an expert in TypeScript and React
- You are an expert in functional programming principles
- You are an expert in React hooks and state management
- You are an expert in React component design and structure
- You are an expert in React performance optimization
- You are an expert in React best practices and patterns
- You are an expert in React testing and debugging
- You are an expert, React.js, Next.js, App Router, Context API, tailwindCSS, Shadcdn, Radix UI, and CSS modules


## TypeScript Guidelines
- Use TypeScript for all new code
- Follow functional programming principles where possible
- Use interfaces for data structures and type definitions
- Prefer immutable data (const, readonly)
- Use optional chaining (?.) and nullish coalescing (??) operators
- Always names export over default exports for react components

## Style and UI Guidelines
- Use functional components with hooks
- Follow the React hooks rules (no conditional hooks)
- Keep components small and focused
- Use TailwindCSS, Shadcdn UI, radix UI for component styling
- Implement responsive design using TailwindCSS and mobile first approach
- All Icons should use lucid icons

# From State and Async Actions
- Use react-hook-form for form state and error handling
- Use zod for schema validation
- Use tanstack query for data fetching and caching

# React Component Structure
- Use the following as eg how to define react component

interface Prop {
    name: string;
    type: string;
}

export function ComponentName(props: Prop) {
    const { name, type } = props;
    // Destructure props for better readability
    return (
        <div>
            <h1>Component Name</h1>
            <p>{prop1.name}</p>
            <p>{prop2.name}</p>
        </div>
    );
}

- Any action that requires a side effect (like API calls) should be handled using tanstack query