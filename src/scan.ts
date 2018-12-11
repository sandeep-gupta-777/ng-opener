import { IFsItem } from "./interfaces";

const fs = require("fs");
const path = require("path");

const FS_ITEM_EXCLUDED_LIST = [
    ".",
    "node_modules",
    "out-tsc",
    "dist",
    "!",
    "tmp"
];

module.exports = function scan(dir: string, alias: string): IFsItem {

    const walkRes = walk(dir, alias);
    return {
        name: alias,
        type: "folder",
        path: alias,
        items: walkRes
    };
};


function walk(dir: string, prefix: string) {

    prefix = prefix || "";

    if (!fs.existsSync(dir)) {
        return [];
    }

    return fs.readdirSync(dir).filter(function (fsItemName: string) {
        return FS_ITEM_EXCLUDED_LIST.findIndex((e) => {
            return e === fsItemName || e === fsItemName[0];
        }) === -1;

    }).map(function (fsItemName: string) {

        const p = (dir + "/" + fsItemName).replace("./", ""),
            stat = fs.statSync(p);
        const completePath = path.join(prefix, p);

        if (stat.isDirectory()) {

            return {
                name: fsItemName,
                type: "folder",
                path: prefix + "/" + p,
                items: walk(p, prefix)
            };

        }

        return {
            name: fsItemName,
            type: "file",
            path: completePath,
            size: stat.size
        };

    });

}