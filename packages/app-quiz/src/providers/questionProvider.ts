import {
    Provider,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";
import {CKBFiberService, ServiceTypeCKBFiber} from "../ckb/fiber/service.ts";
import {formatChannelList, formatNodeInfo} from "../ckb/fiber/formatter.ts";

export const questionProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
        return `# Question Rewards
- Supported Rewards: 100 ~ 200 CKB or 1 ~ 5 USDI, according to the difficulty of the question.`
    },
};
