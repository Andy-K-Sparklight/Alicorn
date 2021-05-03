import { MinecraftContainer } from "../container/MinecraftContainer";
import EventEmitter from "events";
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
import { GameProfile } from "../profile/GameProfile";

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
  }
): string {
  const vmArgs = generateVMArgs(profile, container);
  const gameArgs = generateGameArgs(profile, container, authData);
  const ajArgs = policies.useAj
    ? applyAJ(whereAJ(), policies.ajHost || "", policies.ajPrefetch || "")
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
  console.log(totalArgs.join(" "));
  return runMinecraft(totalArgs, jExecutable, container, emitter);
}
