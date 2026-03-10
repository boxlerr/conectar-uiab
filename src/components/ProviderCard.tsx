import { User, MapPin, Star, Wrench, ShieldCheck, Award, ChevronRight } from "lucide-react";
import { Provider } from "@/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import Link from "next/link";

export function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <Card className="group flex flex-col overflow-hidden h-full border-slate-200">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Cover / Header Section */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex gap-4 items-start relative">
          <div className="w-16 h-16 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0 text-emerald-600 relative overflow-hidden">
             {provider.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={provider.avatarUrl} alt={provider.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8" />
              )}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="font-bold text-lg text-slate-900 truncate pr-10">{provider.name}</h3>
            <div className="flex items-center text-sm mt-1">
              <span className="font-medium text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-md text-xs">
                <Wrench className="w-3.5 h-3.5" />
                {provider.specialty}
              </span>
            </div>
          </div>
          
          <div className="absolute top-6 right-6 flex items-center gap-1 text-amber-500 font-medium bg-white px-2 py-1 rounded-full shadow-sm border border-slate-100 text-sm">
            <Star className="w-4 h-4 fill-amber-500" />
            <span>{provider.rating}</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 flex flex-col flex-1">
          <p className="text-sm text-slate-600 line-clamp-3 mb-4">
            {provider.description}
          </p>

          <div className="space-y-3 mt-auto text-sm text-slate-500 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{provider.experienceYears} años de experiencia</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{provider.zone}</span>
            </div>
          </div>
          
          {provider.certifications.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-hidden">
               <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-100 whitespace-nowrap">
                   <ShieldCheck className="w-3.5 h-3.5" />
                   {provider.certifications[0]}
               </div>
               {provider.certifications.length > 1 && (
                  <div className="flex items-center text-xs font-medium text-slate-500 px-2 py-1 bg-slate-50 rounded border border-slate-100">
                    +{provider.certifications.length - 1}
                  </div>
               )}
            </div>
          )}

          <Link href={`/providers/${provider.id}`} className="block mt-6">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all group-hover:shadow-md">
              Contactar Profesional
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
