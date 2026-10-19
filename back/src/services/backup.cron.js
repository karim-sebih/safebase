import cron from 'node-cron';
import { backupDatabase } from './backup.service.js';

cron.schedule('0 8 * * 1', async () => {
    try {
        const backupPath = await backupDatabase();
        console.log(`Backup created successfully at: ${backupPath}`);
    } catch (error) {
        console.error('Error creating backup:', error);
    }
});