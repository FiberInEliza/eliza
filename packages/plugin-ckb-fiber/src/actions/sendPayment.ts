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

import {CKBFiberService, ServiceTypeCKBFiber} from "../ckb/fiber/service.ts";
import { z } from "zod";
import {formatPayment} from "../ckb/fiber/formatter.ts";

const schema = z.object({
    invoice: z.string(),
    amount: z.string(),
    tokenType: z.string(),
});

type Content = {
    invoice: string;
    amount: number;
    tokenType: string;
}

const template = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "invoice": "fibt177000000001p53d6ghq0axgfw0pnm6vk7l8tjrkeuqwaknxj0pq9juyuvzkyjr45flh25p0ktwjkswjaurmk0xsemmcq5pc5sztl6p6q99me0rwvyap6wd8m8thl4arfadcv9gteph8ranvt9cyc6ntf2c723khc7t9843ugktdc4htjeredgfacvkl2ljfxvw6njgvn7ww82zf7ly76cqaqnayem5cf07v9jwcqklgrzc25t35rqtm380f4hjzdm4rt5xna7ygclw0l2xcl7vs4pz5z6lwuan3e0lw985thjankl33edg74jt8ncqyadzek",
    "amount": 177,
    "tokenType": "CKB",
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token transfer:
- Invoice
- Amount
- Token type (e.g., "USDI", "CKB", default to "CKB")

Respond with a JSON markdown block containing only the extracted values.`

export const sendPayment: Action = {
    name: "SEND_PAYMENT",
    similes: ["SEND_FUND", "SEND_TOKEN", "SEND_CKB", "SEND_UDT", "PAY_INVOICE"],
    description: "Send payment for a invoice",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        return false

        // if (!await runtime.getService<CKBFiberService>(ServiceTypeCKBFiber)?.checkNode())
        //     return false
        // return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        try {
            const service = runtime.getService<CKBFiberService>(ServiceTypeCKBFiber);

            // Initialize or update state
            if (!state) {
                state = await runtime.composeState(_message);
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            // Compose transfer context
            const context = composeContext({ state, template, });

            // Generate transfer content
            const content = (await generateObject({
                runtime, context, modelClass: ModelClass.SMALL, schema
            })).object as Content;

            content.tokenType = content.tokenType || "ckb";
            const udtType = content.tokenType.toLowerCase() === "ckb" ? undefined : content.tokenType.toLowerCase();

            const payment = await service.sendPayment(content.invoice, content.amount, udtType);

            return callback({ text: `Payment sent successfully!\n${formatPayment(payment)}` }, []);
        } catch (error) {
            elizaLogger.error("Error sending payment:", error);
            callback(
                { text: `Fail to send payment, message: ${error.message}` },
                []
            );
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send me 60 USDI, my invoice is: fibt600000001pp8msdlfq6gqzg7dwfhddw3x46u2xydkgzm2e37kp6dr75yakkemrxjm67xjucccgj7hz46reg9m90gvax25pgfcrerysr67fesg34zzsu895nns8g78ua6x23f3w9xjyfzwht9grq5aa2vwaz0gaaxme6dqxfypk3g02753fc0a6e4e4jx7r982qv282mutcw8zzrx3y992av365sfv2pgpschnwn5wv3lglel8x96adqemcsp9j0l2rfue2rvp9yj60320wdewqj8aln2c3dh04s30nxg0hn0vufhdj8gkcvt5h4h8gfr02k8x6rnyulnlqgt5gqzmhkchn6tcqtgk0zkglgrl0wg8ede99gv204rgsqqjge9mq07u23f7vxfcdzpm57rt72359vp0yad9pkl5ttae44vxd5rzq09m2w8rc0ydryljywvgqj2gq0d",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Okay, I'm sending...",
                    action: "SEND_PAYMENT"
                }
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I've paid the invoice.",
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 177 CKB to fibt177000000001p53d6ghq0axgfw0pnm6vk7l8tjrkeuqwaknxj0pq9juyuvzkyjr45flh25p0ktwjkswjaurmk0xsemmcq5pc5sztl6p6q99me0rwvyap6wd8m8thl4arfadcv9gteph8ranvt9cyc6ntf2c723khc7t9843ugktdc4htjeredgfacvkl2ljfxvw6njgvn7ww82zf7ly76cqaqnayem5cf07v9jwcqklgrzc25t35rqtm380f4hjzdm4rt5xna7ygclw0l2xcl7vs4pz5z6lwuan3e0lw985thjankl33edg74jt8ncqyadzek",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Okay, I'm sending...",
                    action: "SEND_PAYMENT"
                }
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "I've paid the invoice.",
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 9999 CKB to fibt177000000001p53d6ghq0axgfw0pnm6vk7l8tjrkeuqwaknxj0pq9juyuvzkyjr45flh25p0ktwjkswjaurmk0xsemmcq5pc5sztl6p6q99me0rwvyap6wd8m8thl4arfadcv9gteph8ranvt9cyc6ntf2c723khc7t9843ugktdc4htjeredgfacvkl2ljfxvw6njgvn7ww82zf7ly76cqaqnayem5cf07v9jwcqklgrzc25t35rqtm380f4hjzdm4rt5xna7ygclw0l2xcl7vs4pz5z6lwuan3e0lw985thjankl33edg74jt8ncqyadzek",
                }
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Okay, I'm sending...",
                    action: "SEND_PAYMENT"
                }
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Sorry, I can't pay for this invoice: Invoice amount does not match transfer amount: Invoice amount 177, Transfer amount 9999",
                }
            }
        ]
    ],
};
