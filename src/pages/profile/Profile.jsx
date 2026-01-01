import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import Navbar from "@/components/common/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

import {
  User,
  Mail,
  Globe,
  LogOut,
  Lock,
  ChevronRight,
} from "lucide-react";

import { db } from "@/db";

/* ---------------- Password Schema ---------------- */
const passwordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function Profile() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  /* ---------------- Logout ---------------- */
  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  /* ---------------- Change Password ---------------- */
  const onChangePassword = async (data) => {
    const dbUser = await db.users.get(user.id);
    if (!dbUser) return alert("User not found");

    if (data.currentPassword !== dbUser.password) {
      return alert("Current password is incorrect");
    }

    await db.users.update(user.id, {
      password: data.newPassword,
    });

    alert("Password updated successfully");
    reset();
    setShowPasswordForm(false);
  };

  return (
    <div className="relative min-h-screen">
      <Navbar />

      {/* 🌿 BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{
          backgroundImage: "url('/img/login1.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-green-900/40 backdrop-blur-sm" />
      </div>

      <div className="mx-auto max-w-md px-4 py-12 space-y-6">
        {/* ---------------- PROFILE CARD ---------------- */}
        <Card className="overflow-hidden rounded-2xl bg-white/80 backdrop-blur shadow-2xl">
          {/* HEADER */}
          {/* <div className="flex flex-col items-center bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-green-600 shadow-lg">
              <User className="h-12 w-12" />
            </div>

            <h2 className="mt-4 text-2xl font-bold tracking-wide">
              {user.username}
            </h2>
            <p className="text-sm opacity-90">{user.email}</p>
          </div> */}

          <CardContent className="space-y-4 p-6 items-center justify-center">
            <ProfileRow
              icon={<User />}
              label="Username"
              value={user.username}
            />
            <ProfileRow
              icon={<Mail />}
              label="Email"
              value={user.email}
            />
            <ProfileRow
              icon={<Globe />}
              label="Country"
              value={user.country || "Not specified"}
            />

            {/* CHANGE PASSWORD */}
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm font-medium text-green-700 shadow-sm hover:bg-green-50"
            >
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Change Password
              </span>
              <ChevronRight
                className={`h-4 w-4 transition ${
                  showPasswordForm ? "rotate-90" : ""
                }`}
              />
            </button>

            {/* LOGOUT */}
            <Button
              variant="destructive"
              className="flex w-full items-center gap-2 rounded-xl"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </CardContent>
        </Card>

        {/* ---------------- PASSWORD FORM ---------------- */}
        {showPasswordForm && (
          <Card className="rounded-2xl bg-white/90 shadow-xl animate-in fade-in slide-in-from-top-4">
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-semibold">
                🔐 Update Password
              </h3>

              <form
                onSubmit={handleSubmit(onChangePassword)}
                className="space-y-4"
              >
                <FormField
                  label="Current Password"
                  type="password"
                  register={register("currentPassword")}
                  error={errors.currentPassword}
                />

                <FormField
                  label="New Password"
                  type="password"
                  register={register("newPassword")}
                  error={errors.newPassword}
                />

                <FormField
                  label="Confirm New Password"
                  type="password"
                  register={register("confirmPassword")}
                  error={errors.confirmPassword}
                />

                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

function ProfileRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-white p-3 shadow-sm">
      <div className="text-green-600">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function FormField({ label, type, register, error }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} {...register} />
      {error && (
        <p className="text-sm text-red-500">{error.message}</p>
      )}
    </div>
  );
}
