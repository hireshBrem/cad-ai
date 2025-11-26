"use server";

// redis utils file
import { createClient } from "redis";

// Redis DB
// List of strings of job ids

export async function addJob(jobId: string) {
    const client = createClient({ url: 'redis://localhost:6379' });

    client.on('error', err => console.log('Redis Client Error', err));

    await client.connect();

    // Retrieve the jobs from the database
    const jobs = await getJobs();
    if (jobs) {
        jobs.push(jobId);
        await client.del('jobs')
        await client.rPush('jobs', jobs);
    } else {
        await client.rPush('jobs', jobId);
    }
}

export async function getJobs(): Promise<string[] | null> {
    const client = createClient({ url: 'redis://localhost:6379' });


    client.on('error', err => console.log('Redis Client Error', err));

    await client.connect();

    try {
        const jobs: string[] = await client.lRange('jobs', 0, -1);
        return jobs;
    } catch (error) {
        throw error;
    }
}

export async function removeJob(jobId: string) {
    const client = createClient({ url: 'redis://localhost:6379' });
    client.on('error', err => console.log('Redis Client Error', err));
    await client.connect();
    await client.lRem('jobs', 1, jobId);
}

export async function removeJobByIndex(index: number) {
    const client = createClient({ url: 'redis://localhost:6379' });
    client.on('error', err => console.log('Redis Client Error', err));
    await client.connect();

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
}

export async function removeAllJobs() {
    const client = createClient({ url: 'redis://localhost:6379' });

    client.on('error', err => console.log('Redis Client Error', err));

    await client.connect();

    await client.del('jobs');
}