import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata:Metadata={title:"Profile"};
export default async function CustomerProfilePage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login?next=/customer/profile");
 const {data:profile}=await supabase.from("profiles").select("full_name,phone,account_type").eq("id",user.id).maybeSingle();
 return <div className="mx-auto max-w-2xl space-y-6"><div><h1 className="text-3xl font-semibold">Profile</h1><p className="mt-2 text-muted-foreground">Manage your customer contact details.</p></div><div className="rounded-xl border bg-card p-6"><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{user.email??"—"}</p><p className="mt-4 text-sm text-muted-foreground">Account type</p><p className="font-medium">{profile?.account_type??"CUSTOMER"}</p></div><ProfileForm initialName={profile?.full_name??""} initialPhone={profile?.phone??""}/></div>;
}
