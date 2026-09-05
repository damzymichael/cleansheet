import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { EyeOffIcon, EyeIcon, Mail, Lock, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { api, api_instance } from "@/lib/axios";
import { useAuthStore } from "@/store/auth";

const loginSchema = z.object({
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const login = useAuthStore(state => state.login);

    const from = location.state?.from?.pathname || "/";
    const queryParams = new URLSearchParams(location.search);
    const emailParam = queryParams.get("email") || "";

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: emailParam, password: "" },
    });

    const loginMutation = useMutation({
        mutationFn: async (data: z.infer<typeof loginSchema>) => {
            const response = await api_instance.post("/auth/login", data);
            return response.data;
        },
        onSuccess: data => {
            toast.success(data.message || "Login successful");
            login(); // Update auth state
            navigate(from, { replace: true }); // Redirect to previous page or home
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || error.response?.data?.message || "Login failed");
        },
    });

    function onSubmit(data: z.infer<typeof loginSchema>) {
        loginMutation.mutate(data);
    }

    return (
        <div className="h-dvh w-full overflow-y-auto py-8 px-4 bg-background flex items-center justify-center">
            <div className="w-[95%] max-w-150 mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Login to your account</CardTitle>
                        <CardDescription>Enter your email below to login to your account</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <FieldGroup>
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
                                                    placeholder="m@example.com"
                                                />
                                            </InputGroup>
                                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                        </Field>
                                    )}
                                />
                                <Controller
                                    name="password"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <div className="flex items-center">
                                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                                <a
                                                    href="#"
                                                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                                >
                                                    Forgot your password?
                                                </a>
                                            </div>
                                            <InputGroup>
                                                <InputGroupAddon align="inline-start">
                                                    <Lock />
                                                </InputGroupAddon>
                                                <InputGroupInput
                                                    {...field}
                                                    aria-invalid={fieldState.invalid}
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Enter your password"
                                                />
                                                <InputGroupAddon
                                                    className="cursor-pointer"
                                                    align="inline-end"
                                                    onClick={() => setShowPassword(prev => !prev)}
                                                >
                                                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                                                </InputGroupAddon>
                                            </InputGroup>
                                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                        </Field>
                                    )}
                                />
                                <Field className="mt-4">
                                    <Button type="submit" disabled={loginMutation.isPending}>
                                        {loginMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Logging in...
                                            </>
                                        ) : (
                                            "Login"
                                        )}
                                    </Button>
                                    {/* <Button variant="outline" type="button" className="mt-2">
                                        Login with Google
                                    </Button> */}
                                    <FieldDescription className="text-center mt-4">
                                        Don&apos;t have an account? <a href="/signup">Sign up</a>
                                    </FieldDescription>
                                </Field>
                            </FieldGroup>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default Login;
