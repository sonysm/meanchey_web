import { CompanyForm } from "@/components/admin/CompanyForm";

export default function CreateCompanyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Company</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add a new company profile to the platform.
        </p>
      </div>
      <CompanyForm />
    </div>
  );
}
