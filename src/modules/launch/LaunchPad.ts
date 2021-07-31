import EventEmitter from "events";
import { whereAJ } from "../auth/AJHelper";
import { whereND } from "../auth/NDHelper";
import { Pair, Trio } from "../commons/Collections";
import { isNull } from "../commons/Null";
import { MinecraftContainer } from "../container/MinecraftContainer";
import { GameProfile } from "../profile/GameProfile";
import {
  applyAJ,
  applyND,
  applyResolution,
  applyServer,
  generateGameArgs,
  generateVMArgs,
} from "./ArgsGenerator";
import { runMinecraft } from "./MinecraftBootstrap";

// Launch and return ID
export function launchProfile(
  profile: GameProfile,
  container: MinecraftContainer,
  jExecutable: string,
  authData: Trio<string, string, string>,
  emitter: EventEmitter,
  policies: {
    useAj?: boolean;
    resolution?: Pair<number, number>;
    ajHost?: string;
    useServer?: boolean;
    server?: string;
    ajPrefetch?: string;
    useNd?: boolean;
    ndServerId?: string;
  }
): string {
  const vmArgs = generateVMArgs(profile, container);
  const gameArgs = generateGameArgs(profile, container, authData);
  const ajArgs = policies.useAj
    ? applyAJ(whereAJ(), policies.ajHost || "", policies.ajPrefetch || "")
    : [];
  const ndArgs = policies.useNd
    ? applyND(whereND(), policies.ndServerId || "")
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
  let totalArgs: string[];
  // I write this judge here in case of you still call ND and AJ both
  if (policies.useNd) {
    totalArgs = ndArgs
      .concat(vmArgs)
      .concat(gameArgs)
      .concat(serverArgs)
      .concat(resolutions);
  } else {
    totalArgs = ajArgs
      .concat(vmArgs)
      .concat(gameArgs)
      .concat(serverArgs)
      .concat(resolutions);
  }
  console.log(totalArgs);
  return runMinecraft(totalArgs, jExecutable, container, emitter);
}
