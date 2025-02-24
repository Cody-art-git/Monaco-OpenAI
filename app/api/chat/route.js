// pages/api/chat.js
import OpenAI from "openai";
const openai = new OpenAI();
openai.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

export const POST = async (req) => {
    const body = await req.json();
    console.log("question: ", body.text);

    const assistant = await openai.beta.assistants.create({
        instructions: "You are a talent sales analysis. Please give me the correct result of sales analysis and use the provided functions to answer for a question.",
        tools: [
            {
                type: "function",
                function: {
                    name: "getSalesDataForAnalysis",
                    description: "Get current sales data for analysis",
                    parameters: {
                        type: "object",
                        properties: {
                            sales: {
                                type: "string",
                                description: "The sales data for summary, and analysis",
                            }
                        },
                        required: ["sales"],
                    }
                },
            }
        ],
        model: "gpt-4o"
    });


    const thread = await openai.beta.threads.create();


    const message = await openai.beta.threads.messages.create(
        thread.id,
        {
            role: "user",
            content: body.text
        }
    );


    let run = await openai.beta.threads.runs.createAndPoll(
        thread.id,
        {
            assistant_id: assistant.id,
            instructions: "Please give me the correct result of sales analysis. You should use the sales data provided. That will has object type."
        }
    );



    const handleRequiresAction = async () => {
        // Check if there are tools that require outputs
        if (
            run.required_action &&
            run.required_action.submit_tool_outputs &&
            run.required_action.submit_tool_outputs.tool_calls
        ) {
            // Loop through each tool in the required action section
            const toolOutputs = run.required_action.submit_tool_outputs.tool_calls.map(
                (tool) => {
                    if (tool.function.name === "getSalesDataForAnalysis") {
                        return {
                            tool_call_id: tool.id,
                            output: JSON.stringify(body.data),
                        };
                    }
                },
            );
            // Submit all tool outputs at once after collecting them in a list
            if (toolOutputs.length > 0) {
                run = await openai.beta.threads.runs.submitToolOutputsAndPoll(
                    thread.id,
                    run.id,
                    { tool_outputs: toolOutputs },
                );
                console.log("Tool outputs submitted successfully.");
            } else {
                console.log("No tool outputs to submit.");
            }

            return true;
        }
    };

    let data = "";

    while (true) {
        if (run.status === "completed") {
            let messages = await openai.beta.threads.messages.list(thread.id);
            // console.log(messages.data.map((item) => item.content[0].text.value));
            data = messages.data[0].content[0].text.value;
            break;
        } else if (run.status === "requires_action") {
            console.log(run.status);
            await handleRequiresAction();
        } else {
            console.error("Run did not complete:", run);
        }
    }

    return new Response(JSON.stringify({ data: data }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
