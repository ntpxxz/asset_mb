import { softwareApi } from '@/lib/api-client';
import { EditSoftwareForm } from '@/components/forms/edit-software-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

async function getSoftwareData(id: string) {
  const response = await softwareApi.getById(id);
  return response.data;
}

export default async function EditSoftwarePage({ params }: { params: { id: string } }) {
  const software = await getSoftwareData(params.id);

  if (!software) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/software">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <div className="text-center p-6">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Software Not Found</h3>
          <p className="text-gray-600">The requested software license could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href={`/software/${software.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Software License</h1>
          <p className="text-gray-600">{software.softwareName}</p>
        </div>
      </div>

      <EditSoftwareForm software={software} />
    </div>
  );
}
