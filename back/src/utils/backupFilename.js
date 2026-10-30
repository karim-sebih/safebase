function createBackupFilename(date = new Date()) {
    return `safebase-${date.getTime()}.sql`;
}

export default createBackupFilename;