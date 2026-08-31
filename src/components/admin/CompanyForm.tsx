"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Company } from "@/types/company";
import { Building2, Image as ImageIcon } from "lucide-react";

const companySchema = z.object({
  name: z.string().min(1, "Name is required"),
  com_category_id: z.string().min(1, "Category ID is required"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  detail: z.string().optional(),
  website: z.string().url("Invalid URL").or(z.literal("")).optional(),
  facebook: z.string().url("Invalid URL").or(z.literal("")).optional(),
  twitter: z.string().url("Invalid URL").or(z.literal("")).optional(),
  linkedin: z.string().url("Invalid URL").or(z.literal("")).optional(),
  pinterest: z.string().url("Invalid URL").or(z.literal("")).optional(),
  logo: z.any().optional(),
  cover_img: z.any().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyFormProps {
  initialData?: Company | null;
}

export function CompanyForm({ initialData }: CompanyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo || null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.coverImage || null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: initialData?.name || "",
      com_category_id: "5", // Default
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      detail: initialData?.description || "",
      website: initialData?.website || "",
      facebook: "",
      twitter: "",
      linkedin: "",
      pinterest: "",
    },
  });

  const logoFile = watch("logo");
  const coverFile = watch("cover_img");

  useEffect(() => {
    if (logoFile && logoFile.length > 0) {
      const objectUrl = URL.createObjectURL(logoFile[0]);
      setLogoPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [logoFile]);

  useEffect(() => {
    if (coverFile && coverFile.length > 0) {
      const objectUrl = URL.createObjectURL(coverFile[0]);
      setCoverPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [coverFile]);

  const onSubmit = async (data: CompanyFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("com_category_id", data.com_category_id);
      if (data.email) formData.append("email", data.email);
      if (data.phone) formData.append("phone", data.phone);
      if (data.address) formData.append("address", data.address);
      if (data.detail) formData.append("detail", data.detail);
      if (data.website) formData.append("website", data.website);
      if (data.facebook) formData.append("facebook", data.facebook);
      if (data.twitter) formData.append("twitter", data.twitter);
      if (data.linkedin) formData.append("linkedin", data.linkedin);
      if (data.pinterest) formData.append("pinterest", data.pinterest);

      if (data.logo && data.logo.length > 0) {
        formData.append("logo", data.logo[0]);
      }
      if (data.cover_img && data.cover_img.length > 0) {
        formData.append("cover_img", data.cover_img[0]);
      }

      const url = initialData
        ? `/api/admin/companies/${initialData.id}`
        : "/api/admin/companies";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        throw new Error(result.message || "Failed to save company");
      }

      router.push("/admin/companies");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      {error && <div className="text-sm text-destructive font-medium">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>{initialData ? "Edit Company" : "Create Company"}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Name *</label>
            <Input placeholder="Acme Corp" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category ID *</label>
            <Input placeholder="5" {...register("com_category_id")} />
            {errors.com_category_id && <p className="text-xs text-destructive">{errors.com_category_id.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" placeholder="contact@example.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input placeholder="+855 ..." {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Website</label>
            <Input placeholder="https://..." {...register("website")} />
            {errors.website && <p className="text-xs text-destructive">{errors.website.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Input placeholder="Street 123..." {...register("address")} />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message as string}</p>}
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium">Description / Detail</label>
            <Textarea placeholder="Company description..." rows={4} {...register("detail")} />
            {errors.detail && <p className="text-xs text-destructive">{errors.detail.message as string}</p>}
          </div>

          {/* Logo Upload & Preview */}
          <div className="space-y-4">
            <label className="text-sm font-medium block">Logo Image</label>
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 shrink-0 rounded-full border border-dashed border-border bg-muted flex items-center justify-center overflow-hidden relative">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="Logo preview" className="object-cover w-full h-full" />
                ) : (
                  <Building2 size={24} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input type="file" accept="image/*" {...register("logo")} />
                <p className="text-xs text-muted-foreground">Recommended: Square image (1:1 ratio)</p>
              </div>
            </div>
          </div>

          {/* Cover Upload & Preview */}
          <div className="space-y-4">
            <label className="text-sm font-medium block">Cover Image</label>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-full sm:w-48 aspect-video shrink-0 rounded-md border border-dashed border-border bg-muted flex items-center justify-center overflow-hidden relative">
                {coverPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverPreview} alt="Cover preview" className="object-cover w-full h-full" />
                ) : (
                  <ImageIcon size={24} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2 w-full">
                <Input type="file" accept="image/*" {...register("cover_img")} />
                <p className="text-xs text-muted-foreground">Recommended: 16:9 ratio</p>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Company"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
