import * as app from '.';
import { Player } from '../core';

export class Aimbot {
  player_angle : Number = 100;
  updateStates(levelName: string, localPlayer: app.core.Player, players: Iterable<app.core.Player>) {
    if (localPlayer.bleedoutState.value)
      return;
    const last_vis_time_flt: number;
    if(Player.lastVisibleTime > last_vis_time_flt || Player.lastVisibleTime < 0.f && last_vis_time_flt > 0.f))
         let x;
    else
      return;
     last_vis_time_flt = Player.lastVisibleTime;

    const closestEnemyPlayer = (levelName == "mp_rr_canyonlands_staging") ? this.createDummyPLayer() : this.findClosestEnemyPlayer(localPlayer, Array.from(players));
    if (closestEnemyPlayer == null) return;
    const enemyDistance = this.calcDistance(localPlayer, closestEnemyPlayer);
    let maxAngleDeltaRange;
    let smoothingDivisor;
    if (enemyDistance <= 600) {//200-400 is pretty much only close range
      maxAngleDeltaRange = 9;
      smoothingDivisor = 1;
    }
   
    else
      return; //no aimbot past 400
    const newViewAnglesStats: ViewAnglesStats = this.createNewViewingAnglesStats(localPlayer, closestEnemyPlayer, smoothingDivisor);
    if(this.player_angle < 25) return;
    if (newViewAnglesStats.yawDeltaAbs > maxAngleDeltaRange) return;
    if (newViewAnglesStats.pitchDeltaAbs > maxAngleDeltaRange) return;
    this.writeNewViewingUngles(localPlayer, newViewAnglesStats);
  }

  writeNewViewingUngles(localPlayer: Player, newViewAnglesStats: ViewAnglesStats) {
   
 
  // If the player was never visible the value is -1
  

 
  return 
    let nowAnglesValues = localPlayer.viewAngle.value;
    let newViewAnglesValues = new app.core.VectorData(nowAnglesValues.x - newViewAnglesStats.pitchDeltaSmoothed, nowAnglesValues.y - newViewAnglesStats.yawDeltaSmoothed, nowAnglesValues.z)
    localPlayer.viewAngle.value = newViewAnglesValues; // cause update event
  }

  createNewViewingAnglesStats(localPlayer: Player, closestEnemyPlayer: Player, smoothingDivisor: number): ViewAnglesStats {
    const newViewingAngles: ViewingAngles = this.calcViewAnglesToTarget(localPlayer, closestEnemyPlayer);
    if(this.player_angle < 25)
      return {
        currentYaw: 0,
        desiredYaw: 0,
        yawDelta: 0,
        yawDeltaAbs: 0,
        yawDeltaSmoothed: 0,
        flipYaw: false,
        currentPitch: 0,
        desiredPitch: 0,
        pitchDelta: 0,
        pitchDeltaAbs: 0,
        pitchDeltaSmoothed: 0,
      };
    const currentYaw: number = localPlayer.viewAngle.value.y;
    const desiredYaw: number = newViewingAngles.yaw;
    const yawDelta: number = this.calcYawDeltaAndFlipIfNeeded(currentYaw, desiredYaw);
    const yawDeltaAbs: number = Math.abs(yawDelta);
    const yawDeltaSmoothed: number = yawDelta / smoothingDivisor;
    const flipYaw: boolean = localPlayer.localOrigin.value.y < closestEnemyPlayer.localOrigin.value.y;
    const currentPitch: number = localPlayer.viewAngle.value.x;
    const desiredPitch: number = newViewingAngles.pitch;
    const pitchDelta: number = currentPitch - desiredPitch;
    const pitchDeltaAbs: number = Math.abs(pitchDelta);
    const pitchDeltaSmoothed: number = pitchDelta / smoothingDivisor;
    return {
      currentYaw: currentYaw,
      desiredYaw: desiredYaw,
      yawDelta: yawDelta,
      yawDeltaAbs: yawDeltaAbs,
      yawDeltaSmoothed: yawDeltaSmoothed,
      flipYaw: flipYaw,
      currentPitch: currentPitch,
      desiredPitch: desiredPitch,
      pitchDelta: pitchDelta,
      pitchDeltaAbs: pitchDeltaAbs,
      pitchDeltaSmoothed: pitchDeltaSmoothed,
    }
  }

  calcYawDeltaAndFlipIfNeeded(currentYaw: number, desiredYaw: number) {
    let delta = currentYaw - desiredYaw;
    if (Math.abs(delta) > 180) {
      if (currentYaw > 0 && desiredYaw < 0)
        delta -= 360;
      if (currentYaw < 0 && desiredYaw > 0) {
        delta = 180 - Math.abs(currentYaw) + 180 - Math.abs(desiredYaw);
      }
    }
    return delta;
  }

  calcViewAnglesToTarget(localPlayer: Player, enemyPlayer: Player): ViewingAngles {
    const locationDeltaX: number = enemyPlayer.localOrigin.value.x - localPlayer.localOrigin.value.x;
    const locationDeltaY: number = enemyPlayer.localOrigin.value.y - localPlayer.localOrigin.value.y;
    const locationDeltaZ: number = enemyPlayer.localOrigin.value.z - localPlayer.localOrigin.value.z;
    const hypotenus = Math.sqrt(Math.pow(Math.abs(locationDeltaX), 2) + Math.pow(Math.abs(locationDeltaY), 2));
    this.player_angle = hypotenus;

    const yawInRadians = Math.atan2(locationDeltaY, locationDeltaX);
    const yawInDegrees = yawInRadians * (180 / Math.PI);
    let roundedYaw = Number(yawInDegrees.toFixed(9));
    if (Math.abs(roundedYaw) > 180)
      roundedYaw = 180.00;

    const pitchInRadians = Math.atan(locationDeltaZ / -hypotenus);
    const pitchInDegrees: number = pitchInRadians * (180 / Math.PI);
    let roundedPitch = Number(pitchInDegrees.toFixed(9));
    if (Math.abs(roundedPitch) > 90)
      roundedPitch = 90.00;

    return { pitch: roundedPitch, yaw: roundedYaw };
  }

  findClosestEnemyPlayer(localPlayer: Player, players: Array<Player>): Player | null {
    // const curTime = (performance.timeOrigin + performance.now()) / 1000;
    const enemyPlayers = players.filter(p => { return !p.isSameTeam(localPlayer) && !p.bleedoutState.value && p.isValid });
    if (enemyPlayers.length == 0)
      return null;
    let closesTargetSoFar: Player = enemyPlayers[0];
    let closesTargetSoFarDistance = this.calcDistance(localPlayer, closesTargetSoFar);
    for (let i: number = 1; i < enemyPlayers.length; i++) {
      const currEP = enemyPlayers[i];
      const currEPDistance = this.calcDistance(localPlayer, currEP);
      if (currEPDistance < closesTargetSoFarDistance) {
        closesTargetSoFar = currEP;
        closesTargetSoFarDistance = currEPDistance;
      }
    }
    return closesTargetSoFar;
  }

  createDummyPLayer(): any {
    return { localOrigin: { value: { x: 31524.71875, y: -6710.02197265625, z: -29235.982421875 } } };
  }

  calcDistance(playerA: Player, playerB: Player) {
    const dx: number = playerA.localOrigin.value.x - playerB.localOrigin.value.x;
    const dy: number = playerA.localOrigin.value.y - playerB.localOrigin.value.y;
    const dz: number = playerA.localOrigin.value.z - playerB.localOrigin.value.z;
    const distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2));
    return distance;
  }



}

interface ViewingAngles {
  yaw: number;
  pitch: number;
}

interface ViewAnglesStats {
  currentYaw: number;
  desiredYaw: number;
  yawDelta: number;
  yawDeltaAbs: number;
  yawDeltaSmoothed: number;
  flipYaw: boolean;
  currentPitch: number;
  desiredPitch: number;
  pitchDelta: number;
  pitchDeltaAbs: number;
  pitchDeltaSmoothed: number;
}

