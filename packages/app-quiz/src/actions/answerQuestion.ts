import {
    Action,
    IAgentRuntime,
    Memory,
    HandlerCallback,
    State,
    composeContext,
    generateObject,
    ModelClass,
    elizaLogger, generateText,
} from "@elizaos/core";

import { isCreateResourceContent } from "../types";

import {z} from "zod";
import {QuestionContent} from "./newQuestion";
import {aw} from "vitest/dist/chunks/reporters.D7Jzd9GS";

const schema = z.object({
    question: z.string(),
    answer: z.string(),
    correctAnswer: z.string(),
    invoice: z.string().optional().nullable(),
    score: z.number(),
});

type Content = {
    question: string;
    answer: string;
    correctAnswer: string;
    invoice?: string;
    score: number;
}

const template = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "question": "What is the capital of France?",
    "answer": "Beijing",
    "correctAnswer": "Paris",
    "invoice": "fibt100000000001p53d6ghq0axgfw0pnm6vk7l8tjrkeuqwaknxj0pq9juyuvzkyjr45flh25p0ktwjkswjaurmk0xsemmcq5pc5sztl6p6q99me0rwvyap6wd8m8thl4arfadcv9gteph8ranvt9cyc6ntf2c723khc7t9843ugktdc4htjeredgfacvkl2ljfxvw6njgvn7ww82zf7ly76cqaqnayem5cf07v9jwcqklgrzc25t35rqtm380f4hjzdm4rt5xna7ygclw0l2xcl7vs4pz5z6lwuan3e0lw985thjankl33edg74jt8ncqyadzek"
    "score": 0
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information:
- Question: The last question asked by {{agentName}}
- Answer: User's answer for the last question
- Correct Answer: The correct answer for the last question
- Invoice: User's invoice which uses to receive the reward for the last question, if not provided, set null
- Score, 0 ~ 100, judged by the agent according to the user's answer and the correct answer

Respond with a JSON markdown block containing only the extracted values.`

const responseTemplate = `
Question: {{question}}
Correct Answer: {{correctAnswer}}
User Answer: {{answer}}
Score: {{score}}

Given the question, the correct answer, the user's answer, and the score, provide a response to the user.

Example response:
Your score is 100. Congratulations, you have a great understanding of France!
`

export const answerQuestion: Action = {
    name: "ANSWER_QUESTION",
    similes: ["ANSWER_QUIZ", "ANSWER"],
    description: "Answer the previous question. The next action for NEW_QUESTION must be ANSWER_QUESTION.",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        const messages = await runtime.messageManager.getMemoriesByRoomIds({
            roomIds: [_message.roomId],
        })
        // Get the last message
        messages.sort((a, b) => b.createdAt - a.createdAt);

        console.log("messages:", messages)

        const lastQuestionMessageIdx = messages.findIndex(
            (message) => message.content.action === "NEW_QUESTION"
        );
        const lastAnswerMessageIdx = messages.findIndex(
            (message) => message.content.action === "ANSWER_QUESTION"
        );

        // If there is no question or the last answer is after the last question, return false
        if (lastQuestionMessageIdx === -1) return false
        if (lastAnswerMessageIdx !== -1 && lastAnswerMessageIdx < lastQuestionMessageIdx) return false

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
                runtime, context, modelClass: ModelClass.SMALL, schema,
            })).object as Content;

            const responseState = runtime.composeState(_message, content);

            const responseContext = composeContext({ state: responseState, template: responseTemplate });

            const text = await generateText({
                runtime, context: responseContext, modelClass: ModelClass.SMALL,
            })

            console.log("Answer content:", content)

            // If the score is greater than or equal to 80, send the payment
            if (content.score >= 80) {
                if (!content.invoice)
                    callback( { text: `${text}\nPlease provide an invoice to receive the reward.` }, [] );
                else {
                    const responses = await callback(
                        { text, action: content.score >= 80 ? "SEND_PAYMENT" : undefined },
                        []
                    );
                    runtime.processActions(_message, responses, state, callback);
                }
            } else
                callback( { text }, [] );
        } catch (error) {
            elizaLogger.error("Error judging answer:", error);
            callback(
                { text: "Failed to judge answer. Please try again later." },
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
                    action: "NEW_QUESTION",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: `Question: What is the capital of France?
Reward: 100 CKB`
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: `Beijing, fibt100000000001p53d6ghq0axgfw0pnm6vk7l8tjrkeuqwaknxj0pq9juyuvzkyjr45flh25p0ktwjkswjaurmk0xsemmcq5pc5sztl6p6q99me0rwvyap6wd8m8thl4arfadcv9gteph8ranvt9cyc6ntf2c723khc7t9843ugktdc4htjeredgfacvkl2ljfxvw6njgvn7ww82zf7ly76cqaqnayem5cf07v9jwcqklgrzc25t35rqtm380f4hjzdm4rt5xna7ygclw0l2xcl7vs4pz5z6lwuan3e0lw985thjankl33edg74jt8ncqyadzek`,
                    action: "ANSWER_QUESTION",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Your score is 0. I'm sorry, The correct answer is Paris.",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a new question",
                    action: "NEW_QUESTION",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: `Question: What is the capital of France?
Reward: 100 CKB`
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: `Paris, fibt100000000001p53d6ghq0axgfw0pnm6vk7l8tjrkeuqwaknxj0pq9juyuvzkyjr45flh25p0ktwjkswjaurmk0xsemmcq5pc5sztl6p6q99me0rwvyap6wd8m8thl4arfadcv9gteph8ranvt9cyc6ntf2c723khc7t9843ugktdc4htjeredgfacvkl2ljfxvw6njgvn7ww82zf7ly76cqaqnayem5cf07v9jwcqklgrzc25t35rqtm380f4hjzdm4rt5xna7ygclw0l2xcl7vs4pz5z6lwuan3e0lw985thjankl33edg74jt8ncqyadzek`,
                    action: "ANSWER_QUESTION",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Your score is 100. Congratulations, you have a great understanding of France.",
                },
            }
        ]
    ],
};
