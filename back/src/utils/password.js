import * as bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Hashes a password using bcrypt
 * @param password The plain text password to hash
 * @returns Promise<string> The hashed password
 */
async function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain text password with a hashed password
 * @param password The plain text password to check
 * @param encryptedPassword The hashed password to compare against
 * @returns Promise<boolean> True if passwords match, false otherwise
 */
async function comparePassword(password, encryptedPassword) {
    return bcrypt.compare(password, encryptedPassword);
}

export { hashPassword, comparePassword };