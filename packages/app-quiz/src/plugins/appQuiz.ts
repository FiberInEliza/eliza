// import { Plugin } from "@elizaos/core";
import {newQuestion} from "../actions/newQuestion";
import {answerQuestion} from "../actions/answerQuestion";
import {questionProvider} from "../providers/questionProvider";

export const appQuiz = {
    name: "app-quiz",
    description: "A quiz game",
    actions: [newQuestion, answerQuestion],
    providers: [questionProvider],
    evaluators: [],
    // separate examples will be added for services and clients
    services: [],
    clients: [],
};
