import {
    Action,
    IAgentRuntime,
    Memory,
    HandlerCallback,
    State,
    composeContext,
    generateObject,
    ModelClass,
    elizaLogger,
} from "@elizaos/core";

import { isCreateResourceContent } from "../types";

import {z} from "zod";

const schema = z.object({
    question: z.string(),
    answer: z.string(),
    reward: z.object({
        amount: z.number(),
        type: z.string(),
    }),
});

export type QuestionContent = {
    question: string;
    answer: string;
    reward: {
        amount: number;
        type: string;
    };
}

const template = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "question": "What is the capital of France?",
    "answer": "Paris",
    "reward": {
        "amount": 100,
        "type": "CKB"
    }
}
\`\`\`

{{knowledge}}

Given the knowledge, ask a question and provide the answer along with the reward amount and type.

Respond with a JSON markdown block containing only the extracted values.`

export const newQuestion: Action = {
    name: "NEW_QUESTION",
    similes: ["NEW_QUIZ", "GENERATE_QUESTION", "CREATE_QUESTION", "GENERATE_QUIZ", "CREATE_QUIZ"],
    description: "Create a new question",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        return true
    },
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        try {
            const context = composeContext({ state, template });

            const content = (await generateObject({
                runtime, context, modelClass: ModelClass.MEDIUM, schema,
            })).object as QuestionContent;

            await runtime.messageManager.createMemory({
                userId: state.agentId,
                agentId: _message.agentId,
                roomId: _message.roomId,
                content: {
                    text: `(Correct answer is: ${content.answer})`,
                    question: content
                },
                createdAt: Date.now(),
            })

            callback(
                {
                    text: `Question: ${content.question}\nReward: ${content.reward.amount} ${content.reward.type}`,
                },
                []
            );
        } catch (error) {
            elizaLogger.error("Error generating question:", error);
            callback(
                { text: "Failed to generate question. Please try again later." },
                []
            );
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a new question",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: `Question: What is the capital of France?
Reward: 100 CKB`,
                    action: "NEW_QUESTION",
                },
            }
        ]
    ],
};
