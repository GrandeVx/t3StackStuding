import { clerkClient } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";



const filterUseForClient = (user: User) => {
    return {id: user.id, name: user.username, profilePictureUrl: user.imageUrl};
}

// Create a new ratelimiter, that allows 3 rqeuests per minute
const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, "1 m"),
    analytics: true,
    prefix: "@upstash/ratelimit",
});


export const postsRouter = createTRPCRouter({

    getAll: publicProcedure.query(async ({ ctx }) => {
        
        const posts = await ctx.prisma.post.findMany({
            take: 100,
            orderBy: {
                createdAt: "desc",
            },
        });

        const users = (
            await clerkClient.users.getUserList({
            userId: posts.map((post) => post.authorid),
            limit: 100,
        })).map(filterUseForClient);

        return posts.map((post) => {

            const author = users.find((user) => user.id === post.authorid);
            
            if (!author) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Author not found",
                });
            }

            return {
                post,
                author,
            }; 
        });
    }),

    create : privateProcedure.input(z.object({
        content : z.string().emoji("Only emoji are allowed").min(1).max(100),
    })).mutation(async ({ ctx , input }) => {

        const authorId = ctx.currentUser;
        
        const { success } = await ratelimit.limit(authorId);
        
        if (!success) {
            throw new TRPCError({
                code: "TOO_MANY_REQUESTS",
                message: "Too many requests",
            });
        }

        const post = await ctx.prisma.post.create({
            data : {
                authorid : authorId,
                content : input.content,
            }   
        });
        

    }),
});
