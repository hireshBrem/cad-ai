"use server";

// redis utils file
import { createClient } from "redis";

const getRedisClient = () => {
    const { REDIS_URL } = process.env
    console.log('REDIS_URL', REDIS_URL);
    if (!REDIS_URL) {
        console.log('REDIS_URL is not set');
        // throw new Error('REDIS_URL is not set');

    }
    return createClient({ url: REDIS_URL, socket: { connectTimeout: 10000 } });
}

const client = getRedisClient();

client.on('error', err => console.log('Redis Client Error', err));
client.connect();
// console.log('ping', await client.ping())

export async function addJob(jobId: string) {
    // Retrieve the jobs from the database
    const jobs = await getJobs();
    if (jobs) {
        jobs.push(jobId);
        await client.del('jobs')
        await client.rPush('jobs', jobs);
    } else {
        await client.rPush('jobs', jobId);
    }
    await client.quit();

}

export async function getJobs(): Promise<string[] | null> {

    try {
        const jobs: string[] = await client.lRange('jobs', 0, -1);
        console.log('jobs', jobs);
        return jobs;
    } catch (error) {
        throw error;
    } finally {
        await client.quit();
    }
}

export async function removeJob(jobId: string) {
    await client.lRem('jobs', 1, jobId);
    await client.quit();
}

export async function removeJobByIndex(index: number) {
    try {
        const jobs: string[] = await client.lRange('jobs', 0, -1);

        if (index < 0 || index >= jobs.length) {
            return;
        }

        jobs.splice(index, 1);
        await client.del('jobs');
        if (jobs.length > 0) {
            await client.rPush('jobs', jobs);
        }
    } catch (error) {
        throw error;
    }
    await client.quit();
}

export async function removeAllJobs() {
    await client.del('jobs');
    await client.quit();
}