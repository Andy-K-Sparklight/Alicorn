import { MinecraftContainer } from "../container/MinecraftContainer";
import { loadProfile } from "../profile/ProfileLoader";
import EventEmitter from "events";
import {
  ensureAllAssets,
  ensureAssetsIndex,
  ensureLibraries,
  ensureLog4jFile,
  ensureNatives,
} from "./Ensurance";
import { runMinecraft } from "./MinecraftBootstrap";
import {
  applyAJ,
  applyResolution,
  applyServer,
  generateGameArgs,
  generateVMArgs,
} from "./ArgsGenerator";
import { Pair, Trio } from "../commons/Collections";
import { whereAJ } from "../auth/AJHelper";
import { isNull } from "../commons/Null";

export async function launchProfile(
  id: string,
  container: MinecraftContainer,
  jExecutable: string,
  authData: Trio<string, string, string>,
  // First emitter for launching, second for process
  emitter: Pair<EventEmitter, EventEmitter>,
  policies: {
    useAj?: boolean;
    resolution?: Pair<number, number>;
    ajHost?: string;
    useServer?: boolean;
    server?: string;
  }
): Promise<string> {
  // As we need tracking, we cannot use 'fillProfile'
  emitter.getFirstValue().emit(LaunchSeqSignal.PROFILE_LOADING);
  const tFile = await loadProfile(id, container);
  emitter.getFirstValue().emit(LaunchSeqSignal.LIBRARIES_FILLING);
  await ensureLibraries(tFile, container);
  await ensureNatives(tFile, container);
  await ensureLog4jFile(tFile, container); // Just resolve it with libraries
  emitter.getFirstValue().emit(LaunchSeqSignal.ASSETS_FILLING);
  await ensureAssetsIndex(tFile, container);
  await ensureAllAssets(tFile, container);
  emitter.getFirstValue().emit(LaunchSeqSignal.ARGS_GENERATING);
  const vmArgs = generateVMArgs(tFile, container);
  const gameArgs = generateGameArgs(tFile, container, authData);
  const ajArgs = policies.useAj
    ? applyAJ(whereAJ(), policies.ajHost || "")
    : [];
  const resolutions = !isNull(policies.resolution)
    ? applyResolution(
        policies.resolution?.getFirstValue(),
        policies.resolution?.getSecondValue()
      )
    : [];
  const serverArgs = policies.useServer
    ? applyServer(policies.server || "")
    : [];
  const totalArgs = ajArgs
    .concat(vmArgs)
    .concat(gameArgs)
    .concat(serverArgs)
    .concat(resolutions);
  emitter.getFirstValue().emit(LaunchSeqSignal.DONE);
  return runMinecraft(
    totalArgs,
    jExecutable,
    container,
    emitter.getSecondValue()
  );
}

enum LaunchSeqSignal {
  PROFILE_LOADING = "PROFILE_LOADING",
  LIBRARIES_FILLING = "LIBRARIES_FILLING",
  ASSETS_FILLING = "ASSETS_FILLING",
  ARGS_GENERATING = "ARGS_GENERATING",
  DONE = "DONE",
}

export { LaunchSeqSignal };
