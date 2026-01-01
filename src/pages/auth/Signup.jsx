import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { signupUser } from "@/services/auth.service";

/* ---------------- Schema ---------------- */
const schema = z
  .object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    confirm: z.string(),
    country: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export default function Signup() {
  const [role, setRole] = useState("user");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      if (role === "user" && !data.country) {
        alert("Country is required for users");
        return;
      }

      await signupUser({
        ...data,
        role,
        country: role === "admin" ? null : data.country.toLowerCase(),
      });

      alert("Account created successfully");
      window.location.hash = "/login";
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: "url('/img/signup1.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/40"></div>

      <Card className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-2xl">
            Create Account
          </CardTitle>
          <CardDescription className="text-center">
            Sign up to continue
          </CardDescription>
        </CardHeader>

        <CardContent className="max-h-[85vh] overflow-y-auto">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div>
              <Label>Username</Label>
              <Input {...register("username")} />
            </div>

            <div>
              <Label>Email</Label>
              <Input {...register("email")} />
            </div>

            {/* ROLE */}
            <div className="space-y-2">
              <Label>Signup as</Label>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="user"
                    checked={role === "user"}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  User
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="admin"
                    checked={role === "admin"}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  Admin
                </label>
              </div>
            </div>

            {/* COUNTRY ONLY FOR USER */}
            {role === "user" && (
              <div>
                <Label>Country</Label>
                <select
                  {...register("country")}
                  className="w-full rounded-md border px-3 py-2"
                >
                  <option value="">Select Country</option>
                  <option value="india">India</option>
                  <option value="usa">USA</option>
                  <option value="japan">Japan</option>
                </select>
              </div>
            )}

            <div>
              <Label>Password</Label>
              <Input type="password" {...register("password")} />
            </div>

            <div>
              <Label>Confirm Password</Label>
              <Input type="password" {...register("confirm")} />
            </div>

            <Button className="w-full">Sign Up</Button>

            <p className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:underline">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
