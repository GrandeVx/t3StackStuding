import { clerkClient } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const filterUseForClient = (user: User) => {
    return {id: user.id, name: user.username, profilePictureUrl: user.imageUrl};
}


export const postsRouter = createTRPCRouter({

    getAll: publicProcedure.query(async ({ ctx }) => {
        const posts = await ctx.prisma.post.findMany({
            take: 100,
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
});
