import bcrypt from "bcryptjs";

const COST = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

let dummyHash: Promise<string> | undefined;

/**
 * Run a real bcrypt compare even when the e-mail is unknown, so a wrong e-mail takes as long
 * as a wrong password and the login form doesn't reveal which e-mails are registered.
 */
export async function burnPasswordCheck(password: string) {
  dummyHash ??= bcrypt.hash("scas-dummy-password", COST);
  await bcrypt.compare(password, await dummyHash);
}
