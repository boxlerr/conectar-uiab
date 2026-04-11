import { Building, MapPin, Star, Mail, Phone, ChevronRight } from "lucide-react";
import { Company } from "@/tipos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export function CompanyCard({ company }: { company: Company }) {
  return (
    <Card className="group flex flex-col overflow-hidden h-full border-slate-200">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Cover / Header Section */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex gap-4 items-start relative">
          <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0 text-primary-600">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logoUrl} alt={company.name} className="w-10 h-10 object-contain" />
            ) : (
              <Building className="w-8 h-8" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-slate-900 truncate pr-8">{company.name}</h3>
            <div className="flex items-center text-sm text-slate-500 mt-1">
              <Badge variant="secondary" className="font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 border-none">
                {company.category}
              </Badge>
            </div>
          </div>
          
          <div className="absolute top-6 right-6 flex items-center gap-1 text-amber-500 font-medium">
            <Star className="w-4 h-4 fill-amber-500" />
            <span>{company.rating}</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 flex flex-col flex-1">
          <p className="text-sm text-slate-600 line-clamp-2 mb-4">
            {company.description}
          </p>

          <div className="space-y-2 mt-auto text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{company.address}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
            {company.servicesOffered.slice(0, 3).map((service, idx) => (
              <div key={idx} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                {service}
              </div>
            ))}
            {company.servicesOffered.length > 3 && (
              <div className="text-xs px-2 py-1 bg-slate-50 text-slate-400 rounded-md">
                +{company.servicesOffered.length - 3} más
              </div>
            )}
          </div>

          <Link href={`/companies/${company.id}`} className="block mt-6">
            <Button variant="outline" className="w-full group-hover:bg-primary-50 group-hover:text-primary-700 group-hover:border-primary-200 transition-colors">
              Ver perfil completo
              <ChevronRight className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
