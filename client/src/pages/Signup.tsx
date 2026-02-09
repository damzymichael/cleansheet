import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EyeOffIcon, EyeIcon, Mail, Lock, User } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

// Todo Fix error messages
// Todo password parameters
// Todo Fix top padding and centering aligment
const roleItems = [
    { label: "Owner", value: "owner" },
    { label: "Manager", value: "manager" },
    { label: "Staff", value: "staff" },
];

const signupSchema = z.object({
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    fullName: z.string().min(1, "Please enter your fullname"),
    password: z
        .string()
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least one special character"),
    confirmPassword: z
        .string()
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least one special character"),
    role: z.enum(["owner", "manager", "staff"]),
});

function Signup() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: { email: "", fullName: "", password: "", confirmPassword: "", role: "owner" },
    });

    function onSubmit(data: z.infer<typeof signupSchema>) {
        console.log(data);
        if (false) console.log(data);
        toast.success("Success");
        form.reset();
    }
    return (
        <div className="min-h-screen py-10 gap-4 px-4 bg-background">
            <div className="max-w-150 mx-auto">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold">Laundry</CardTitle>
                        <CardDescription className="text-primary dark:text-white text-lg">
                            Sign up to manage your business
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <FieldGroup>
                                <Controller
                                    name="fullName"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor="name">Full name</FieldLabel>
                                            <InputGroup>
                                                <InputGroupAddon align="inline-start">
                                                    <User />
                                                </InputGroupAddon>
                                                <InputGroupInput
                                                    {...field}
                                                    aria-invalid={fieldState.invalid}
                                                    id="name"
                                                    type="text"
                                                    placeholder="John Doe"
                                                />
                                            </InputGroup>
                                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                        </Field>
                                    )}
                                />
                                <Controller
                                    name="email"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor="email">Email</FieldLabel>
                                            <InputGroup>
                                                <InputGroupAddon align="inline-start">
                                                    <Mail />
                                                </InputGroupAddon>
                                                <InputGroupInput
                                                    {...field}
                                                    aria-invalid={fieldState.invalid}
                                                    id="email"
                                                    type="email"
                                                    placeholder="johndoe@example.com"
                                                />
                                            </InputGroup>
                                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                        </Field>
                                    )}
                                />

                                <Field className="grid grid-cols-2 gap-4">
                                    <Controller
                                        name="password"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                                <InputGroup>
                                                    <InputGroupAddon align="inline-start">
                                                        <Lock />
                                                    </InputGroupAddon>
                                                    <InputGroupInput
                                                        {...field}
                                                        aria-invalid={fieldState.invalid}
                                                        id="password"
                                                        type={showPassword ? "text" : "password"}
                                                        // placeholder="••••••••"
                                                        placeholder="Enter password"
                                                    />
                                                    <InputGroupAddon
                                                        className="cursor-pointer"
                                                        align="inline-end"
                                                        onClick={() => setShowPassword(showPassword => !showPassword)}
                                                    >
                                                        {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                                                    </InputGroupAddon>
                                                </InputGroup>
                                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        name="confirmPassword"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel htmlFor="password">Confirm Password</FieldLabel>
                                                <InputGroup>
                                                    <InputGroupAddon align="inline-start">
                                                        <Lock />
                                                    </InputGroupAddon>
                                                    <InputGroupInput
                                                        {...field}
                                                        aria-invalid={fieldState.invalid}
                                                        id="password"
                                                        type={showPassword ? "text" : "password"}
                                                        // placeholder="••••••••"
                                                        placeholder="Enter password"
                                                    />
                                                    <InputGroupAddon
                                                        className="cursor-pointer"
                                                        align="inline-end"
                                                        onClick={() => setShowPassword(showPassword => !showPassword)}
                                                    >
                                                        {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                                                    </InputGroupAddon>
                                                </InputGroup>
                                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                            </Field>
                                        )}
                                    />
                                </Field>

                                <Controller
                                    name="role"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor="form-role">Role</FieldLabel>
                                            <Select
                                                name={field.name}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                items={roleItems}
                                                defaultValue={null}
                                            >
                                                <SelectTrigger id="form-role" aria-invalid={fieldState.invalid}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {roleItems.map(item => (
                                                            <SelectItem key={item.value} value={item.value}>
                                                                {item.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                        </Field>
                                    )}
                                />
                            </FieldGroup>

                            <Field className="mt-10">
                                <Button type="submit" className="font-semibold">
                                    Create my account
                                </Button>

                                <FieldDescription className="text-center">
                                    Already have an account? <a href="#">Log in</a>
                                </FieldDescription>
                            </Field>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default Signup;
