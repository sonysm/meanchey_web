import { notFound } from "next/navigation";
import { CompanyForm } from "@/components/admin/CompanyForm";
import { getCompanyById } from "@/lib/companies";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCompanyPage({ params }: PageProps) {
  const { id } = await params;
  const company = await getCompanyById(id);

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Company</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update the profile for {company.name}.
        </p>
      </div>
      <CompanyForm initialData={company} />
    </div>
  );
}
