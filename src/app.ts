#!/usr/bin/env node
import { IFsItem, IFsItemTree } from "./interfaces";
import { Request, Response } from "express";

const path = require("path");
const cors = require("cors");
const tcpPortUsed = require("tcp-port-used");
const express = require("express");
const url = require("url");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const scan = require("./scan");
const writeTemplate = require("./template");
const LOCALHOST = "127.0.0.1";
const program = require("commander");
const root = process.cwd();
const tree = scan(root, "");
const app = express();


let folders: IFsItem[] = [], files: IFsItem[] = [];
program
    .option("-p, --port <port>", "Port on which to listen to (defaults to 11637)", parseInt)
    .option("--ctrl <ctrl>", "Enable click ctrl press along with doubleclick")
    .parse(process.argv);


let port: number = program.port || 11637;
let ctrl = program.ctrl || "n";
if (!(ctrl === "y" || ctrl === "yes" || ctrl === "n" || ctrl === "no")) {
    throw new Error("ERROR: ctrl can only have: y, yes, n, no");
}
ctrl = ctrl === "y" || ctrl === "yes";


app.use(cors());
app.use("/", express.static(path.join(__dirname, "public")));
app.get("/scan", function (req: Request, res: Response) {
    res.send(tree);
});
app.get("/open", function (req: Request, res: Response) {
    const url_parts = url.parse(req.url, true);
    const file = url_parts.query.file.toLowerCase();
    let pathToBeOpened;
    const searchTerm = file.replace("app-", "");

    try {
        files = folders = [];
        const foundItems = searchData(tree.items, searchTerm);
        if (!(foundItems && foundItems.files && foundItems.files.length > 0)) throw new Error('"no matching files found"');
        const exactMatchIndex = exactMatchedFileIndex(foundItems, searchTerm);
        pathToBeOpened = exactMatchIndex !== -1 ? foundItems.files[exactMatchIndex].path : foundItems.files[0].path;
        openInVScode(pathToBeOpened)
            .then(() => {
                res.status(200).json("ng-bubble: success");
            });
    } catch (e) {
        console.error(e);
        res.status(422).send(e);
    }
});


function exactMatchedFileIndex(foundItems: IFsItemTree, searchTerm: string) {
    const angularSuffix = ".component.html";
    const ionicSuffix = ".page.html";
    return foundItems.files.findIndex((file) => file.name === searchTerm + angularSuffix || file.name === searchTerm + ionicSuffix);
}

async function openInVScode(path: string) {
    return await exec(`code -r ${path}`);
}

function searchData(data: IFsItem[], searchTerms: string) {
    for (const d of data) {
        // data.forEach(function (d) {
        if (d.type === "folder") {
            if (d.name === "onboarding") {
                console.log("asdas");
            }
            searchData(d.items, searchTerms);
            if (d.name.toLowerCase().match(searchTerms)) {
                folders.push(d);
            }
        }
        else if (d.type === "file") {
            console.log(d.name.toLowerCase(), searchTerms.toLowerCase());
            if (d.name.toLowerCase().match(searchTerms)) {
                files.push(d);
            }
        }
    }
    return {folders: folders, files: files};
}

async function runAppOnFreePort() {

    let inUse = await tcpPortUsed.check(port, LOCALHOST);
    while (inUse) {
        console.log(`Port ${port} is in use, trying ${port + 1}`);
        inUse = await tcpPortUsed.check(++port, LOCALHOST);
    }
    writeTemplate(port, ctrl);
    return new Promise((resolve, reject) => {
        app.listen(port, function (err: any) {
            err ? reject() : resolve();
        });
    });

}

runAppOnFreePort()
    .then(() => {
        console.log("ng-bubble is Running on port " + port);
        console.log("Please make sure to add following script into your index.html");
        console.log(`
        <script async src="http://localhost:${port}/assets/js/client.js"></script>
    `);
    });


export default app;