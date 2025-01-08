import { Plugin } from "@elizaos/core";
import {newQuestion} from "../actions/newQuestion";
import {answerQuestion} from "../actions/answerQuestion";

export const appQuiz: Plugin = {
    name: "app-quiz",
    description: "A quiz game",
    actions: [newQuestion, answerQuestion],
    providers: [],
    evaluators: [],
    // separate examples will be added for services and clients
    services: [],
    clients: [],
};
