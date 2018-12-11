export interface IFsItem {
    name?: string;
    type?: string;
    path?: string;
    items?: IFsItem[];
    size?: number;
}

export interface IFsItemTree {
    files: IFsItem[];
    folders: IFsItem[];
}