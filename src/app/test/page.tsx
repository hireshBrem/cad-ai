"use client";
import { getJobs, removeAllJobs } from "@/lib/redis";

export default function TestPage() {

    const debug = async () => {
        // const jobs = await getJobs();
        await removeAllJobs();
        console.log('debug');
        const jobs = await getJobs();
        console.log('jobs', jobs);
    }

    return (
        <div className="">
            <h1>Test Page</h1>
            <button onClick={async () => {
                await debug();
                console.log('debug');
            }}>Get Jobs</button>
        </div>
    );
}