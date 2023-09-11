import { SignInButton, UserButton, useUser} from "@clerk/nextjs"

export default function Navbar() {

    const user = useUser();


    return (
        <nav className="flex flex-row justify-between p-3 pr-5 pl-5 items-center">
            <h1 className="text-lg font-semibold">Expensive</h1>

            {
                user.isSignedIn ? (
                    <UserButton />
                ) : (
                    <div className="bg-blue-400 text-white rounded-full text-md font-medium pl-3 pr-3 p-2">
                        <SignInButton/>
                    </div>
                )
            }


        </nav>
    )
}