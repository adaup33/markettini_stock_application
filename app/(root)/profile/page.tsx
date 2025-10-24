import {auth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import ProfileForm from "@/components/forms/ProfileForm";
import {getUserProfile} from "@/lib/actions/user.actions";

const ProfilePage = async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) redirect('/sign-in');

    const userProfile = await getUserProfile(session.user.email);

    if (!userProfile) {
        redirect('/');
    }

    return (
        <div className="flex min-h-screen flex-col p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-100">Profile</h1>
                <p className="text-gray-400 mt-2">Manage your account settings and preferences</p>
            </div>
            <ProfileForm user={userProfile} />
        </div>
    );
};

export default ProfilePage;
