
export const RedisKeys = {
   accessCurrent: (uid: string, deviceId: string) => `access:current:${uid}:${deviceId}`,
   refreshCurrent: (uid: string, deviceId: string) => `refresh:current:${uid}:${deviceId}`,
   devices: (uid: string) => `devices:${uid}`,
   revokedUser: (uid: string) => `revoked:user:${uid}`,
   refreshBlacklist: (hashedJti: string) => `refresh:blacklist:${hashedJti}`,
   activeSession : (uid : string , deviceId : string) => `activeSession:${uid}:${deviceId}`,
   socketDeviceRoom :(deviceId : string) => `device:${deviceId}`,
   socketUserRoom : (userId : string) => `user${userId}`,
};