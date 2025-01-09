import {
    Evaluator,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";

export const answerEvaluator: Evaluator = {
    name: "PROCESS_ANSWER",
    alwaysRun: false,
    description: "When the answer is judged, run this evaluator to start a SEND_PAYMENT action if the score >= 80.",
    similes: ["PROCESS_REWARD", "PROCESS_SCORE"],
    examples: [
        {
            context: "When the answer is judged, run this evaluator to start a SEND_PAYMENT action if the score >= 80.",
            messages: [
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
            ],
            outcome: "Score is 100, start a SEND_PAYMENT action.",
        },
    ],
    handler: async (runtime: IAgentRuntime, memory: Memory, state: State) => {
        // Evaluation logic for the evaluator
        elizaLogger.log("Evaluating data in sampleEvaluator...");

        // Example evaluation logic
        if (memory.content && memory.content.action == "NEW_QUESTION") {
            elizaLogger.log("Important content found in memory.");
            return {
                score: 1,
                reason: "Memory contains important content.",
            };
        } else {
            elizaLogger.log("No important content found in memory.");
            return {
                score: 0,
                reason: "Memory does not contain important content.",
            };
        }
    },
    validate: async (runtime: IAgentRuntime, memory: Memory, state: State) => {
        // Validation logic for the evaluator
        return true;
    },
};
