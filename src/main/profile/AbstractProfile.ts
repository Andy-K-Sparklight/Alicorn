import {LibraryMeta, OptionalArgument} from "./Meta";

export class AbstractProfile {
    gameArgs: string[] = []
    jvmArgs: OptionalArgument[] = []
    id = ""
    baseVersion = ""
    libraries: LibraryMeta[] = []
    
}

// TODO WIP