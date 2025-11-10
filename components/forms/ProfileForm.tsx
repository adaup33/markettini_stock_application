'use client';

import {useForm} from "react-hook-form";
import {Button} from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import {INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS} from "@/lib/constants";
import {CountrySelectField} from "@/components/forms/CountrySelectField";
import {toast} from "sonner";
import {updateUserProfile} from "@/lib/actions/user.actions";
import {useRouter} from "next/navigation";

type ProfileFormData = {
    name: string;
    email: string;
    country: string;
    investmentGoals: string;
    riskTolerance: string;
    preferredIndustry: string;
};

type ProfileFormProps = {
    user: {
        id: string;
        email: string;
        name: string;
        country: string;
        investmentGoals: string;
        riskTolerance: string;
        preferredIndustry: string;
    };
};

const ProfileForm = ({ user }: ProfileFormProps) => {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<ProfileFormData>({
        defaultValues: {
            name: user.name,
            email: user.email,
            country: user.country || 'US',
            investmentGoals: user.investmentGoals || 'Growth',
            riskTolerance: user.riskTolerance || 'Medium',
            preferredIndustry: user.preferredIndustry || 'Technology'
        },
        mode: 'onBlur'
    });

    const onSubmit = async (data: ProfileFormData) => {
        try {
            const result = await updateUserProfile(user.email, {
                name: data.name,
                country: data.country,
                investmentGoals: data.investmentGoals,
                riskTolerance: data.riskTolerance,
                preferredIndustry: data.preferredIndustry,
            });
            
            if (result.success) {
                toast.success('Profile updated successfully');
                router.refresh();
            } else {
                toast.error('Failed to update profile', {
                    description: result.error
                });
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to update profile', {
                description: e instanceof Error ? e.message : 'An error occurred'
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
            <InputField
                name="name"
                label="Full Name"
                placeholder="Please enter your Name"
                register={register}
                error={errors.name}
                validation={{ required: 'Full name is required', minLength: 2 }}
            />

            <InputField
                name="email"
                label="Email"
                placeholder="Please enter your email"
                register={register}
                error={errors.email}
                disabled
            />

            <CountrySelectField
                name="country"
                label="Country"
                control={control}
                error={errors.country}
                required
            />

            <SelectField
                name="investmentGoals"
                label="Investment Goals"
                placeholder="Select your investment goal"
                options={INVESTMENT_GOALS}
                control={control}
                error={errors.investmentGoals}
                required
            />

            <SelectField
                name="riskTolerance"
                label="Risk Tolerance"
                placeholder="Select your risk level"
                options={RISK_TOLERANCE_OPTIONS}
                control={control}
                error={errors.riskTolerance}
                required
            />

            <SelectField
                name="preferredIndustry"
                label="Preferred Industry"
                placeholder="Select your preferred industry"
                options={PREFERRED_INDUSTRIES}
                control={control}
                error={errors.preferredIndustry}
                required
            />

            <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                {isSubmitting ? 'Updating...' : 'Update Profile'}
            </Button>
        </form>
    );
};

export default ProfileForm;
